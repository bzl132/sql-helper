import { useState, useEffect } from "react";
import {
    Button,
    Card,
    Typography,
    Space,
    Select,
    message,
    Table,
    Tag
} from 'antd';
import { UploadOutlined, CheckCircleOutlined, EditOutlined } from '@ant-design/icons';
import MonacoEditor from 'react-monaco-editor';
import RulesManager from './RulesManager'; // 导入新的规则管理组件
import './ScriptValidationPage.css';

const { Title } = Typography;
const { Option } = Select;

function ScriptValidationPage() {
    const [scriptContent, setScriptContent] = useState("");
    const [scriptType, setScriptType] = useState("MySQL");
    const [validationResults, setValidationResults] = useState([]);
    const [config, setConfig] = useState({});
    const [isValidating, setIsValidating] = useState(false);

    // 规则管理相关状态
    const [showRulesManager, setShowRulesManager] = useState(false);
    const [validationRules, setValidationRules] = useState({
        MySQL: {},
        MongoDB: {}
    });


    // 加载配置
    useEffect(() => {
        loadConfig();
        loadValidationRules();
        // 监听标签页切换事件
        const handleTabChange = (event) => {
            if (event.detail.tab === 'validation') {
                loadConfig();
                loadValidationRules();
            }
        };

        document.addEventListener('tab-change', handleTabChange);

        return () => {
            document.removeEventListener('tab-change', handleTabChange);
        };
    }, []);

    const loadValidationRules = () => {
        // 从 localStorage 加载验证规则
        const savedRules = localStorage.getItem('validationRules');
        if (savedRules) {
            setValidationRules(JSON.parse(savedRules));
        }
    };


    // 处理规则保存
    const handleRulesSave = (updatedRules) => {
        setValidationRules(updatedRules);
        localStorage.setItem('validationRules', JSON.stringify(updatedRules));
        message.success('规则保存成功');
    };






    const loadConfig = () => {
        // 从 localStorage 加载配置
        const savedConfig = localStorage.getItem('dbConfig');
        if (savedConfig) {
            setConfig(JSON.parse(savedConfig));
        }
    };

    // 处理脚本类型变化
    const handleScriptTypeChange = (value) => {
        setScriptType(value);
        // 清空验证结果
        setValidationResults([]);
    };

    // 从文件导入脚本
    const importScriptFromFile = async () => {
        try {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = scriptType === 'MySQL' ? '.sql' : '.js';

            fileInput.onchange = async (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                        const content = event.target.result;
                        setScriptContent(content);
                        message.success('脚本文件导入成功');
                    };
                    reader.readAsText(file);
                }
            };

            fileInput.click();
        } catch (error) {
            console.error('导入脚本文件时出错:', error);
            message.error(`导入脚本文件时出错: ${error.message}`);
        }
    };

    // 验证脚本
    const validateScript = () => {
        if (!scriptContent.trim()) {
            message.warning('请先输入或导入脚本内容');
            return;
        }

        setIsValidating(true);
        const results = [];

        // 按行分割脚本
        const scriptLines = scriptContent.split('\n').filter(line => line.trim() !== '');

        // 对每一行进行验证
        scriptLines.forEach((line, index) => {
            const lineNumber = index + 1;
            const result = {
                key: lineNumber,
                lineNumber,
                content: line,
                tableName: '',
                isValid: true,
                issues: []
            };

            // 提取表名
            const tableName = extractTableName(line, scriptType);

            result.tableName = tableName;

            if (!tableName) {
                result.isValid = false;
                result.issues.push('无法识别表名');
            } else if (!config[tableName]) {
                result.isValid = false;
                result.issues.push('表名在配置中不存在');
            } else {
                // 验证字段
                const fields = extractFields(line, scriptType);
                const configFields = config[tableName]?.fields || [];

                // 检查字段是否存在
                const invalidFields = fields.filter(field => {
                    // 支持新的字段格式（对象格式）
                    return !configFields.some(configField => {
                        if (typeof configField === 'object') {
                            return configField.name === field;
                        } else {
                            return configField === field;
                        }
                    });
                });

                if (invalidFields.length > 0) {
                    result.isValid = false;
                    result.issues.push(`字段不存在: ${invalidFields.join(', ')}`);
                }

                // 验证字段值类型
                const typeIssues = validateFieldTypes(line, scriptType, tableName, config);
                if (typeIssues) {
                    result.isValid = false;
                    result.issues.push(typeIssues);
                }

                // 移除语法验证部分
                // const syntaxIssue = validateSyntax(line, scriptType);
                // if (syntaxIssue) {
                //     result.isValid = false;
                //     result.issues.push(syntaxIssue);
                // }
            }

            results.push(result);
        });

        setValidationResults(results);
        setIsValidating(false);

        // 显示验证结果摘要
        const validCount = results.filter(r => r.isValid).length;
        message.info(`验证完成: ${validCount}/${results.length} 行有效`);
    };

    // 验证字段值类型
    const validateFieldTypes = (line, type, tableName, config) => {
        try {
            console.log("validateFieldTypes start", line, type, tableName, config);
            if (!config[tableName] || !config[tableName].fields) {
                return null;
            }

            // 移除行末的分号
            const cleanLine = line.replace(/;$/, '');

            const configFields = config[tableName].fields;
            let issues = []; // 添加这一行来定义 issues 数组
            if (type === 'MySQL') {
                // 提取 MySQL 语句中的字段和值
                // 处理 UPDATE 语句
                const updateMatch = line.match(/UPDATE\s+\w+\s+SET\s+(.*?)\s+WHERE\s+(.*)/i);
                console.log("updateMatch", updateMatch);
                if (updateMatch) {
                    // 检查 SET 子句中的字段类型
                    const setClause = updateMatch[1];
                    const fieldValuePairs = setClause.split(',').map(pair => pair.trim());

                    for (const pair of fieldValuePairs) {
                        const [fieldName, value] = pair.split('=').map(part => part.trim());
                        const fieldInfo = configFields.find(f =>
                            typeof f === 'object' ? f.name === fieldName : f === fieldName
                        );

                        if (fieldInfo) {
                            const fieldType = typeof fieldInfo === 'object' ? fieldInfo.type : 'String';
                            const typeIssue = checkValueType(value, fieldType, 'MySQL');
                            if (typeIssue) {
                                issues.push(`字段 ${fieldName} 的值 ${value} ${typeIssue}`);
                            }
                        }
                    }

                    // 检查 WHERE 子句中的字段类型
                    const whereClause = updateMatch[2];
                    const whereIssue = validateWhereClause(whereClause, configFields, 'MySQL');
                    if (whereIssue) {
                        issues.push(whereIssue);
                    }
                }

                // 处理 INSERT 语句
                const insertMatch = line.match(/INSERT\s+INTO\s+\w+\s*\((.*?)\)\s*VALUES\s*\((.*?)\)/i);
                if (insertMatch) {
                    const fieldsList = insertMatch[1].split(',').map(f => f.trim());
                    const valuesList = insertMatch[2].split(',').map(v => v.trim());

                    if (fieldsList.length === valuesList.length) {
                        for (let i = 0; i < fieldsList.length; i++) {
                            const fieldName = fieldsList[i];
                            const value = valuesList[i];

                            const fieldInfo = configFields.find(f =>
                                typeof f === 'object' ? f.name === fieldName : f === fieldName
                            );

                            if (fieldInfo) {
                                const fieldType = typeof fieldInfo === 'object' ? fieldInfo.type : 'String';
                                const typeIssue = checkValueType(value, fieldType, 'MySQL');
                                if (typeIssue) {
                                    return `字段 ${fieldName} 的值 ${value} ${typeIssue}`;
                                }
                            }
                        }
                    }
                }

                // 处理 SELECT 语句
                const selectMatch = line.match(/SELECT\s+.*?\s+FROM\s+\w+\s+WHERE\s+(.*)/i);
                if (selectMatch) {
                    const whereClause = selectMatch[1];
                    const whereIssue = validateWhereClause(whereClause, configFields, 'MySQL');
                    if (whereIssue) {
                        issues.push(whereIssue);
                    }
                }

                // 处理 DELETE 语句
                const deleteMatch = line.match(/DELETE\s+FROM\s+\w+\s+WHERE\s+(.*)/i);
                if (deleteMatch) {
                    const whereClause = deleteMatch[1];
                    const whereIssue = validateWhereClause(whereClause, configFields, 'MySQL');
                    if (whereIssue) {
                        issues.push(whereIssue);
                    }
                }
            } else if (type === 'MongoDB') {

                // 处理 MongoDB 的查询条件
                const findMatch = line.match(/find\s*\(\s*{(.*?)}\s*\)/i);
                if (findMatch) {
                    const queryClause = findMatch[1];
                    const queryIssue = validateMongoQueryClause(queryClause, configFields);
                    if (queryIssue) {
                        issues.push(queryIssue);
                    }
                }
                // 处理 MongoDB 的 updateOne/updateMany 操作
                const updateMatch = line.match(/update(?:One|Many)\s*\(\s*({.*?})\s*,\s*({.*?})\s*(?:,\s*{.*?})?\)/i);
                if (updateMatch) {
                    // 检查查询条件
                    const queryClause = updateMatch[1];
                    const queryIssue = validateMongoQueryClause(queryClause, configFields);
                    if (queryIssue) {
                        issues.push(queryIssue);
                    }
                
                    // 检查更新操作
                    const updateClause = updateMatch[2];
                    
                    // 使用正则表达式提取所有更新操作符和对应的字段
                    const updateOperators = [];
                    const operatorRegex = /\$(\w+)\s*:\s*({.*?})/g;
                    let operatorMatch;
                    
                    while ((operatorMatch = operatorRegex.exec(updateClause)) !== null) {
                        const operator = operatorMatch[1];
                        const fieldsObj = operatorMatch[2];
                        updateOperators.push({ operator, fieldsObj });
                    }
                    
                    // 对每个更新操作符进行处理
                    for (const { operator, fieldsObj } of updateOperators) {
                        // 使用正则表达式直接提取字段名和值
                        const fieldValuePairs = [];
                        const fieldRegex = /"([^"]+)"\s*:\s*([^,}]+|{[^{}]*})/g;
                        let fieldMatch;
                        
                        while ((fieldMatch = fieldRegex.exec(fieldsObj)) !== null) {
                            const fieldName = fieldMatch[1];
                            const rawValue = fieldMatch[2].trim();
                            
                            fieldValuePairs.push({
                                fieldName,
                                rawValue
                            });
                        }
                        
                        // 遍历提取的字段和值
                        for (const { fieldName, rawValue } of fieldValuePairs) {
                            // 查找字段信息
                            const fieldInfo = configFields.find(f =>
                                typeof f === 'object' ? f.name === fieldName : f === fieldName
                            );
                            
                            if (!fieldInfo) {
                                // 字段不存在于配置中
                                issues.push(`字段 ${fieldName} 在配置中不存在`);
                                continue;
                            }
                            
                            // 获取字段类型
                            const fieldType = typeof fieldInfo === 'object' ? fieldInfo.type : 'String';
                            
                            // 检查值是否是嵌套对象
                            if (rawValue.startsWith('{') && !rawValue.includes('$')) {
                                // 这是一个嵌套对象，只验证外层字段名是否存在，不验证其值
                                continue;
                            }
                            
                            // 对于非对象类型的值，进行类型验证
                            // 根据不同的操作符可能需要不同的验证逻辑
                            if (operator === 'set' || operator === 'setOnInsert') {
                                const typeIssue = checkValueType(rawValue, fieldType, 'MongoDB');
                                if (typeIssue) {
                                    issues.push(`字段 ${fieldName} 的值 ${rawValue} ${typeIssue}`);
                                }
                            }
                            // 可以添加其他操作符的验证逻辑
                        }
                    }
                }

                // 处理 MongoDB 的 insertOne 操作
                const insertMatch = line.match(/insertOne\s*\(\s*{(.*?)}\s*\)/i);
                if (insertMatch) {
                    try {
                        const insertClause = insertMatch[1];
                        // 构造一个有效的 JSON 字符串
                        const jsonStr = `{${insertClause}}`;
                        // 尝试解析为 JSON 对象
                        const jsonObj = JSON.parse(jsonStr.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":'));
                        
                        // 遍历顶层字段
                        for (const fieldName in jsonObj) {
                            // 查找字段信息
                            const fieldInfo = configFields.find(f =>
                                typeof f === 'object' ? f.name === fieldName : f === fieldName
                            );
                            
                            if (!fieldInfo) {
                                // 字段不存在于配置中
                                issues.push(`字段 ${fieldName} 在配置中不存在`);
                                continue;
                            }
                            
                            // 获取字段类型
                            const fieldType = typeof fieldInfo === 'object' ? fieldInfo.type : 'String';
                            const fieldValue = jsonObj[fieldName];
                            
                            // 如果值是对象，不验证其内部结构
                            if (typeof fieldValue === 'object' && fieldValue !== null) {
                                // 只验证字段名存在性，不验证嵌套对象的内部
                                continue;
                            }
                            
                            // 对于非对象类型的值，进行类型验证
                            const valueStr = JSON.stringify(fieldValue);
                            const typeIssue = checkValueType(valueStr, fieldType, 'MongoDB');
                            if (typeIssue) {
                                issues.push(`字段 ${fieldName} 的值 ${valueStr} ${typeIssue}`);
                            }
                        }
                    } catch (error) {
                        console.error('解析 MongoDB 插入字段时出错:', error);
                        issues.push(`解析 MongoDB 插入字段时出错: ${error.message}`);
                    }
                }
            }

            return issues.length > 0 ? issues.join('; ') : null;
        } catch (error) {
            console.error('验证字段类型时出错:', error);
            return null;
        }
    };

    // 验证 WHERE 子句中的字段类型
    const validateWhereClause = (whereClause, configFields, dbType) => {
        try {
            const issues = [];

            // 移除末尾的分号
            const cleanWhereClause = whereClause.replace(/;$/, '');

            // 分割多个条件（按 AND 和 OR 分割）
            const conditions = cleanWhereClause.split(/\s+(?:AND|OR)\s+/i);

            for (const condition of conditions) {
                // 匹配条件中的字段名、操作符和值
                // 支持常见的操作符：=, !=, <>, >, <, >=, <=, LIKE, IN, IS NULL, IS NOT NULL
                const conditionMatch = condition.match(/(\w+)\s*(=|!=|<>|>|<|>=|<=|LIKE|IN|IS(?:\s+NOT)?)\s*(.*)/i);

                if (conditionMatch) {
                    const fieldName = conditionMatch[1];
                    const operator = conditionMatch[2].trim().toUpperCase();
                    let value = conditionMatch[3].trim();

                    // 查找字段信息
                    const fieldInfo = configFields.find(f =>
                        typeof f === 'object' ? f.name === fieldName : f === fieldName
                    );

                    if (fieldInfo) {
                        const fieldType = typeof fieldInfo === 'object' ? fieldInfo.type : 'String';

                        // 处理特殊操作符
                        if (operator === 'IN') {
                            // 处理 IN 操作符，值应该是括号中的列表
                            if (value.startsWith('(') && value.endsWith(')')) {
                                const valuesList = value.substring(1, value.length - 1).split(',').map(v => v.trim());

                                for (const val of valuesList) {
                                    const typeIssue = checkValueType(val, fieldType, dbType);
                                    if (typeIssue) {
                                        issues.push(`WHERE 条件中字段 ${fieldName} 的值 ${val} ${typeIssue}`);
                                    }
                                }
                            }
                        } else if (operator.includes('IS')) {
                            // IS NULL 或 IS NOT NULL 不需要类型检查
                            continue;
                        } else {
                            // 其他操作符
                            const typeIssue = checkValueType(value, fieldType, dbType);
                            if (typeIssue) {
                                issues.push(`WHERE 条件中字段 ${fieldName} 的值 ${value} ${typeIssue}`);
                            }
                        }
                    }
                }
            }

            return issues.length > 0 ? issues.join('; ') : null;
        } catch (error) {
            console.error('验证 WHERE 子句时出错:', error);
            return null;
        }
    };


    // 验证 MongoDB 查询条件
    const validateMongoQueryClause = (queryClause, configFields) => {
        try {
            const issues = [];

            // 移除末尾的分号
            const cleanQueryClause = queryClause.replace(/;$/, '');

            // 使用正则表达式匹配字段和值对
            const fieldValueRegex = /"([^"]+)"\s*:\s*([^,}]+)/g;
            let fieldValueMatch;

            while ((fieldValueMatch = fieldValueRegex.exec(cleanQueryClause)) !== null) {
                const fieldName = fieldValueMatch[1];
                const value = fieldValueMatch[2].trim();

                // 查找字段信息
                const fieldInfo = configFields.find(f =>
                    typeof f === 'object' ? f.name === fieldName : f === fieldName
                );

                if (fieldInfo) {
                    const fieldType = typeof fieldInfo === 'object' ? fieldInfo.type : 'String';

                    // 检查值是否是 MongoDB 操作符
                    if (value.startsWith('{') && value.includes('$')) {
                        // 处理 MongoDB 操作符，如 { $gt: 100 }
                        const operatorRegex = /\$\w+\s*:\s*([^,}]+)/g;
                        let operatorMatch;

                        while ((operatorMatch = operatorRegex.exec(value)) !== null) {
                            const operatorValue = operatorMatch[1].trim();
                            const typeIssue = checkValueType(operatorValue, fieldType, 'MongoDB');
                            if (typeIssue) {
                                issues.push(`查询条件中字段 ${fieldName} 的值 ${operatorValue} ${typeIssue}`);
                            }
                        }
                    } else {
                        // 普通值
                        const typeIssue = checkValueType(value, fieldType, 'MongoDB');
                        if (typeIssue) {
                            issues.push(`查询条件中字段 ${fieldName} 的值 ${value} ${typeIssue}`);
                        }
                    }
                }
            }

            return issues.length > 0 ? issues.join('; ') : null;
        } catch (error) {
            console.error('验证 MongoDB 查询条件时出错:', error);
            return null;
        }
    };

    // 检查值是否符合指定类型
    const checkValueType = (value, expectedType, dbType) => {
        console.log("checkValueType", value, expectedType, dbType);

        try {
            // 获取对应数据库类型和字段类型的规则
            const typeRules = validationRules[dbType]?.[expectedType] || [];

            // 如果没有规则，返回 null
            if (typeRules.length === 0) {
                return null;
            }

            // 检查每条规则
            for (const rule of typeRules) {
                try {
                    const pattern = new RegExp(rule.pattern);
                    if (!pattern.test(value)) {
                        return rule.message;
                    }
                } catch (error) {
                    console.error(`规则 ${rule.name} 的正则表达式无效:`, error);
                }
            }

            return null;
        } catch (error) {
            console.error('检查值类型时出错:', error);
            return null;
        }
    };

    // 提取表名
    const extractTableName = (line, type) => {
        console.log("extractTableName", line, type);
        try {
            if (type === 'MySQL') {
                // 处理MySQL语句
                // UPDATE 表名 SET ...
                // 支持带反引号的表名和带点的表名（如db.table）
                const updateMatch = line.match(/UPDATE\s+(?:`([^`]+)`|([a-zA-Z0-9_$]+(?:\.[a-zA-Z0-9_$]+)?))\s+SET/i);
                if (updateMatch) return updateMatch[1] || updateMatch[2];

                // INSERT INTO 表名 ...
                const insertMatch = line.match(/INSERT\s+INTO\s+(?:`([^`]+)`|([a-zA-Z0-9_$]+(?:\.[a-zA-Z0-9_$]+)?))/i);
                if (insertMatch) return insertMatch[1] || insertMatch[2];

                // DELETE FROM 表名 ...
                const deleteMatch = line.match(/DELETE\s+FROM\s+(?:`([^`]+)`|([a-zA-Z0-9_$]+(?:\.[a-zA-Z0-9_$]+)?))/i);
                if (deleteMatch) return deleteMatch[1] || deleteMatch[2];

                // SELECT ... FROM 表名 ...
                const selectMatch = line.match(/FROM\s+(?:`([^`]+)`|([a-zA-Z0-9_$]+(?:\.[a-zA-Z0-9_$]+)?))/i);
                if (selectMatch) return selectMatch[1] || selectMatch[2];
            } else {
                console.log("type", type);
                // 处理MongoDB语句
                // 修改正则表达式，使其能够匹配包含下划线的表名
                // db.表名.update(... 或 db.表名.updateOne(... 等
                const mongoMatch = line.match(/db\.([a-zA-Z0-9_][a-zA-Z0-9_$]*)\./i);
                console.log("mongoMatch", mongoMatch);
                if (mongoMatch) return mongoMatch[1];
            }
        } catch (error) {
            console.error('提取表名时出错:', error);
        }

        return '';
    };

    // 提取字段
    const extractFields = (line, type) => {
        const fields = [];
        try {
            if (type === 'MySQL') {
                // 处理MySQL SET子句中的字段
                const setClause = line.match(/SET\s+(.*?)\s+WHERE/i);
                if (setClause) {
                    const fieldAssignments = setClause[1].split(',');
                    fieldAssignments.forEach(assignment => {
                        const fieldMatch = assignment.trim().match(/^(\w+)\s*=/);
                        if (fieldMatch) {
                            fields.push(fieldMatch[1]);
                        }
                    });
                }

                // 处理WHERE子句中的字段
                const whereClause = line.match(/WHERE\s+(.*?)$/i);
                if (whereClause) {
                    const conditions = whereClause[1].split(/\s+AND\s+|\s+OR\s+/i);
                    conditions.forEach(condition => {
                        const fieldMatch = condition.trim().match(/^(\w+)\s*[=<>]/);
                        if (fieldMatch) {
                            fields.push(fieldMatch[1]);
                        }
                    });
                }
            } else {
                // 处理MongoDB $set中的字段
                const setMatch = line.match(/\$set:\s*{\s*(.*?)\s*}/i);
                if (setMatch) {
                    const fieldAssignments = setMatch[1].split(',');
                    fieldAssignments.forEach(assignment => {
                        const fieldMatch = assignment.trim().match(/["']?(\w+)["']?\s*:/);
                        if (fieldMatch) {
                            fields.push(fieldMatch[1]);
                        }
                    });
                }

                // 处理查询条件中的字段
                const queryMatch = line.match(/{\s*(.*?)\s*}\s*,/i);
                if (queryMatch) {
                    const conditions = queryMatch[1].split(',');
                    conditions.forEach(condition => {
                        const fieldMatch = condition.trim().match(/["']?(\w+)["']?\s*:/);
                        if (fieldMatch) {
                            fields.push(fieldMatch[1]);
                        }
                    });
                }
            }
        } catch (error) {
            console.error('提取字段时出错:', error);
        }

        return fields;
    };

    // 验证语法
    const validateSyntax = (line, type) => {
        console.log(line, type, "line, type");
        try {
            const syntaxRules = validationRules[type]?.Syntax || [];
            const issues = [];

            // 应用所有语法规则
            for (const rule of syntaxRules) {
                const pattern = new RegExp(rule.pattern);
                if (!pattern.test(line)) {
                    issues.push(rule.message);
                }
            }

            return issues.length > 0 ? issues.join('; ') : null;
        } catch (error) {
            console.error('验证语法时出错:', error);
            return null;
        }
    };




    return (
        <div className="script-validation-container">
            <Card title="SQL/MongoDB 脚本验证" className="validation-card">
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Space>
                        <Select
                            value={scriptType}
                            onChange={handleScriptTypeChange}
                            style={{ width: 120 }}
                        >
                            <Option value="MySQL">MySQL</Option>
                            <Option value="MongoDB">MongoDB</Option>
                        </Select>
                        <Button
                            icon={<UploadOutlined />}
                            onClick={importScriptFromFile}
                        >
                            导入脚本
                        </Button>
                        <Button
                            type="primary"
                            onClick={validateScript}
                            loading={isValidating}
                        >
                            验证脚本
                        </Button>
                        {/* 移除规则管理按钮，因为我们只保留两个基本功能 */}
                        {/* <Button
                            icon={<EditOutlined />}
                            onClick={() => setShowRulesManager(true)}
                        >
                            管理验证规则
                        </Button> */}
                    </Space>

                    <div className="editor-container">
                        <MonacoEditor
                            width="100%"
                            height="300"
                            language={scriptType === 'MySQL' ? 'sql' : 'javascript'}
                            theme="vs-dark"
                            value={scriptContent}
                            onChange={setScriptContent}
                            options={{
                                selectOnLineNumbers: true,
                                roundedSelection: false,
                                readOnly: false,
                                cursorStyle: 'line',
                                automaticLayout: true,
                            }}
                        />
                    </div>

                    {validationResults.length > 0 && (
                        <div className="results-container">
                            <Title level={4}>验证结果</Title>
                            <Table
                                dataSource={validationResults}
                                pagination={false}
                                rowClassName={(record) => record.isValid ? 'valid-row' : 'invalid-row'}
                            >
                                <Table.Column title="行号" dataIndex="lineNumber" key="lineNumber" width={80} />
                                <Table.Column title="内容" dataIndex="content" key="content" ellipsis={true} />
                                <Table.Column title="表名" dataIndex="tableName" key="tableName" width={120} />
                                <Table.Column
                                    title="状态"
                                    key="status"
                                    width={100}
                                    render={(_, record) => (
                                        <Tag color={record.isValid ? 'success' : 'error'}>
                                            {record.isValid ? '有效' : '无效'}
                                        </Tag>
                                    )}
                                />
                                <Table.Column
                                    title="问题"
                                    dataIndex="issues"
                                    key="issues"
                                    render={(issues) => (
                                        <>
                                            {issues.map((issue, index) => (
                                                <div key={index}>{issue}</div>
                                            ))}
                                        </>
                                    )}
                                />
                            </Table>
                        </div>
                    )}
                </Space>
            </Card>

            {showRulesManager && (
                <RulesManager
                    rules={validationRules}
                    onSave={handleRulesSave}
                    onClose={() => setShowRulesManager(false)}
                />
            )}
        </div>
    );
}

export default ScriptValidationPage;
