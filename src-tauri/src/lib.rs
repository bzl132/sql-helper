use calamine::{open_workbook, Reader, Xlsx};
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs::File;
use std::io::{self, Read};
use std::path::Path;
use tauri::Manager;

#[derive(Serialize, Deserialize, Debug)]
struct FieldMappingInfo {
    #[serde(rename = "dbField")]
    db_field: String,
    #[serde(rename = "csvIndex")]
    csv_index: usize,
    #[serde(rename = "fieldType")]
    field_type: Option<String>, // 添加字段类型，使用Option因为可能为空
}

#[tauri::command]
fn parse_excel_file(file_path: String) -> Result<Vec<Vec<String>>, String> {
    let path = Path::new(&file_path);

    // 打开Excel文件
    let mut workbook: Xlsx<_> = match open_workbook(path) {
        Ok(wb) => wb,
        Err(e) => return Err(format!("无法打开Excel文件: {}", e)),
    };

    // 获取第一个工作表
    let sheet_name = match workbook.sheet_names().first() {
        Some(name) => name.clone(),
        None => return Err("Excel文件中没有工作表".to_string()),
    };

    let range = match workbook.worksheet_range(&sheet_name) {
        Some(Ok(range)) => range,
        Some(Err(e)) => return Err(format!("无法读取工作表: {}", e)),
        None => return Err("找不到指定的工作表".to_string()),
    };

    // 将Excel数据转换为字符串二维数组
    let mut result = Vec::new();
    for row in range.rows() {
        let mut row_data = Vec::new();
        for cell in row {
            row_data.push(cell.to_string());
        }
        result.push(row_data);
    }

    Ok(result)
}

#[tauri::command]
fn read_java_file(file_path: &str) -> Result<Vec<String>, String> {
    let content = read_file(file_path).map_err(|e| e.to_string())?;
    Ok(extract_fields_from_java(&content))
}

#[tauri::command]
fn read_mybatis_file(file_path: &str) -> Result<Vec<String>, String> {
    let content = read_file(file_path).map_err(|e| e.to_string())?;
    Ok(extract_fields_from_mybatis(&content))
}

#[tauri::command]
fn generate_mongodb_script(
    csv_data: Vec<Vec<String>>,
    field_mappings: HashMap<String, FieldMappingInfo>,
    condition_field: String,
    update_fields: Vec<String>,
    table_name: String,
) -> Result<String, String> {
    // println!(
    //     "generate_mongodb_script start : {}, {:?}",
    //     table_name, field_mappings
    // );
    let mut script = String::new();

    // 检查CSV数据是否为空
    if csv_data.is_empty() || csv_data.len() <= 1 {
        return Ok(script);
    }

    // 为每一行 CSV 数据生成一个 MongoDB 更新语句
    for row in &csv_data {
        let mut condition_value = String::new();
        let mut update_values = HashMap::new();

        // 遍历字段映射
        for (_, mapping_info) in &field_mappings {
            let csv_index = mapping_info.csv_index;
            let db_field = &mapping_info.db_field;
            let field_type = &mapping_info.field_type;

            // 确保索引在有效范围内
            if csv_index < row.len() {
                let value = &row[csv_index];

                // 检查是否是条件字段
                if db_field == &condition_field {
                    condition_value = value.to_string();
                }

                // 检查是否是更新字段
                if update_fields.contains(db_field) {
                    update_values.insert(db_field.clone(), (value.to_string(), field_type.clone()));
                }
            }
        }

        // 生成 MongoDB 更新语句
        if !condition_value.is_empty() && !update_values.is_empty() {
            // 处理条件字段的值
            let condition_field_type = field_mappings.values()
                .find(|info| &info.db_field == &condition_field)
                .and_then(|info| info.field_type.clone());
            
            // 根据条件字段类型格式化条件值
            let formatted_condition_value = if let Some(type_str) = condition_field_type {
                if type_str.contains("Integer") || type_str.contains("Long") || 
                   type_str.contains("Double") || type_str.contains("Float") {
                    // 数字类型，不加引号
                    if condition_value.is_empty() {
                        "null".to_string()
                    } else {
                        condition_value
                    }
                } else if type_str.contains("Boolean") {
                    // 布尔类型
                    let bool_value = condition_value.to_lowercase();
                    if bool_value == "true" || bool_value == "1" {
                        "true".to_string()
                    } else if bool_value == "false" || bool_value == "0" {
                        "false".to_string()
                    } else if condition_value.is_empty() {
                        "null".to_string()
                    } else {
                        format!("\'{}\'", condition_value)
                    }
                } else {
                    // 字符串类型，加引号
                    format!("\'{}\'", condition_value)
                }
            } else {
                // 默认作为字符串处理
                format!("\'{}\'", condition_value)
            };

            script.push_str(&format!(
                "db.{}.updateOne({{ {}: {} }}, {{ $set: {{ ",
                table_name, condition_field, formatted_condition_value
            ));

            let mut first = true;
            for (field, (value, field_type)) in &update_values {
                if !first {
                    script.push_str(", ");
                }
                
                // 根据字段类型处理值
                if let Some(type_str) = field_type {
                    if type_str.contains("LocalDateTime") || type_str.contains("LocalDate") || type_str.contains("Date") {
                        // 日期时间类型
                        if value.is_empty() {
                            script.push_str(&format!("\"{}\": null", field));
                        } else {
                            script.push_str(&format!("\"{}\": ISODate(\"{}\")", field, value));
                        }
                    } else if type_str.contains("Integer") || type_str.contains("Long") || 
                              type_str.contains("Double") || type_str.contains("Float") {
                        // 数字类型，不加引号
                        if value.is_empty() {
                            script.push_str(&format!("\"{}\": null", field));
                        } else {
                            script.push_str(&format!("\"{}\": {}", field, value));
                        }
                    } else if type_str.contains("Boolean") {
                        // 布尔类型
                        let bool_value = value.to_lowercase();
                        if bool_value == "true" || bool_value == "1" {
                            script.push_str(&format!("\"{}\": true", field));
                        } else if bool_value == "false" || bool_value == "0" {
                            script.push_str(&format!("\"{}\": false", field));
                        } else if value.is_empty() {
                            script.push_str(&format!("\"{}\": null", field));
                        } else {
                            script.push_str(&format!("\"{}\": {}", field, value));
                        }
                    } else if type_str.contains("String") {
                        // 字符串类型，加引号
                        if value.is_empty() {
                            script.push_str(&format!("\"{}\": null", field));
                        } else {
                            // 转义双引号
                            let escaped_value = value.replace("\"", "\\\"");
                            script.push_str(&format!("\"{}\": \'{}\'", field, escaped_value));
                        }
                    } else {
                        // 其他类型，作为字符串处理
                        if value.is_empty() {
                            script.push_str(&format!("\"{}\": null", field));
                        } else {
                            script.push_str(&format!("\"{}\": {}", field, value));
                        }
                    }
                } else {
                    // 没有类型信息，作为字符串处理
                    if value.is_empty() {
                        script.push_str(&format!("\"{}\": null", field));
                    } else {
                        // 转义双引号
                        let escaped_value = value.replace("\"", "\\\"");
                        script.push_str(&format!("\"{}\": \'{}\'", field, escaped_value));
                    }
                }
                first = false;
            }

            script.push_str(" } });\n");
        }
    }

    println!(
        "generate_mongodb_script end : {}, script length: {}",
        table_name,
        script.len()
    );
    Ok(script)
}

#[tauri::command]
fn generate_mysql_script(
    csv_data: Vec<Vec<String>>,
    field_mappings: HashMap<String, FieldMappingInfo>,
    condition_field: String,
    update_fields: Vec<String>,
    table_name: String,
) -> Result<String, String> {
    println!(
        "generate_mysql_script start : {}, {:?}",
        table_name, field_mappings
    );
    let mut script = String::new();

    // 检查CSV数据是否为空
    if csv_data.is_empty() || csv_data.len() <= 1 {
        return Ok(script);
    }

    // 为每一行 CSV 数据生成一个 MySQL 更新语句
    for row in &csv_data {
        let mut condition_value = String::new();
        let mut update_values = HashMap::new();

        // 遍历字段映射
        for (_, mapping_info) in &field_mappings {
            let csv_index = mapping_info.csv_index;
            let db_field = &mapping_info.db_field;
            let field_type = &mapping_info.field_type;

            // 确保索引在有效范围内
            if csv_index < row.len() {
                let value = &row[csv_index];

                // 检查是否是条件字段
                if db_field == &condition_field {
                    condition_value = value.to_string();
                }

                // 检查是否是更新字段
                if update_fields.contains(db_field) {
                    update_values.insert(db_field.clone(), (value.to_string(), field_type.clone()));
                }
            }
        }

        // 生成 MySQL 更新语句
        if !condition_value.is_empty() && !update_values.is_empty() {
            script.push_str(&format!("UPDATE {} SET ", table_name));

            let mut first = true;
            for (field, (value, field_type)) in &update_values {
                if !first {
                    script.push_str(", ");
                }
                
                // 根据字段类型处理值
                if let Some(type_str) = field_type {
                    if type_str.contains("LocalDateTime") {
                        // LocalDateTime 类型
                        script.push_str(&format!("{} = STR_TO_DATE('{}', '%Y-%m-%dT%H:%i:%s')", field, value));
                    } else if type_str.contains("LocalDate") || type_str.contains("Date") {
                        // LocalDate 或 Date 类型
                        script.push_str(&format!("{} = STR_TO_DATE('{}', '%Y-%m-%d')", field, value));
                    } else if type_str.contains("Integer") || type_str.contains("Long") || type_str.contains("Double") || type_str.contains("Float") {
                        // 数字类型，不加引号
                        if value.is_empty() {
                            script.push_str(&format!("{} = NULL", field));
                        } else {
                            script.push_str(&format!("{} = {}", field, value));
                        }
                    } else if type_str.contains("Boolean") {
                        // 布尔类型
                        let bool_value = value.to_lowercase();
                        if bool_value == "true" || bool_value == "1" {
                            script.push_str(&format!("{} = TRUE", field));
                        } else if bool_value == "false" || bool_value == "0" {
                            script.push_str(&format!("{} = FALSE", field));
                        } else if value.is_empty() {
                            script.push_str(&format!("{} = NULL", field));
                        } else {
                            script.push_str(&format!("{} = '{}'", field, value));
                        }
                    } else {
                        // 其他类型，作为字符串处理
                        if value.is_empty() {
                            script.push_str(&format!("{} = NULL", field));
                        } else {
                            // 转义单引号
                            let escaped_value = value.replace("'", "''");
                            script.push_str(&format!("{} = '{}'", field, escaped_value));
                        }
                    }
                } else {
                    // 没有类型信息，作为字符串处理
                    if value.is_empty() {
                        script.push_str(&format!("{} = NULL", field));
                    } else {
                        // 转义单引号
                        let escaped_value = value.replace("'", "''");
                        script.push_str(&format!("{} = '{}'", field, escaped_value));
                    }
                }
                first = false;
            }

            // 处理条件字段的值
            let condition_field_type = field_mappings.values().find(|info| &info.db_field == &condition_field).and_then(|info| info.field_type.clone());
            
            if let Some(type_str) = condition_field_type {
                if type_str.contains("LocalDateTime") {
                    script.push_str(&format!(" WHERE {} = STR_TO_DATE('{}', '%Y-%m-%dT%H:%i:%s');\n", condition_field, condition_value));
                } else if type_str.contains("LocalDate") || type_str.contains("Date") {
                    script.push_str(&format!(" WHERE {} = STR_TO_DATE('{}', '%Y-%m-%d');\n", condition_field, condition_value));
                } else if type_str.contains("Integer") || type_str.contains("Long") || type_str.contains("Double") || type_str.contains("Float") {
                    script.push_str(&format!(" WHERE {} = {};\n", condition_field, condition_value));
                } else if type_str.contains("Boolean") {
                    let bool_value = condition_value.to_lowercase();
                    if bool_value == "true" || bool_value == "1" {
                        script.push_str(&format!(" WHERE {} = TRUE;\n", condition_field));
                    } else if bool_value == "false" || bool_value == "0" {
                        script.push_str(&format!(" WHERE {} = FALSE;\n", condition_field));
                    } else {
                        script.push_str(&format!(" WHERE {} = '{}';\n", condition_field, condition_value));
                    }
                } else {
                    // 转义单引号
                    let escaped_value = condition_value.replace("'", "''");
                    script.push_str(&format!(" WHERE {} = '{}';\n", condition_field, escaped_value));
                }
            } else {
                // 转义单引号
                let escaped_value = condition_value.replace("'", "''");
                script.push_str(&format!(" WHERE {} = '{}';\n", condition_field, escaped_value));
            }
        }
    }

    println!(
        "generate_mysql_script end : {}, script length: {}",
        table_name,
        script.len()
    );
    Ok(script)
}

#[tauri::command]
fn generate_mongodb_insert_script(
    csv_data: Vec<Vec<String>>,
    field_mappings: HashMap<String, FieldMappingInfo>,
    table_name: String,
) -> Result<String, String> {
    // println!(
    //     "generate_mongodb_insert_script start : {}, {:?}",
    //     table_name, field_mappings
    // );
    let mut script = String::new();

    // 检查CSV数据是否为空
    if csv_data.is_empty() || csv_data.len() <= 1 {
        return Ok(script);
    }

    // 为每一行 CSV 数据生成一个 MongoDB 插入语句
    for row in &csv_data {
        let mut insert_values = HashMap::new();

        // 遍历字段映射
        for (_, mapping_info) in &field_mappings {
            let csv_index = mapping_info.csv_index;
            let db_field = &mapping_info.db_field;
            let field_type = &mapping_info.field_type;

            // 确保索引在有效范围内
            if csv_index < row.len() {
                let value = &row[csv_index];
                insert_values.insert(db_field.clone(), (value.to_string(), field_type.clone()));
            }
        }

        // 生成 MongoDB 插入语句
        if !insert_values.is_empty() {
            script.push_str(&format!("db.{}.insertOne({{ ", table_name));

            let mut first = true;
            for (field, (value, field_type)) in &insert_values {
                if !first {
                    script.push_str(", ");
                }
                
                // 根据字段类型处理值
                if let Some(type_str) = field_type {
                    if type_str.contains("LocalDateTime") || type_str.contains("LocalDate") || type_str.contains("Date") {
                        // 日期时间类型
                        if value.is_empty() {
                            script.push_str(&format!("\"{}\": null", field));
                        } else {
                            // 使用new Date()格式
                            script.push_str(&format!("\"{}\": new Date(\"{}\")", field, value));
                        }
                    } else if type_str.contains("Timestamp") {
                        // 时间戳类型
                        if value.is_empty() {
                            script.push_str(&format!("\"{}\": null", field));
                        } else {
                            // 使用new Timestamp()格式
                            script.push_str(&format!("\"{}\": new Timestamp()", field));
                        }
                    } else if type_str.contains("ObjectId") {
                        // ObjectId类型
                        if value.is_empty() {
                            script.push_str(&format!("\"{}\": null", field));
                        } else if value.len() == 24 && value.chars().all(|c| c.is_ascii_hexdigit()) {
                            // 如果是有效的ObjectId格式（24位十六进制）
                            script.push_str(&format!("\"{}\": ObjectId(\"{}\")", field, value));
                        } else {
                            // 否则作为字符串处理
                            script.push_str(&format!("\"{}\": \"{}\"", field, value));
                        }
                    } else if type_str.contains("Integer") {
                        // 整数类型
                        if value.is_empty() {
                            script.push_str(&format!("\"{}\": null", field));
                        } else {
                            // 使用NumberInt()格式
                            script.push_str(&format!("\"{}\": NumberInt({})", field, value));
                        }
                    } else if type_str.contains("Long") {
                        // 长整数类型
                        if value.is_empty() {
                            script.push_str(&format!("\"{}\": null", field));
                        } else {
                            // 使用NumberLong()格式
                            script.push_str(&format!("\"{}\": NumberLong({})", field, value));
                        }
                    } else if type_str.contains("Double") || type_str.contains("Float") {
                        // 浮点数类型
                        if value.is_empty() {
                            script.push_str(&format!("\"{}\": null", field));
                        } else {
                            // 直接使用数字值
                            script.push_str(&format!("\"{}\": {}", field, value));
                        }
                    } else if type_str.contains("Decimal") {
                        // Decimal128类型
                        if value.is_empty() {
                            script.push_str(&format!("\"{}\": null", field));
                        } else {
                            // 使用NumberDecimal()格式
                            script.push_str(&format!("\"{}\": NumberDecimal(\"{}\")", field, value));
                        }
                    } else if type_str.contains("Boolean") {
                        // 布尔类型
                        let bool_value = value.to_lowercase();
                        if bool_value == "true" || bool_value == "1" {
                            script.push_str(&format!("\"{}\": true", field));
                        } else if bool_value == "false" || bool_value == "0" {
                            script.push_str(&format!("\"{}\": false", field));
                        } else if value.is_empty() {
                            script.push_str(&format!("\"{}\": null", field));
                        } else {
                            script.push_str(&format!("\"{}\": \"{}\"", field, value));
                        }
                    } else if type_str.contains("Binary") {
                        // Binary类型
                        if value.is_empty() {
                            script.push_str(&format!("\"{}\": null", field));
                        } else {
                            // 使用BinData格式
                            script.push_str(&format!("\"{}\": BinData(0, \"{}\")", field, value));
                        }
                    } else if type_str.contains("RegExp") {
                        // 正则表达式类型
                        if value.is_empty() {
                            script.push_str(&format!("\"{}\": null", field));
                        } else {
                            // 使用RegExp格式
                            script.push_str(&format!("\"{}\": RegExp(\"{}\")", field, value));
                        }
                    } else if type_str.contains("MinKey") {
                        // MinKey类型
                        script.push_str(&format!("\"{}\": MinKey()", field));
                    } else if type_str.contains("MaxKey") {
                        // MaxKey类型
                        script.push_str(&format!("\"{}\": MaxKey()", field));
                    } else if type_str.contains("Code") {
                        // Code类型
                        if value.is_empty() {
                            script.push_str(&format!("\"{}\": null", field));
                        } else {
                            // 使用Code格式
                            script.push_str(&format!("\"{}\": Code(\"{}\")", field, value));
                        }
                    } else if type_str.contains("Object") {
                        // 对象类型
                        if value.is_empty() {
                            script.push_str(&format!("\"{}\": null", field));
                        } else if value.starts_with("{") && value.ends_with("}") {
                            // 如果已经是JSON格式，直接使用
                            script.push_str(&format!("\"{}\": {}", field, value));
                        } else {
                            // 否则作为字符串处理
                            script.push_str(&format!("\"{}\": \"{}\"", field, value));
                        }
                    } else if type_str.contains("Array") {
                        // 数组类型
                        if value.is_empty() {
                            script.push_str(&format!("\"{}\": null", field));
                        } else if value.starts_with("[") && value.ends_with("]") {
                            // 如果已经是数组格式，直接使用
                            script.push_str(&format!("\"{}\": {}", field, value));
                        } else {
                            // 尝试将逗号分隔的值转换为数组
                            let array_items = value.split(',').map(|s| format!("\"{}\"", s.trim())).collect::<Vec<String>>().join(", ");
                            script.push_str(&format!("\"{}\": [{}]", field, array_items));
                        }
                    } else if type_str.contains("String") {
                        // 字符串类型，加引号
                        if value.is_empty() {
                            script.push_str(&format!("\"{}\": null", field));
                        } else {
                            // 转义双引号
                            let escaped_value = value.replace("\"", "\\\"");
                            script.push_str(&format!("\"{}\": \"{}\"", field, escaped_value));
                        }
                    } else {
                        // 其他类型，作为字符串处理
                        if value.is_empty() {
                            script.push_str(&format!("\"{}\": null", field));
                        } else {
                            // 转义双引号
                            let escaped_value = value.replace("\"", "\\\"");
                            script.push_str(&format!("\"{}\": \"{}\"", field, escaped_value));
                        }
                    }
                } else {
                    // 没有类型信息，作为字符串处理
                    if value.is_empty() {
                        script.push_str(&format!("\"{}\": null", field));
                    } else {
                        // 转义双引号
                        let escaped_value = value.replace("\"", "\\\"");
                        script.push_str(&format!("\"{}\": \"{}\"", field, escaped_value));
                    }
                }
                first = false;
            }

            script.push_str(" });");
            script.push_str("\n");
        }
    }

    println!(
        "generate_mongodb_insert_script end : {}, script length: {}",
        table_name,
        script.len()
    );
    Ok(script)
}

#[tauri::command]
fn generate_mongodb_delete_script(
    csv_data: Vec<Vec<String>>,
    field_mappings: HashMap<String, FieldMappingInfo>,
    condition_field: String,
    table_name: String,
) -> Result<String, String> {
    println!(
        "generate_mongodb_delete_script start : {}, {:?}",
        table_name, field_mappings
    );
    let mut script = String::new();

    // 检查CSV数据是否为空
    if csv_data.is_empty() || csv_data.len() <= 1 {
        return Ok(script);
    }

    // 为每一行 CSV 数据生成一个 MongoDB 删除语句
    for row in &csv_data {
        let mut condition_value = String::new();
        let mut condition_field_type = None;

        // 遍历字段映射
        for (_, mapping_info) in &field_mappings {
            let csv_index = mapping_info.csv_index;
            let db_field = &mapping_info.db_field;
            let field_type = &mapping_info.field_type;

            // 确保索引在有效范围内
            if csv_index < row.len() && db_field == &condition_field {
                let value = &row[csv_index];
                condition_value = value.to_string();
                condition_field_type = field_type.clone();
                break;
            }
        }

        // 生成 MongoDB 删除语句
        if !condition_value.is_empty() {
            // 根据条件字段类型格式化条件值
            let formatted_condition_value = if let Some(type_str) = condition_field_type {
                if type_str.contains("Integer") || type_str.contains("Long") || 
                   type_str.contains("Double") || type_str.contains("Float") {
                    // 数字类型，不加引号
                    condition_value
                } else if type_str.contains("Boolean") {
                    // 布尔类型
                    let bool_value = condition_value.to_lowercase();
                    if bool_value == "true" || bool_value == "1" {
                        "true".to_string()
                    } else if bool_value == "false" || bool_value == "0" {
                        "false".to_string()
                    } else {
                        format!("\'{}\'", condition_value)
                    }
                } else {
                    // 字符串类型，加引号
                    format!("\'{}\'", condition_value)
                }
            } else {
                // 默认作为字符串处理
                format!("\'{}\'", condition_value)
            };

            script.push_str(&format!(
                "db.{}.deleteOne({{ {}: {} }});\n",
                table_name, condition_field, formatted_condition_value
            ));
        }
    }

    println!(
        "generate_mongodb_delete_script end : {}, script length: {}",
        table_name,
        script.len()
    );
    Ok(script)
}

#[tauri::command]
fn generate_mysql_insert_script(
    csv_data: Vec<Vec<String>>,
    field_mappings: HashMap<String, FieldMappingInfo>,
    table_name: String,
) -> Result<String, String> {
    println!(
        "generate_mysql_insert_script start : {}, {:?}",
        table_name, field_mappings
    );
    let mut script = String::new();

    // 检查CSV数据是否为空
    if csv_data.is_empty() || csv_data.len() <= 1 {
        return Ok(script);
    }

    // 为每一行 CSV 数据生成一个 MySQL 插入语句
    for row in &csv_data {
        let mut fields = Vec::new();
        let mut values = Vec::new();

        // 遍历字段映射
        for (_, mapping_info) in &field_mappings {
            let csv_index = mapping_info.csv_index;
            let db_field = &mapping_info.db_field;
            let field_type = &mapping_info.field_type;

            // 确保索引在有效范围内
            if csv_index < row.len() {
                let value = &row[csv_index];
                fields.push(db_field.clone());
                
                // 根据字段类型处理值
                if let Some(type_str) = field_type {
                    if type_str.contains("LocalDateTime") {
                        // LocalDateTime 类型
                        if value.is_empty() {
                            values.push("NULL".to_string());
                        } else {
                            values.push(format!("STR_TO_DATE('{}', '%Y-%m-%dT%H:%i:%s')", value));
                        }
                    } else if type_str.contains("LocalDate") || type_str.contains("Date") {
                        // LocalDate 或 Date 类型
                        if value.is_empty() {
                            values.push("NULL".to_string());
                        } else {
                            values.push(format!("STR_TO_DATE('{}', '%Y-%m-%d')", value));
                        }
                    } else if type_str.contains("Integer") || type_str.contains("Long") || type_str.contains("Double") || type_str.contains("Float") {
                        // 数字类型，不加引号
                        if value.is_empty() {
                            values.push("NULL".to_string());
                        } else {
                            values.push(value.clone());
                        }
                    } else if type_str.contains("Boolean") {
                        // 布尔类型
                        let bool_value = value.to_lowercase();
                        if bool_value == "true" || bool_value == "1" {
                            values.push("TRUE".to_string());
                        } else if bool_value == "false" || bool_value == "0" {
                            values.push("FALSE".to_string());
                        } else if value.is_empty() {
                            values.push("NULL".to_string());
                        } else {
                            // 转义单引号
                            let escaped_value = value.replace("'", "''");
                            values.push(format!("'{}'", escaped_value));
                        }
                    } else {
                        // 其他类型，作为字符串处理
                        if value.is_empty() {
                            values.push("NULL".to_string());
                        } else {
                            // 转义单引号
                            let escaped_value = value.replace("'", "''");
                            values.push(format!("'{}'", escaped_value));
                        }
                    }
                } else {
                    // 没有类型信息，作为字符串处理
                    if value.is_empty() {
                        values.push("NULL".to_string());
                    } else {
                        // 转义单引号
                        let escaped_value = value.replace("'", "''");
                        values.push(format!("'{}'", escaped_value));
                    }
                }
            }
        }

        // 生成 MySQL 插入语句
        if !fields.is_empty() {
            script.push_str(&format!(
                "INSERT INTO {} ({}) VALUES ({});\n",
                table_name,
                fields.join(", "),
                values.join(", ")
            ));
        }
    }

    println!(
        "generate_mysql_insert_script end : {}, script length: {}",
        table_name,
        script.len()
    );
    Ok(script)
}

#[tauri::command]
fn generate_mysql_delete_script(
    csv_data: Vec<Vec<String>>,
    field_mappings: HashMap<String, FieldMappingInfo>,
    condition_field: String,
    table_name: String,
) -> Result<String, String> {
    println!(
        "generate_mysql_delete_script start : {}, {:?}",
        table_name, field_mappings
    );
    let mut script = String::new();

    // 检查CSV数据是否为空
    if csv_data.is_empty() || csv_data.len() <= 1 {
        return Ok(script);
    }

    // 为每一行 CSV 数据生成一个 MySQL 删除语句
    for row in &csv_data {
        let mut condition_value = String::new();

        // 遍历字段映射
        for (_, mapping_info) in &field_mappings {
            let csv_index = mapping_info.csv_index;
            let db_field = &mapping_info.db_field;
            let field_type = &mapping_info.field_type;

            // 确保索引在有效范围内
            if csv_index < row.len() && db_field == &condition_field {
                let value = &row[csv_index];
                condition_value = value.to_string();
                
                // 生成 MySQL 删除语句
                if !condition_value.is_empty() {
                    // 根据字段类型处理条件值
                    if let Some(type_str) = field_type {
                        if type_str.contains("LocalDateTime") {
                            script.push_str(&format!(
                                "DELETE FROM {} WHERE {} = STR_TO_DATE('{}', '%Y-%m-%dT%H:%i:%s');\n",
                                table_name, condition_field, condition_value
                            ));
                        } else if type_str.contains("LocalDate") || type_str.contains("Date") {
                            script.push_str(&format!(
                                "DELETE FROM {} WHERE {} = STR_TO_DATE('{}', '%Y-%m-%d');\n",
                                table_name, condition_field, condition_value
                            ));
                        } else if type_str.contains("Integer") || type_str.contains("Long") || type_str.contains("Double") || type_str.contains("Float") {
                            script.push_str(&format!(
                                "DELETE FROM {} WHERE {} = {};\n",
                                table_name, condition_field, condition_value
                            ));
                        } else if type_str.contains("Boolean") {
                            let bool_value = condition_value.to_lowercase();
                            if bool_value == "true" || bool_value == "1" {
                                script.push_str(&format!(
                                    "DELETE FROM {} WHERE {} = TRUE;\n",
                                    table_name, condition_field
                                ));
                            } else if bool_value == "false" || bool_value == "0" {
                                script.push_str(&format!(
                                    "DELETE FROM {} WHERE {} = FALSE;\n",
                                    table_name, condition_field
                                ));
                            } else {
                                // 转义单引号
                                let escaped_value = condition_value.replace("'", "''");
                                script.push_str(&format!(
                                    "DELETE FROM {} WHERE {} = '{}';\n",
                                    table_name, condition_field, escaped_value
                                ));
                            }
                        } else {
                            // 转义单引号
                            let escaped_value = condition_value.replace("'", "''");
                            script.push_str(&format!(
                                "DELETE FROM {} WHERE {} = '{}';\n",
                                table_name, condition_field, escaped_value
                            ));
                        }
                    } else {
                        // 没有类型信息，作为字符串处理
                        // 转义单引号
                        let escaped_value = condition_value.replace("'", "''");
                        script.push_str(&format!(
                            "DELETE FROM {} WHERE {} = '{}';\n",
                            table_name, condition_field, escaped_value
                        ));
                    }
                }
                
                break;
            }
        }
    }

    println!(
        "generate_mysql_delete_script end : {}, script length: {}",
        table_name,
        script.len()
    );
    Ok(script)
}

fn read_file(file_path: &str) -> io::Result<String> {
    let mut file = File::open(file_path)?;
    let mut content = String::new();
    file.read_to_string(&mut content)?;
    Ok(content)
}

fn extract_fields_from_java(content: &str) -> Vec<String> {
    let mut fields = Vec::new();

    // 使用正则表达式提取 Java 类中的字段
    // 这是一个简化的实现，可能需要根据实际的 Java 类格式进行调整
    let re = Regex::new(r"(?m)^\s*(private|public|protected)?\s+\w+\s+(\w+)\s*;").unwrap();

    for cap in re.captures_iter(content) {
        if let Some(field_name) = cap.get(2) {
            fields.push(field_name.as_str().to_string());
        }
    }

    fields
}

fn extract_fields_from_mybatis(content: &str) -> Vec<String> {
    let mut fields = Vec::new();

    // 使用正则表达式提取 MyBatis XML 中的字段
    // 这是一个简化的实现，可能需要根据实际的 MyBatis 配置格式进行调整
    let re = Regex::new(r#"<result\s+(?:.*?)\s+property="(\w+)"(?:.*?)>"#).unwrap();

    for cap in re.captures_iter(content) {
        if let Some(field_name) = cap.get(1) {
            fields.push(field_name.as_str().to_string());
        }
    }

    fields
}

// 注册命令
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            read_java_file,
            read_mybatis_file,
            generate_mongodb_script,
            generate_mysql_script,
            generate_mongodb_insert_script,
            generate_mongodb_delete_script,
            parse_excel_file,
            generate_mysql_insert_script,
            generate_mysql_delete_script
        ])
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();

            // 监听窗口关闭事件
            let window_clone = window.clone();
            window.on_window_event(move |event| {
                if let tauri::WindowEvent::CloseRequested { .. } = event {
                    // 执行 JavaScript 清空本地存储
                    let _ = window_clone
                        .eval("localStorage.clear(); console.log('已清空所有本地缓存');");
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
