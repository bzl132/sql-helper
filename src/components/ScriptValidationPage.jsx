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
import { UploadOutlined, CheckCircleOutlined } from '@ant-design/icons';
import MonacoEditor from 'react-monaco-editor';

const { Title, Text } = Typography;
const { Option } = Select;

function ScriptValidationPage() {
    const [scriptContent, setScriptContent] = useState("");
    const [scriptType, setScriptType] = useState("MySQL");
    const [validationResults, setValidationResults] = useState([]);
    const [config, setConfig] = useState({});
    const [isValidating, setIsValidating] = useState(false);

    // 加载配置
    useEffect(() => {
        loadConfig();

        // 监听标签页切换事件
        const handleTabChange = (event) => {
            if (event.detail.tab === 'validation') {
                loadConfig();
            }
        };

        document.addEventListener('tab-change', handleTabChange);

        return () => {
            document.removeEventListener('tab-change', handleTabChange);
        };
    }, []);

    const loadConfig = () => {
        // 从 localStorage 加载配置
        const savedConfig = localStorage.getItem('dbConfig');
        if (savedConfig) {
            setConfig(JSON.parse(savedConfig));
        }
    };

    // 处理脚本内容变化
    const handleScriptChange = (e) => {
        setScriptContent(e.target.value);
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

                // 验证语法
                const syntaxIssue = validateSyntax(line, scriptType);
                if (syntaxIssue) {
                    result.isValid = false;
                    result.issues.push(syntaxIssue);
                }
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
                const updateMatch = line.match(/update(?:One|Many)\s*\(\s*{(.*?)}\s*,\s*{\s*\$set\s*:\s*{(.*?)}\s*}/i);
                if (updateMatch) {
                    // 检查查询条件
                    const queryClause = updateMatch[1];
                    const queryIssue = validateMongoQueryClause(queryClause, configFields);
                    if (queryIssue) {
                        issues.push(queryIssue);
                    }

                    // 检查更新字段
                    const setClause = updateMatch[2];
                    const fieldValueRegex = /"([^"]+)"\s*:\s*([^,}]+)/g;
                    let fieldValueMatch;

                    while ((fieldValueMatch = fieldValueRegex.exec(setClause)) !== null) {
                        const fieldName = fieldValueMatch[1];
                        const value = fieldValueMatch[2].trim();

                        const fieldInfo = configFields.find(f =>
                            typeof f === 'object' ? f.name === fieldName : f === fieldName
                        );

                        if (fieldInfo) {
                            const fieldType = typeof fieldInfo === 'object' ? fieldInfo.type : 'String';
                            const typeIssue = checkValueType(value, fieldType, 'MongoDB');
                            if (typeIssue) {
                                issues.push(`字段 ${fieldName} 的值 ${value} ${typeIssue}`);
                            }
                        }
                    }
                }

                // 处理 MongoDB 的 insertOne 操作
                const insertMatch = line.match(/insertOne\s*\(\s*{(.*?)}\s*\)/i);
                if (insertMatch) {
                    const insertClause = insertMatch[1];
                    const fieldValueRegex = /"([^"]+)"\s*:\s*([^,}]+)/g;
                    let fieldValueMatch;

                    while ((fieldValueMatch = fieldValueRegex.exec(insertClause)) !== null) {
                        const fieldName = fieldValueMatch[1];
                        const value = fieldValueMatch[2].trim();

                        const fieldInfo = configFields.find(f =>
                            typeof f === 'object' ? f.name === fieldName : f === fieldName
                        );

                        if (fieldInfo) {
                            const fieldType = typeof fieldInfo === 'object' ? fieldInfo.type : 'String';
                            const typeIssue = checkValueType(value, fieldType, 'MongoDB');
                            if (typeIssue) {
                                return `字段 ${fieldName} 的值 ${value} ${typeIssue}`;
                            }
                        }
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

        // 移除值两端的引号
        let cleanValue = value;
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            cleanValue = value.substring(1, value.length - 1);
        }

        if (dbType === 'MySQL') {
            // MySQL 类型检查
            if (expectedType.toLowerCase().includes('int') ||
                expectedType.toLowerCase() === 'bigint' ||
                expectedType.toLowerCase() === 'tinyint') {
                // 整数类型
                if (value.startsWith("'") || value.startsWith('"')) {
                    return `应为整数类型，但提供了字符串: ${value}`;
                }
                if (!/^-?\d+$/.test(cleanValue)) {
                    return `应为整数类型，但提供了非整数值: ${value}`;
                }
            } else if (expectedType.toLowerCase().includes('decimal') ||
                expectedType.toLowerCase().includes('double') ||
                expectedType.toLowerCase().includes('float')) {
                // 浮点数类型
                if (value.startsWith("'") || value.startsWith('"')) {
                    return `应为数值类型，但提供了字符串: ${value}`;
                }
                if (!/^-?\d+(\.\d+)?$/.test(cleanValue)) {
                    return `应为数值类型，但提供了非数值: ${value}`;
                }
            } else if (expectedType.toLowerCase().includes('date') ||
                expectedType.toLowerCase().includes('time')) {
                // 日期时间类型
                if (!value.startsWith("'") && !value.startsWith('"')) {
                    return `日期/时间类型应使用引号: ${value}`;
                }
            } else if (expectedType.toLowerCase().includes('char') ||
                expectedType.toLowerCase().includes('text') ||
                expectedType.toLowerCase() === 'string') {
                // 字符串类型
                if (!value.startsWith("'") && !value.startsWith('"') && value.toLowerCase() !== 'null') {
                    return `字符串类型应使用引号: ${value}`;
                }
            }
        } else if (dbType === 'MongoDB') {
            // MongoDB 类型检查
            if (expectedType.toLowerCase() === 'string') {
                // 字符串类型 - 修复：确保值使用了引号
                if (!value.startsWith('"') && !value.startsWith("'") && value.toLowerCase() !== 'null') {
                    return `字符串类型应使用引号: ${value}`;
                }
            } else if (expectedType.toLowerCase() === 'number' ||
                expectedType.toLowerCase() === 'int' ||
                expectedType.toLowerCase() === 'long' ||
                expectedType.toLowerCase() === 'double') {
                // 数值类型
                if (value.startsWith('"') || value.startsWith("'")) {
                    return `应为数值类型，但提供了字符串: ${value}`;
                }
                if (!/^-?\d+(\.\d+)?$/.test(cleanValue)) {
                    return `应为数值类型，但提供了非数值: ${value}`;
                }
            } else if (expectedType.toLowerCase() === 'boolean') {
                // 布尔类型
                if (value.startsWith('"') || value.startsWith("'")) {
                    return `应为布尔类型，但提供了字符串: ${value}`;
                }
                if (cleanValue !== 'true' && cleanValue !== 'false') {
                    return `应为布尔类型(true/false)，但提供了: ${value}`;
                }
            } else if (expectedType.toLowerCase() === 'date') {
                // 日期类型
                if (!value.includes('new Date') && !value.startsWith('"') && !value.startsWith("'")) {
                    return `日期类型应使用new Date()或日期字符串: ${value}`;
                }
            } else if (expectedType.toLowerCase() === 'objectid') {
                // ObjectId类型
                if (!value.includes('ObjectId') && !value.startsWith('"') && !value.startsWith("'")) {
                    return `ObjectId类型应使用ObjectId()或字符串: ${value}`;
                }
            }
        }

        // 对于未明确处理的类型，不进行特殊验证
        return null;
    };

    // 提取表名
    const extractTableName = (line, type) => {
        try {
            if (type === 'MySQL') {
                // 处理MySQL语句
                // UPDATE 表名 SET ...
                const updateMatch = line.match(/UPDATE\s+(\w+)\s+SET/i);
                if (updateMatch) return updateMatch[1];

                // INSERT INTO 表名 ...
                const insertMatch = line.match(/INSERT\s+INTO\s+(\w+)/i);
                if (insertMatch) return insertMatch[1];

                // DELETE FROM 表名 ...
                const deleteMatch = line.match(/DELETE\s+FROM\s+(\w+)/i);
                if (deleteMatch) return deleteMatch[1];

                // SELECT ... FROM 表名 ...
                const selectMatch = line.match(/FROM\s+(\w+)/i);
                if (selectMatch) return selectMatch[1];
            } else {
                // 处理MongoDB语句
                // db.表名.update(...
                const updateMatch = line.match(/db\.(\w+)\.update/i);
                if (updateMatch) return updateMatch[1];

                // db.表名.updateOne(...
                const updateOneMatch = line.match(/db\.(\w+)\.updateOne/i);
                if (updateOneMatch) return updateOneMatch[1];

                // db.表名.find(...
                const findMatch = line.match(/db\.(\w+)\.find/i);
                if (findMatch) return findMatch[1];

                // db.表名.insertOne(...
                const insertMatch = line.match(/db\.(\w+)\.insertOne/i);
                if (insertMatch) return insertMatch[1];
            }
        } catch (error) {
            console.error('提取表名时出错:', error);
        }

        return '';
    };


    // Monaco编辑器配置
    const editorOptions = {
        selectOnLineNumbers: true,
        roundedSelection: false,
        readOnly: false,
        cursorStyle: 'line',
        automaticLayout: true,
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        lineNumbers: 'on',
        folding: true,
        fontSize: 14,
        fontFamily: 'Consolas, "Courier New", monospace',
        // 增加高度以显示所有内容
        fixedOverflowWidgets: true,
        // 设置编辑器主题
        theme: 'vs',
        // 增加行高
        lineHeight: 20,
    };

    // 根据脚本类型设置编辑器语言
    const getEditorLanguage = () => {
        return scriptType === 'MySQL' ? 'sql' : 'javascript';
    };

    // 处理编辑器内容变化
    const handleEditorChange = (value) => {
        setScriptContent(value);
    };

    // 编辑器初始化配置
    const editorDidMount = (editor, monaco) => {
        // 设置自定义主题，使关键字变蓝色
        monaco.editor.defineTheme('sqlCustomTheme', {
            base: 'vs',
            inherit: true,
            rules: [
                { token: 'keyword', foreground: '0000FF', fontStyle: 'bold' },
                { token: 'keyword.sql', foreground: '0000FF', fontStyle: 'bold' }, // 添加特定于SQL的关键字规则
                { token: 'keyword.js', foreground: '0000FF', fontStyle: 'bold' },  // 添加特定于JS的关键字规则
                { token: 'operator', foreground: '000000' },
                { token: 'string', foreground: 'A31515' },
                { token: 'number', foreground: '098658' },
                { token: 'comment', foreground: '008000' },
                { token: 'identifier', foreground: '001080' },
            ],
            colors: {
                'editor.foreground': '#000000',
                'editor.background': '#FFFFFF',
                'editor.selectionBackground': '#ADD6FF',
                'editor.lineHighlightBackground': '#F0F0F0',
                'editorCursor.foreground': '#000000',
                'editorWhitespace.foreground': '#BFBFBF'
            }
        });

        // 应用自定义主题
        monaco.editor.setTheme('sqlCustomTheme');

        // 注册SQL语法高亮规则
        if (scriptType === 'MySQL') {
            monaco.languages.setMonarchTokensProvider('sql', {
                defaultToken: '',
                tokenPostfix: '.sql',
                ignoreCase: true,
                brackets: [
                    { open: '[', close: ']', token: 'delimiter.square' },
                    { open: '(', close: ')', token: 'delimiter.parenthesis' }
                ],
                keywords: [
                    'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE',
                    'CREATE', 'ALTER', 'DROP', 'TABLE', 'INTO', 'VALUES',
                    'AND', 'OR', 'NOT', 'NULL', 'SET', 'JOIN', 'LEFT', 'RIGHT',
                    'INNER', 'OUTER', 'GROUP', 'BY', 'ORDER', 'HAVING', 'AS',
                    'ON', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
                    'BETWEEN', 'LIKE', 'IN', 'EXISTS', 'ALL', 'ANY', 'SOME'
                ],
                operators: [
                    '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
                    '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^', '%'
                ],
                // 符号定义
                symbols: /[=><!~?:&|+\-*\/\^%]+/,
                // 转义字符
                escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
                // 字符串
                string: /("|')(\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
                // 数字
                number: /\b\d+(\.\d+)?\b/,
                // 标识符
                identifier: /[a-zA-Z_][\w$]*/,
                // 标点符号
                punctuation: /[;,.]/,
                // 令牌规则
                tokenizer: {
                    root: [
                        { include: '@comments' },
                        { include: '@whitespace' },
                        { include: '@numbers' },
                        { include: '@strings' },
                        [/[,;]/, 'delimiter'],
                        [/[()]/, '@brackets'],
                        [/@symbols/, {
                            cases: {
                                '@operators': 'operator',
                                '@default': ''
                            }
                        }],
                        [/@identifier/, {
                            cases: {
                                '@keywords': { token: 'keyword.sql' }, // 明确指定为keyword.sql
                                '@default': 'identifier'
                            }
                        }]
                    ],
                    whitespace: [
                        [/\s+/, 'white']
                    ],
                    comments: [
                        [/--+.*/, 'comment'],
                        [/\/\*/, { token: 'comment.quote', next: '@comment' }]
                    ],
                    comment: [
                        [/[^*/]+/, 'comment'],
                        [/\*\//, { token: 'comment.quote', next: '@pop' }],
                        [/./, 'comment']
                    ],
                    numbers: [
                        [/\d+/, 'number'],
                        [/\d+\.\d+/, 'number.float']
                    ],
                    strings: [
                        [/'/, { token: 'string', next: '@string' }],
                        [/"/, { token: 'string.double', next: '@stringDouble' }]
                    ],
                    string: [
                        [/[^']+/, 'string'],
                        [/''/, 'string'],
                        [/'/, { token: 'string', next: '@pop' }]
                    ],
                    stringDouble: [
                        [/[^"]+/, 'string.double'],
                        [/""/, 'string.double'],
                        [/"/, { token: 'string.double', next: '@pop' }]
                    ]
                }
            });
        }
        // 如果是MongoDB，设置JavaScript语法高亮
        if (scriptType === 'MongoDB') {
            // JavaScript已经有内置的语法高亮，但我们可以增强一些MongoDB特定的关键字
            const jsLanguage = monaco.languages.getLanguages().find(lang => lang.id === 'javascript');
            if (jsLanguage && jsLanguage.tokensProvider) {
                const originalProvider = jsLanguage.tokensProvider;
                // 扩展原有的关键字列表，添加MongoDB特定的关键字
                if (originalProvider.keywords) {
                    originalProvider.keywords.push(
                        'db', 'find', 'findOne', 'update', 'updateOne', 'updateMany',
                        'insert', 'insertOne', 'insertMany', 'delete', 'deleteOne', 'deleteMany',
                        '$set', '$push', '$pull', '$inc', '$unset', '$addToSet'
                    );
                }
            }
        }

        editor.focus();

        // 调整编辑器容器样式以确保canvas完全显示
        const editorContainer = editor.getDomNode().parentElement;
        if (editorContainer) {
            editorContainer.style.overflow = 'visible';
            editorContainer.style.position = 'relative';
        }
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
            if (type === 'MySQL') {
                // 简单的MySQL语法验证
                if (line.match(/UPDATE\s+\w+\s+SET/i) && !line.match(/WHERE/i)) {
                    return 'UPDATE语句缺少WHERE子句';
                }

                if (line.match(/DELETE\s+FROM/i) && !line.match(/WHERE/i)) {
                    return 'DELETE语句缺少WHERE子句';
                }

                // 检查括号是否匹配
                if ((line.match(/\(/g) || []).length !== (line.match(/\)/g) || []).length) {
                    return '括号不匹配';
                }

                // 检查引号是否匹配
                const singleQuotes = (line.match(/'/g) || []).length;
                if (singleQuotes % 2 !== 0) {
                    return '单引号不匹配';
                }

                const doubleQuotes = (line.match(/"/g) || []).length;
                if (doubleQuotes % 2 !== 0) {
                    return '双引号不匹配';
                }

                // 新增MySQL语法检查规则
                // 检查SELECT语句是否包含FROM
                if (line.match(/^\s*SELECT/i) && !line.match(/FROM\s+\w+/i)) {
                    return 'SELECT语句缺少FROM子句';
                }

                // 检查INSERT语句格式
                if (line.match(/INSERT\s+INTO/i)) {
                    if (!line.match(/VALUES\s*\(/i) && !line.match(/SET\s+\w+\s*=/i)) {
                        return 'INSERT语句格式不正确，缺少VALUES或SET';
                    }
                }

                // 检查JOIN语句是否有ON条件
                if (line.match(/JOIN\s+\w+/i) && !line.match(/ON\s+\w+\.\w+\s*=\s*\w+\.\w+/i)) {
                    return 'JOIN语句缺少ON条件';
                }

                // 检查GROUP BY后是否有列名
                if (line.match(/GROUP\s+BY/i) && !line.match(/GROUP\s+BY\s+\w+/i)) {
                    return 'GROUP BY后缺少列名';
                }

                // 检查ORDER BY后是否有列名
                if (line.match(/ORDER\s+BY/i) && !line.match(/ORDER\s+BY\s+\w+/i)) {
                    return 'ORDER BY后缺少列名';
                }

                // 检查HAVING是否在GROUP BY之后
                if (line.match(/HAVING/i) && !line.match(/GROUP\s+BY.*HAVING/i)) {
                    return 'HAVING子句应在GROUP BY之后';
                }

                // 检查子查询括号是否完整
                const subqueryStart = (line.match(/\(\s*SELECT/gi) || []).length;
                const subqueryEnd = (line.match(/\)\s*FROM|\)\s*WHERE|\)\s*,|\)\s*;|\)\s*$/gi) || []).length;
                if (subqueryStart !== subqueryEnd && subqueryStart > 0) {
                    return '子查询括号不完整';
                }
            } else {
                // MongoDB语法验证
                if (!line.match(/db\.\w+\./i)) {
                    return '缺少db.collection前缀';
                }

                // 检查括号和大括号是否匹配
                const openBraces = (line.match(/\{/g) || []).length;
                const closeBraces = (line.match(/\}/g) || []).length;
                if (openBraces !== closeBraces) {
                    return '大括号不匹配';
                }

                const openParens = (line.match(/\(/g) || []).length;
                const closeParens = (line.match(/\)/g) || []).length;
                if (openParens !== closeParens) {
                    return '括号不匹配';
                }

                // 检查引号是否匹配
                const singleQuotes = (line.match(/'/g) || []).length;
                if (singleQuotes % 2 !== 0) {
                    return '单引号不匹配';
                }

                const doubleQuotes = (line.match(/"/g) || []).length;
                if (doubleQuotes % 2 !== 0) {
                    return '双引号不匹配';
                }

                // 新增MongoDB语法检查规则
                // 检查find方法的参数
                if (line.match(/\.find\(/i) && !line.match(/\.find\(\s*(\{\s*.*\s*\}|\{\s*\})\s*[,\)]/i)) {
                    return 'find方法参数格式不正确，应为对象';
                }

                // 检查update方法的参数
                if (line.match(/\.update\(/i) && !line.match(/\.update\(\s*\{.*\}\s*,\s*\{.*\}\s*[,\)]/i)) {
                    return 'update方法应有查询条件和更新操作两个参数';
                }

                // 检查updateOne/updateMany方法的参数
                if ((line.match(/\.updateOne\(/i) || line.match(/\.updateMany\(/i)) &&
                    !line.match(/\.(updateOne|updateMany)\(\s*\{.*\}\s*,\s*\{.*\}\s*[,\)]/i)) {
                    return 'updateOne/updateMany方法应有查询条件和更新操作两个参数';
                }

                // 检查insertOne方法的参数
                if (line.match(/\.insertOne\(/i) && !line.match(/\.insertOne\(\s*\{.*\}\s*[,\)]/i)) {
                    return 'insertOne方法参数格式不正确，应为对象';
                }

                // 检查insertMany方法的参数
                if (line.match(/\.insertMany\(/i) && !line.match(/\.insertMany\(\s*\[\s*.*\s*\]\s*[,\)]/i)) {
                    return 'insertMany方法参数格式不正确，应为数组';
                }

                // 检查deleteOne/deleteMany方法的参数
                if ((line.match(/\.deleteOne\(/i) || line.match(/\.deleteMany\(/i)) &&
                    !line.match(/\.(deleteOne|deleteMany)\(\s*\{.*\}\s*[,\)]/i)) {
                    return 'deleteOne/deleteMany方法参数格式不正确，应为查询条件对象';
                }

                // 检查$set操作符格式
                if (line.match(/\$set\s*:/i) && !line.match(/\$set\s*:\s*\{.*\}/i)) {
                    return '$set操作符格式不正确，应为对象';
                }

                // 检查$push操作符格式
                if (line.match(/\$push\s*:/i) && !line.match(/\$push\s*:\s*\{.*\}/i)) {
                    return '$push操作符格式不正确，应为对象';
                }

                // 检查$pull操作符格式
                if (line.match(/\$pull\s*:/i) && !line.match(/\$pull\s*:\s*\{.*\}/i)) {
                    return '$pull操作符格式不正确，应为对象';
                }

                // 检查$inc操作符格式
                if (line.match(/\$inc\s*:/i) && !line.match(/\$inc\s*:\s*\{.*\}/i)) {
                    return '$inc操作符格式不正确，应为对象';
                }
            }
        } catch (error) {
            console.error('验证语法时出错:', error);
            return '语法验证出错';
        }

        return null;
    };

    // 表格列定义
    const columns = [
        {
            title: '行号',
            dataIndex: 'lineNumber',
            key: 'lineNumber',
            width: 80,
        },
        {
            title: '内容',
            dataIndex: 'content',
            key: 'content',
            ellipsis: true,
        },
        {
            title: '表名',
            dataIndex: 'tableName',
            key: 'tableName',
            width: 120,
        },
        {
            title: '状态',
            key: 'status',
            width: 100,
            render: (_, record) => (
                record.isValid ?
                    <Tag color="success">有效</Tag> :
                    <Tag color="error">无效</Tag>
            ),
        },
        {
            title: '问题',
            dataIndex: 'issues',
            key: 'issues',
            render: issues => (
                <>
                    {issues.map((issue, index) => (
                        <div key={index}>{issue}</div>
                    ))}
                </>
            ),
        },
    ];

    return (
        <div className="script-validation-page">
            <Card>
                <Title level={2}>脚本校验</Title>

                <Space direction="vertical" style={{ width: '100%' }}>
                    <Space>
                        <span>脚本类型:</span>
                        <Select
                            value={scriptType}
                            onChange={handleScriptTypeChange}
                            style={{ width: 150 }}
                        >
                            <Option value="MySQL">MySQL</Option>
                            <Option value="MongoDB">MongoDB</Option>
                        </Select>

                        <Button
                            type="primary"
                            icon={<UploadOutlined />}
                            onClick={importScriptFromFile}
                        >
                            导入脚本文件
                        </Button>
                    </Space>

                    <div style={{
                        border: '1px solid #d9d9d9',
                        borderRadius: '2px',
                        marginTop: 16,
                        position: 'relative',
                        height: '400px',
                        overflow: 'hidden'
                    }}>
                        <MonacoEditor
                            width="100%"
                            height="100%" // 使用100%高度填充容器
                            language={getEditorLanguage()}
                            theme="sqlCustomTheme"
                            value={scriptContent}
                            options={editorOptions}
                            onChange={handleEditorChange}
                            editorDidMount={editorDidMount}
                        />
                    </div>

                    <Button
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        onClick={validateScript}
                        loading={isValidating}
                        disabled={!scriptContent.trim()}
                        style={{ marginTop: 16 }}
                    >
                        校验脚本
                    </Button>

                    {validationResults.length > 0 && (
                        <Card
                            title="校验结果"
                            style={{ marginTop: 16 }}
                            className="validation-results-card"
                        >
                            <Table
                                columns={columns}
                                dataSource={validationResults}
                                pagination={false}
                                size="small"
                                bordered
                                scroll={{ y: 300 }}
                            />
                        </Card>
                    )}
                </Space>
            </Card>
            {/* 添加全局样式覆盖 */}
            <style jsx global>{`
                /* 强制设置关键字颜色 */
                .monaco-editor .mtk8,
                .monaco-editor .mtk5,
                .monaco-editor .mtk12 {
                    color: blue !important;
                    font-weight: bold !important;
                }
                
                /* 确保编辑器容器正确显示 */
                .monaco-editor {
                    overflow: visible !important;
                }
                .monaco-editor .overflow-guard {
                    overflow: visible !important;
                }
                .monaco-editor-background {
                    overflow: visible !important;
                }
            `}</style>
        </div>
    );
}

export default ScriptValidationPage;
