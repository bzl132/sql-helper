use csv::Reader;
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs::File;
use std::io::{self, Read};
use tauri::Manager;

#[derive(Serialize, Deserialize, Debug)]
struct FieldMappingInfo {
    #[serde(rename = "dbField")]
    db_field: String,
    #[serde(rename = "csvIndex")]
    csv_index: usize,
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
fn read_csv_file(file_path: &str) -> Result<Vec<Vec<String>>, String> {
    let file = File::open(file_path).map_err(|e| e.to_string())?;
    let mut rdr = Reader::from_reader(file);
    let mut result = Vec::new();

    // 读取标题行
    let headers: Vec<String> = rdr
        .headers()
        .map_err(|e| e.to_string())?
        .iter()
        .map(|s| s.to_string())
        .collect();
    result.push(headers);

    // 读取数据行
    for record in rdr.records() {
        let record = record.map_err(|e| e.to_string())?;
        let row: Vec<String> = record.iter().map(|s| s.to_string()).collect();
        result.push(row);
    }

    Ok(result)
}

#[tauri::command]
fn generate_mongodb_script(
    csv_data: Vec<Vec<String>>,
    field_mappings: HashMap<String, FieldMappingInfo>,
    condition_field: String,
    update_fields: Vec<String>,
    table_name: String,
) -> Result<String, String> {
    println!(
        "generate_mongodb_script start : {}, {:?}",
        table_name, field_mappings
    );
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

            // 确保索引在有效范围内
            if csv_index < row.len() {
                let value = &row[csv_index];

                // 检查是否是条件字段
                if db_field == &condition_field {
                    condition_value = value.to_string();
                }

                // 检查是否是更新字段
                if update_fields.contains(db_field) {
                    update_values.insert(db_field.clone(), value.to_string());
                }
            }
        }

        // 生成 MongoDB 更新语句
        if !condition_value.is_empty() && !update_values.is_empty() {
            script.push_str(&format!(
                "db.{}.updateOne({{ {}: \"{}\" }}, {{ $set: {{ ",
                table_name, condition_field, condition_value
            ));

            let mut first = true;
            for (field, value) in &update_values {
                if !first {
                    script.push_str(", ");
                }
                script.push_str(&format!("\"{}\": \"{}\"", field, value));
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

            // 确保索引在有效范围内
            if csv_index < row.len() {
                let value = &row[csv_index];

                // 检查是否是条件字段
                if db_field == &condition_field {
                    condition_value = value.to_string();
                }

                // 检查是否是更新字段
                if update_fields.contains(db_field) {
                    update_values.insert(db_field.clone(), value.to_string());
                }
            }
        }

        // 生成 MySQL 更新语句
        if !condition_value.is_empty() && !update_values.is_empty() {
            script.push_str(&format!("UPDATE {} SET ", table_name));

            let mut first = true;
            for (field, value) in &update_values {
                if !first {
                    script.push_str(", ");
                }
                script.push_str(&format!("{} = '{}'", field, value));
                first = false;
            }

            script.push_str(&format!(
                " WHERE {} = '{}';\n",
                condition_field, condition_value
            ));
        }
    }

    println!(
        "generate_mysql_script end : {}, script length: {}",
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
            read_csv_file,
            generate_mongodb_script,
            generate_mysql_script
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
