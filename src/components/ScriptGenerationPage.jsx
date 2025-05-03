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

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';

function ScriptGenerationPage() {
  const [csvData, setCsvData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [dbType, setDbType] = useState("MySQL");
  const [fieldMappings, setFieldMappings] = useState({});
  const [conditionField, setConditionField] = useState("");
  const [updateFields, setUpdateFields] = useState([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [script, setScript] = useState("");
  const [editableScript, setEditableScript] = useState("");
  const [config, setConfig] = useState({});
  const [availableTables, setAvailableTables] = useState([]);
  const [hasHeaders, setHasHeaders] = useState(true);


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

  // useEffect(() => {
  //   // 加载保存的配置
  //   const savedConfig = localStorage.getItem('dbConfig');
  //   if (savedConfig) {
  //     const parsedConfig = JSON.parse(savedConfig);
  //     setConfig(parsedConfig);
  //     setAvailableTables(Object.keys(parsedConfig));

  //     // 检查是否有从配置页面选中的表
  //     const selectedTableFromConfig = localStorage.getItem('selectedTable');
  //     if (selectedTableFromConfig && parsedConfig[selectedTableFromConfig]) {
  //       setSelectedTable(selectedTableFromConfig);

  //       // 根据配置类型设置数据库类型
  //       const tableType = localStorage.getItem('selectedTableType');

  //       setDbType(tableType);
  //     }
  //   }

  //   // 从localStorage加载CSV数据
  //   const savedCsvData = localStorage.getItem('csvData');
  //   const savedHeaders = localStorage.getItem('csvHeaders');
  //   if (savedCsvData && savedHeaders) {
  //     setCsvData(JSON.parse(savedCsvData));
  //     setHeaders(JSON.parse(savedHeaders));
  //   }
  // }, []);

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

  const handleFieldMapping = (csvField, dbField, csvIndex) => {
    setFieldMappings({
      ...fieldMappings,
      [csvField]: {
        dbField: dbField,
        csvIndex: csvIndex
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

  const generateScript = async () => {
    // 生成数据库脚本
    try {
      if (dbType === "MongoDB") {
        console.log("MongoDB", "param", csvData, fieldMappings, conditionField, updateFields, selectedTable);
        const result = await invoke("generate_mongodb_script", {
          csvData,
          fieldMappings,
          conditionField,
          updateFields,
          tableName: selectedTable
        });
        console.log(result, "MongoDB", "result");
        setScript(result);
        setEditableScript(result); // 设置可编辑脚本的初始值
      } else {
        const result = await invoke("generate_mysql_script", {
          csvData,
          fieldMappings,
          conditionField,
          updateFields,
          tableName: selectedTable
        });
        console.log(result, "MySQL", "result");
        setScript(result);
        setEditableScript(result); // 设置可编辑脚本的初始值
      }
      message.success('脚本生成成功');
    } catch (error) {
      console.error('脚本生成失败:', error);
      message.error('脚本生成失败: ' + error);
    }
  };

  // 处理脚本编辑
  const handleScriptChange = (e) => {
    setEditableScript(e.target.value);
  };

  // 导出脚本到文件
  const exportScriptToFile = async () => {
    try {
      console.log('开始导出脚本...');

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
        console.log('文件已保存到:', filePath);
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
      width: '25%',
      render: (text, record) => (
        <div>
          <div><strong>{text}</strong></div>
          {csvData.length > 0 && (
            <div style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>
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
      width: '35%',
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
    {
      title: '条件字段',
      dataIndex: 'condition',
      key: 'condition',
      width: '20%',
      render: (_, record) => (
        <Radio
          checked={fieldMappings[record.csvField]?.dbField === conditionField}
          onChange={() => setConditionField(fieldMappings[record.csvField]?.dbField)}
          disabled={!fieldMappings[record.csvField]?.dbField}
        />
      ),
    },
    {
      title: '更新字段',
      dataIndex: 'update',
      key: 'update',
      width: '20%',
      render: (_, record) => (
        <Checkbox
          checked={updateFields.includes(fieldMappings[record.csvField]?.dbField)}
          onChange={() => toggleUpdateField(fieldMappings[record.csvField]?.dbField)}
          disabled={!fieldMappings[record.csvField]?.dbField || fieldMappings[record.csvField]?.dbField === conditionField}
        />
      ),
    },
  ];

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
  }));

  // 将CSV数据转换为表格数据格式
  const csvTableData = csvData.map((row, rowIndex) => {
    const rowData = { key: rowIndex };
    row.forEach((cell, cellIndex) => {
      rowData[cellIndex.toString()] = cell;
    });
    return rowData;
  });

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
              <span style={{ display: 'inline-block', width: '100px' }}>CSV文件：</span>
              <Button
                type="primary"
                icon={<FileOutlined />}
                onClick={selectCsvFile}
              >
                选择 CSV 文件
              </Button>
              <Checkbox
                checked={hasHeaders}
                onChange={(e) => setHasHeaders(e.target.checked)}
                style={{ marginLeft: '10px' }}
              >
                CSV文件包含表头
              </Checkbox>
            </div>
          </Space>

          {/* 显示导入的CSV数据 */}
          {headers.length > 0 && csvData.length > 0 && (
            <Card
              title="导入的CSV数据"
              style={{ marginTop: 16 }}
              className="csv-data-card"
            >
              <Table
                columns={csvColumns}
                dataSource={csvTableData}
                pagination={false}
                size="small"
                bordered
                scroll={{ x: 'max-content', y: 300 }}
              />
            </Card>
          )}

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
                size="small"
                bordered
              />

              <Button
                type="primary"
                onClick={generateScript}
                disabled={!selectedTable || !conditionField || updateFields.length === 0}
                style={{ marginTop: 16 }}
                icon={<CodeOutlined />}
              >
                生成脚本
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