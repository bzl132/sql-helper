import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Button,
  Select,
  Radio,
  Checkbox,
  Table,
  Card,
  Typography,
  Space,
  message,
  Input
} from 'antd';
import { FileOutlined, CodeOutlined, DownloadOutlined } from '@ant-design/icons';
import './ScriptGenerationPage.css';


// 添加xlsx库用于解析Excel文件
import * as XLSX from 'xlsx';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';

function ScriptGenerationPage() {
  const [csvData, setCsvData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [dbType, setDbType] = useState("MySQL");
  const [operationType, setOperationType] = useState("UPDATE"); // 新增：操作类型
  const [fieldMappings, setFieldMappings] = useState({});
  const [conditionField, setConditionField] = useState("");
  const [updateFields, setUpdateFields] = useState([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [script, setScript] = useState("");
  const [editableScript, setEditableScript] = useState("");
  const [config, setConfig] = useState({});
  const [availableTables, setAvailableTables] = useState([]);
  const [hasHeaders, setHasHeaders] = useState(true);
  const [fileType, setFileType] = useState("csv"); // 添加文件类型状态


  useEffect(() => {
    // 组件挂载时加载配置
    loadConfig();

    // 添加自定义的标签页切换事件监听器
    const handleTabChange = (event) => {
      console.log('标签页切换事件:', event.detail.tab);
      // 当切换到脚本生成标签页时重新加载配置
      if (event.detail.tab === 'script') {
        console.log('脚本生成标签页被激活，重新加载配置');
        loadConfig();
      }
    };

    document.addEventListener('tab-change', handleTabChange);

    // 清理函数
    return () => {
      document.removeEventListener('tab-change', handleTabChange);
    };
  }, []);

  const loadConfig = () => {
    // 加载保存的配置
    const savedConfig = localStorage.getItem('dbConfig');
    if (savedConfig) {
      const parsedConfig = JSON.parse(savedConfig);
      setConfig(parsedConfig);
      setAvailableTables(Object.keys(parsedConfig));

      // 检查是否有从配置页面选中的表
      const selectedTableFromConfig = localStorage.getItem('selectedTable');
      if (selectedTableFromConfig && parsedConfig[selectedTableFromConfig]) {
        setSelectedTable(selectedTableFromConfig);

        // 根据配置类型设置数据库类型
        const tableType = localStorage.getItem('selectedTableType');
        setDbType(tableType);
      }
    }

    // 从localStorage加载CSV数据
    const savedCsvData = localStorage.getItem('csvData');
    const savedHeaders = localStorage.getItem('csvHeaders');
    if (savedCsvData && savedHeaders) {
      setCsvData(JSON.parse(savedCsvData));
      setHeaders(JSON.parse(savedHeaders));
    }
  };

  const selectCsvFile = async () => {
    try {
      // 创建一个隐藏的文件输入元素
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.csv';

      fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          // 处理选择的文件
          const reader = new FileReader();
          reader.onload = async (event) => {
            const content = event.target.result;

            // 解析 CSV 内容
            const lines = content.split('\n');
            const parsedData = lines.map(line => line.split(',').map(item => item.trim()));

            if (parsedData.length > 0) {
              let headers, csvData;

              if (hasHeaders) {
                // 如果CSV有表头，第一行作为表头
                headers = parsedData[0];
                csvData = parsedData.slice(1).filter(row => row.length > 1);
              } else {
                // 如果CSV没有表头，自动生成表头（列1，列2，列3...）
                const columnCount = parsedData[0].length;
                headers = Array.from({ length: columnCount }, (_, i) => `列${i + 1}`);
                csvData = parsedData.filter(row => row.length > 1); // 所有行都作为数据
              }

              // 设置状态
              setHeaders(headers);
              setCsvData(csvData);

              // 保存到localStorage
              localStorage.setItem('csvHeaders', JSON.stringify(headers));
              localStorage.setItem('csvData', JSON.stringify(csvData));

              message.success('CSV文件解析成功');
            }
          };
          reader.readAsText(file);
        }
      };

      fileInput.click();
    } catch (error) {
      console.error('选择或解析CSV文件时出错:', error);
      message.error(`选择或解析CSV文件时出错: ${error.message}`);
    }
  };

  const handleTableChange = (value) => {
    setSelectedTable(value);
    // 重置字段映射
    setFieldMappings({});
    setConditionField("");
    setUpdateFields([]);

    // 清空脚本和可编辑脚本
    setScript("");
    setEditableScript("");

    // 清空 localStorage 中的相关数据
    localStorage.removeItem('csvHeaders');
    localStorage.removeItem('csvData');

    // 清空 CSV 数据和表头
    setHeaders([]);
    setCsvData([]);

    // 重置hasHeaders为默认值
    setHasHeaders(true);

    // 如果选择了新表，则保存到 localStorage
    if (value) {
      localStorage.setItem('selectedTable', value);
      if (config[value]) {
        localStorage.setItem('selectedTableType', config[value].type);
      }
    } else {
      // 如果清空了选择，也清除 localStorage 中的记录
      localStorage.removeItem('selectedTable');
      localStorage.removeItem('selectedTableType');
    }
  };

  // 处理操作类型变更
  const handleOperationTypeChange = (value) => {
    setOperationType(value);
    // 如果切换到INSERT，不需要条件字段和更新字段
    if (value === "INSERT") {
      setConditionField("");
      setUpdateFields([]);
    }
    // 如果切换到DELETE，只需要条件字段，不需要更新字段
    else if (value === "DELETE") {
      setUpdateFields([]);
    }
  };

  const handleFieldMapping = (csvField, dbField, csvIndex) => {
    // 如果选择了空值（"-- 选择字段 --"），则从映射中删除该字段
    if (!dbField) {
      const newFieldMappings = { ...fieldMappings };
      delete newFieldMappings[csvField];
      
      // 如果该字段是条件字段，也需要清除条件字段
      if (fieldMappings[csvField]?.dbField === conditionField) {
        setConditionField("");
      }
      
      // 如果该字段在更新字段列表中，也需要从更新字段列表中移除
      if (updateFields.includes(fieldMappings[csvField]?.dbField)) {
        setUpdateFields(updateFields.filter(f => f !== fieldMappings[csvField]?.dbField));
      }
      
      setFieldMappings(newFieldMappings);
      return;
    }
    
    // 获取选中字段的类型信息
    let fieldType = "";
    if (dbField && config[selectedTable]?.fields) {
      const fieldInfo = config[selectedTable].fields.find(field => {
        if (typeof field === 'object') {
          return field.name === dbField;
        }
        return field === dbField;
      });
      
      if (fieldInfo && typeof fieldInfo === 'object') {
        fieldType = fieldInfo.type || "";
      }
    }
    
    setFieldMappings({
      ...fieldMappings,
      [csvField]: {
        dbField: dbField,
        csvIndex: csvIndex,
        fieldType: fieldType // 添加字段类型
      }
    });
  };

  const toggleUpdateField = (field) => {
    if (updateFields.includes(field)) {
      setUpdateFields(updateFields.filter(f => f !== field));
    } else {
      setUpdateFields([...updateFields, field]);
    }
  };

  // 处理脚本编辑
  const handleScriptChange = (e) => {
    setEditableScript(e.target.value);
  };

  // 导出脚本到文件
  const exportScriptToFile = async () => {
    try {

      // 检查脚本是否为空
      if (!editableScript || editableScript.trim() === '') {
        message.warning('脚本内容为空，无法导出');
        return;
      }

      // 根据数据库类型设置不同的文件扩展名
      const fileExtension = dbType === "MongoDB" ? ".js" : ".sql";
      const defaultFileName = `${selectedTable}_script_${new Date().toISOString().slice(0, 10)}${fileExtension}`;

      // 使用Tauri的原生对话框API
      const filePath = await save({
        filters: [{
          name: dbType === "MongoDB" ? 'JavaScript Files' : 'SQL Files',
          extensions: [dbType === "MongoDB" ? 'js' : 'sql']
        }],
        defaultPath: defaultFileName
      });

      if (filePath) {
        // 使用Tauri的文件系统API写入文件
        await writeTextFile(filePath, editableScript);
        message.success('脚本已导出');
      }
    } catch (error) {
      console.error('导出脚本时出错:', error);
      message.error(`导出脚本时出错: ${error.message}`);
    }
  };

  // 表格列定义
  const columns = [
    {
      title: 'CSV 字段',
      dataIndex: 'csvField',
      key: 'csvField',
      width: '150px',  // 使用固定像素宽度
      ellipsis: true, // 添加省略号
      render: (text, record) => (
        <div>
          <div style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%'
          }} title={text}>  {/* 添加title属性显示完整内容 */}
            <strong>{text}</strong>
          </div>
          {csvData.length > 0 && (
            <div style={{
              color: '#888',
              fontSize: '12px',
              marginTop: '4px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }} title={csvData[0][record.key] || '无数据'}>  {/* 为示例值也添加title属性 */}
              示例: {csvData[0][record.key] || '无数据'}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '数据库字段',
      dataIndex: 'dbField',
      key: 'dbField',
      width: '30%',  // 调整宽度
      render: (_, record, index) => (
        <Select
          style={{ width: '100%' }}
          value={fieldMappings[record.csvField]?.dbField || ""}
          onChange={(value) => handleFieldMapping(record.csvField, value, index)}
          placeholder="选择字段"
        >
          <Option value="">-- 选择字段 --</Option>
          {config[selectedTable]?.fields && config[selectedTable]?.fields.map((field, i) => (
            <Option key={i} value={typeof field === 'object' ? field.name : field}>
              {typeof field === 'object' ? `${field.name} (${field.type})` : field}
            </Option>
          ))}
        </Select>
      ),
    },
    (operationType !== "INSERT" ? {
      title: '条件字段',
      dataIndex: 'condition',
      key: 'condition',
      width: '15%',  // 减小宽度
      render: (_, record) => (
        <Radio
          checked={fieldMappings[record.csvField]?.dbField === conditionField}
          onChange={() => setConditionField(fieldMappings[record.csvField]?.dbField)}
          disabled={!fieldMappings[record.csvField]?.dbField}
        />
      ),
    } : {}),
    (operationType === "UPDATE" ? {
      title: '更新字段',
      dataIndex: 'update',
      key: 'update',
      width: '15%',  // 减小宽度
      render: (_, record) => (
        <Checkbox
          checked={updateFields.includes(fieldMappings[record.csvField]?.dbField)}
          onChange={() => toggleUpdateField(fieldMappings[record.csvField]?.dbField)}
          disabled={!fieldMappings[record.csvField]?.dbField || fieldMappings[record.csvField]?.dbField === conditionField}
        />
      ),
    } : {}),
  ];

  // 根据操作类型确定生成按钮是否禁用
  const isGenerateButtonDisabled = () => {
    if (!selectedTable) return true;

    // 检查是否有字段映射
    const hasMappings = Object.keys(fieldMappings).length > 0;

    if (operationType === "INSERT") {
      return !hasMappings;
    } else if (operationType === "DELETE") {
      return !conditionField;
    } else { // UPDATE
      return !conditionField || updateFields.length === 0;
    }
  };

  // 根据数据库类型筛选可用的表
  const filteredTables = availableTables.filter(tableName => {
    if (!config[tableName]) return false;
    if (dbType === "MongoDB" && config[tableName].type === "MongoDB") return true;
    if (dbType === "MySQL" && config[tableName].type === "MySQL") return true;
    return false;
  });

  // 当数据库类型变化时，重置选中的表
  useEffect(() => {
    // 如果当前选中的表不符合筛选条件，则重置选中的表
    if (selectedTable && config[selectedTable] && config[selectedTable].type !== dbType) {
      setSelectedTable("");
      setFieldMappings({});
      setConditionField("");
      setUpdateFields([]);
    }
  }, [dbType, config, selectedTable]);

  // 将headers转换为表格数据
  const tableData = headers.map((header, index) => ({
    key: index,
    csvField: header,
  }));

  // 为CSV数据表格创建列定义
  const csvColumns = headers.map((header, index) => ({
    title: header,
    dataIndex: index.toString(),
    key: index.toString(),
    ellipsis: true,
    width: 150,  // 设置宽度
  }));

  // 将CSV数据转换为表格数据格式
  const csvTableData = csvData.map((row, rowIndex) => {
    const rowData = { key: rowIndex };
    row.forEach((cell, cellIndex) => {
      rowData[cellIndex.toString()] = cell;
    });
    return rowData;
  });


  // 处理导入的数据 - 只导入前10行用于预览
  const processImportedData = (parsedData) => {
    if (parsedData.length > 0) {
      let headers, csvData;

      if (hasHeaders) {
        // 如果有表头，第一行作为表头
        headers = parsedData[0];
        // 只取前10行数据用于预览
        csvData = parsedData.slice(1, 11).filter(row => row.length > 1);
      } else {
        // 如果没有表头，自动生成表头（列1，列2，列3...）
        const columnCount = parsedData[0].length;
        headers = Array.from({ length: columnCount }, (_, i) => `列${i + 1}`);
        // 只取前10行数据用于预览
        csvData = parsedData.slice(0, 10).filter(row => row.length > 1);
      }

      // 设置状态
      setHeaders(headers);
      setCsvData(csvData);

      console.log('Headers:', headers);
      console.log('CSV Data (Preview):', csvData);

      // 保存到localStorage - 只保存headers和文件路径
      localStorage.setItem('csvHeaders', JSON.stringify(headers));

      // 保存原始文件信息，以便生成脚本时重新读取
      localStorage.setItem('lastImportedFileType', fileType);

      // 不再保存完整数据到localStorage
      // localStorage.setItem('csvData', JSON.stringify(csvData));

      message.success(`${fileType.toUpperCase()}文件解析成功（预览模式：仅显示前10行）`);
    }
  };

  // 修改generateScript函数，在生成脚本前重新导入完整数据
  const generateScript = async () => {
    try {
      message.loading({ content: '正在处理数据并生成脚本...', key: 'scriptGen' });
      
      // 检查是否需要重新导入完整数据
      const fullDataNeeded = true; // 始终重新导入完整数据

      if (fullDataNeeded) {
        // 获取上次导入的文件信息
        const lastFileInput = document.getElementById('hiddenFileInput');

        if (lastFileInput && lastFileInput.files && lastFileInput.files[0]) {
          const file = lastFileInput.files[0];
          const fileExtension = file.name.split('.').pop().toLowerCase();

          // 读取完整文件数据
          let fullData = [];

          if (fileExtension === 'csv') {
            // 处理CSV文件
            const content = await readFileAsText(file);
            const lines = content.split('\n');
            fullData = lines.map(line => line.split(',').map(item => item.trim()));
          } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            // 处理Excel文件
            const data = await readFileAsArrayBuffer(file);
            const workbook = XLSX.read(new Uint8Array(data), {
              type: 'array',
              cellFormula: false,
              cellHTML: false,
              cellText: false
            });

            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            fullData = XLSX.utils.sheet_to_json(worksheet, {
              header: 1,
              raw: true,
              defval: ''
            });
          }

          // 提取完整数据
          let fullCsvData;
          if (hasHeaders) {
            fullCsvData = fullData.slice(1).filter(row => row.length > 1);
          } else {
            fullCsvData = fullData.filter(row => row.length > 1);
          }

          // 生成数据库脚本
          await generateScriptWithData(fullCsvData);
        } else {
          message.destroy('scriptGen');
          message.warning('找不到导入的文件，请重新导入数据文件');
        }
      } else {
        // 使用当前数据生成脚本
        await generateScriptWithData(csvData);
      }
    } catch (error) {
      message.destroy('scriptGen');
      console.error('脚本生成失败:', error);
      message.error('脚本生成失败: ' + error);
    }
  };

  // 辅助函数：读取文件为文本
  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  };

  // 辅助函数：读取文件为ArrayBuffer
  const readFileAsArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  // 使用数据生成脚本的核心函数
  const generateScriptWithData = async (data) => {
    try {
      if (dbType === "MongoDB") {
        if (operationType === "UPDATE") {
          const result = await invoke("generate_mongodb_script", {
            csvData: data,
            fieldMappings, // 现在包含了字段类型信息
            conditionField,
            updateFields,
            tableName: selectedTable
          });
          setScript(result);
          setEditableScript(result);
        } else if (operationType === "INSERT") {
          const result = await invoke("generate_mongodb_insert_script", {
            csvData: data,
            fieldMappings,
            tableName: selectedTable
          });
          setScript(result);
          setEditableScript(result);
        } else if (operationType === "DELETE") {
          const result = await invoke("generate_mongodb_delete_script", {
            csvData: data,
            fieldMappings,
            conditionField,
            tableName: selectedTable
          });
          setScript(result);
          setEditableScript(result);
        }
      } else { // MySQL
        if (operationType === "UPDATE") {
          const result = await invoke("generate_mysql_script", {
            csvData: data,
            fieldMappings,
            conditionField,
            updateFields,
            tableName: selectedTable
          });
          setScript(result);
          setEditableScript(result);
        } else if (operationType === "INSERT") {
          const result = await invoke("generate_mysql_insert_script", {
            csvData: data,
            fieldMappings,
            tableName: selectedTable
          });
          setScript(result);
          setEditableScript(result);
        } else if (operationType === "DELETE") {
          const result = await invoke("generate_mysql_delete_script", {
            csvData: data,
            fieldMappings,
            conditionField,
            tableName: selectedTable
          });
          setScript(result);
          setEditableScript(result);
        }
      }
      message.destroy('scriptGen');
      message.success('脚本生成成功');
    } catch (error) {
      message.destroy('scriptGen');
      console.error('脚本生成失败:', error);
      message.error('脚本生成失败: ' + error);
    }
  };

  // 修改文件选择函数，保存文件引用

  // 修改文件选择函数，保存文件引用
  function selectDataFile() {
    try {
      // 移除旧的文件输入元素（如果存在）
      const oldInput = document.getElementById('hiddenFileInput');
      if (oldInput) {
        document.body.removeChild(oldInput);
      }

      // 创建一个隐藏的文件输入元素
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.csv,.xlsx,.xls'; // 同时接受CSV和Excel文件
      fileInput.id = 'hiddenFileInput';
      fileInput.style.display = 'none';
      document.body.appendChild(fileInput);

      fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          // 根据文件扩展名判断文件类型
          const fileExtension = file.name.split('.').pop().toLowerCase();
          setFileType(fileExtension);

          if (fileExtension === 'csv') {
            // 处理CSV文件
            const reader = new FileReader();
            reader.onload = async (event) => {
              const content = event.target.result;

              // 解析 CSV 内容
              const lines = content.split('\n');
              const parsedData = lines.map(line => line.split(',').map(item => item.trim()));

              processImportedData(parsedData);
            };
            reader.readAsText(file);
          } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            // 处理Excel文件 - 只读取前几行用于预览
            try {
              message.loading({ content: '正在解析Excel文件...', key: 'excelLoading' });

              const reader = new FileReader();
              reader.onload = async (event) => {
                try {
                  const data = new Uint8Array(event.target.result);

                  // 使用更高效的方式读取Excel文件
                  const workbook = XLSX.read(data, {
                    type: 'array',
                    cellFormula: false,  // 禁用公式解析
                    cellHTML: false,     // 禁用HTML解析
                    cellText: false      // 禁用富文本解析
                  });

                  // 获取第一个工作表
                  const firstSheetName = workbook.SheetNames[0];
                  const worksheet = workbook.Sheets[firstSheetName];

                  // 使用更高效的方式转换数据 - 只读取前几行
                  const sheetRange = XLSX.utils.decode_range(worksheet['!ref']);
                  // 限制读取范围为前11行（1行表头+10行数据）或更少
                  const limitedRange = {
                    s: { r: sheetRange.s.r, c: sheetRange.s.c },
                    e: {
                      r: Math.min(sheetRange.s.r + 10, sheetRange.e.r),
                      c: sheetRange.e.c
                    }
                  };

                  worksheet['!ref'] = XLSX.utils.encode_range(limitedRange);

                  const parsedData = XLSX.utils.sheet_to_json(worksheet, {
                    header: 1,
                    raw: true,
                    defval: ''
                  });

                  message.destroy('excelLoading');
                  processImportedData(parsedData);
                } catch (error) {
                  message.destroy('excelLoading');
                  console.error('解析Excel文件时出错:', error);
                  message.error(`解析Excel文件时出错: ${error.message}`);
                }
              };
              reader.readAsArrayBuffer(file);
            } catch (error) {
              message.destroy('excelLoading');
              console.error('解析Excel文件时出错:', error);
              message.error(`解析Excel文件时出错: ${error.message}`);
            }
          } else {
            message.error('不支持的文件格式，请选择CSV或Excel文件');
          }
        }
      };

      fileInput.click();
    } catch (error) {
      console.error('选择或解析文件时出错:', error);
      message.error(`选择或解析文件时出错: ${error.message}`);
    }
  };

  return (
    <div className="script-generation-page">
      <Card>
        <Title level={2}>脚本生成</Title>

        <Space direction="vertical" style={{ width: '100%' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ display: 'inline-block', width: '100px' }}>数据库类型：</span>
              <Select
                style={{ width: 200 }}
                value={dbType}
                onChange={(value) => setDbType(value)}
              >
                <Option value="MongoDB">MongoDB</Option>
                <Option value="MySQL">MySQL</Option>
              </Select>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <span style={{ display: 'inline-block', width: '100px' }}>操作类型：</span>
              <Select
                style={{ width: 200 }}
                value={operationType}
                onChange={handleOperationTypeChange}
              >
                <Option value="UPDATE">UPDATE (更新)</Option>
                <Option value="INSERT">INSERT (插入)</Option>
                <Option value="DELETE">DELETE (删除)</Option>
              </Select>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <span style={{ display: 'inline-block', width: '100px' }}>选择表：</span>
              <Select
                style={{ width: 200 }}
                value={selectedTable}
                onChange={handleTableChange}
                placeholder="选择表"
              >
                <Option value="">-- 选择表 --</Option>
                {filteredTables.map((table, index) => (
                  <Option key={index} value={table}>{table}</Option>
                ))}
              </Select>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <span style={{ display: 'inline-block', width: '100px' }}>数据文件：</span>
              <Button
                type="primary"
                icon={<FileOutlined />}
                onClick={selectDataFile}
              >
                选择数据文件
              </Button>
              <Checkbox
                checked={hasHeaders}
                onChange={(e) => setHasHeaders(e.target.checked)}
                style={{ marginLeft: '10px' }}
              >
                文件包含表头
              </Checkbox>
              <span style={{ marginLeft: '10px', color: '#888' }}>
                支持格式: CSV, XLSX, XLS
              </span>
            </div>
          </Space>

          {/* 显示导入的CSV数据 */}

          {selectedTable && headers.length > 0 && (
            <Card
              title="字段映射"
              style={{ marginTop: 16 }}
              className="mapping-card"
            >
              <Table
                columns={columns}
                dataSource={tableData}
                pagination={false}
                scroll={{ x: 'max-content' }}  // 添加水平滚动
                size="small"
                bordered
              />

              <Button
                type="primary"
                onClick={generateScript}
                disabled={isGenerateButtonDisabled()}
                style={{ marginTop: 16 }}
                icon={<CodeOutlined />}
              >
                生成{operationType === "UPDATE" ? "更新" : operationType === "INSERT" ? "插入" : "删除"}脚本
              </Button>
            </Card>
          )}

          {script && (
            <Card
              title="生成的脚本"
              style={{ marginTop: 16 }}
              className="script-card"
              extra={
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={exportScriptToFile}
                >
                  导出脚本
                </Button>
              }
            >
              <TextArea
                value={editableScript}
                onChange={handleScriptChange}
                autoSize={{ minRows: 10, maxRows: 20 }}
                style={{ fontFamily: 'monospace' }}
              />
              <Space style={{ marginTop: 16 }}>
                <Button
                  type="primary"
                  onClick={() => {
                    navigator.clipboard.writeText(editableScript);
                    message.success('脚本已复制到剪贴板');
                  }}
                >
                  复制脚本
                </Button>
              </Space>
            </Card>
          )}

        </Space>
      </Card>
    </div>
  );
}

export default ScriptGenerationPage;