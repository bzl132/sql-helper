import { useState, useEffect } from "react";
import {
  Button,
  Input,
  Card,
  Typography,
  Divider,
  Space,
  message,
  Tag,
  Modal,
  Radio,
  Alert
} from 'antd';
import { FileOutlined, DownloadOutlined, UploadOutlined, PlusOutlined } from '@ant-design/icons';
import { readTextFile, writeTextFile, mkdir, exists, create } from "@tauri-apps/plugin-fs";
import { dirname, appDataDir } from '@tauri-apps/api/path';
import { open } from '@tauri-apps/plugin-dialog';

const { Title, Text } = Typography;

function ConfigPage() {
  const [fields, setFields] = useState([]);
  // 移除 mysqlFields 状态
  // const [mysqlFields, setMysqlFields] = useState([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [config, setConfig] = useState({});

  // 新增配置弹窗相关状态
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [configType, setConfigType] = useState("java");
  const [configName, setConfigName] = useState("");

  // 配置文件路径 - 不要使用硬编码的路径
  const [configFilePath, setConfigFilePath] = useState("");
  const [configFileDir, setConfigFileDir] = useState("");

  // 添加属性列表弹窗状态
  const [isFieldsModalVisible, setIsFieldsModalVisible] = useState(false);
  const [currentFields, setCurrentFields] = useState([]);

  // 添加一个状态来跟踪是否已经显示过配置文件不存在的提示
  const [configWarningShown, setConfigWarningShown] = useState(false);

  useEffect(() => {
    // 从 localStorage 加载配置文件路径
    const savedPath = localStorage.getItem('configFilePath');
    if (savedPath) {
      setConfigFilePath(savedPath);
      // 提取目录路径
      extractDirPath(savedPath);
    }

    // 从 localStorage 加载配置
    const loadConfig = () => {
      try {
        const savedConfig = localStorage.getItem('dbConfig');
        if (savedConfig) {
          setConfig(JSON.parse(savedConfig));
          // 只在开发环境下显示提示，或者完全移除此提示
          // message.success('配置加载成功');
        } else {
          // 如果 localStorage 中没有配置，尝试从文件加载
          loadConfigFromFile();
        }
      } catch (error) {
        console.error('从 localStorage 加载配置失败:', error);
        message.error(`加载配置失败: ${error.message}`);
        // 尝试从文件加载
        loadConfigFromFile();
      }
    };


    // 从文件加载配置
    const loadConfigFromFile = async () => {
      try {
        const configContent = await readTextFile(configFilePath);
        const loadedConfig = JSON.parse(configContent);
        setConfig(loadedConfig);
        // 同时保存到 localStorage
        localStorage.setItem('dbConfig', JSON.stringify(loadedConfig));
        message.success('从文件加载配置成功');
      } catch (error) {
        console.error('读取配置文件失败:', error);
        // 只有在未显示过警告时才显示
        if (!configWarningShown) {
          // message.warning('未找到配置文件，将使用空配置');
          setConfigWarningShown(true);
        }
        setConfig({});
      }
    };

    loadConfig();
    // 只在组件挂载时执行一次，移除 configFilePath 依赖
  }, []);


  // 提取目录路径
  const extractDirPath = async (filePath) => {
    try {
      if (filePath) {
        const dirPath = await dirname(filePath);
        console.log('提取的目录路径:', dirPath, filePath, configFileDir, setConfigFileDir);
        setConfigFileDir(dirPath);
      }
    } catch (error) {
      console.error('提取目录路径失败:', error);
    }
  };

  const selectJavaFile = async () => {
    try {
      // 使用Tauri的open对话框API选择文件
      const selected = await open({
        read: false,
        multiple: false,
        filters: [{
          name: 'Java文件',
          extensions: ['java']
        }]
      });

      if (selected) {
        // selected是完整的文件路径
        const filePath = selected;
        const fileName = filePath.split(/[\/\\]/).pop();
        const fileDir = filePath.substring(0, filePath.lastIndexOf('/') + 1);

        // 读取文件内容
        const content = await readTextFile(filePath);

        // 解析Java文件内容，提取字段和继承关系
        const { extractedFields, parentClass } = parseJavaClassWithInheritance(content);

        // 如果有父类，尝试加载父类属性
        let allFields = [...extractedFields];
        if (parentClass) {
          try {
            console.log("selectJavaFile, loadParentClassFields", fileDir, filePath, fileName);
            const parentFields = await loadParentClassFields(parentClass, fileDir);
            // 合并字段，确保不重复
            allFields = mergeFields(allFields, parentFields);
            message.success(`已加载父类 ${parentClass} 的属性`);
          } catch (error) {
            console.error('加载父类属性时出错:', error);
            message.warning(`无法加载父类 ${parentClass} 的属性: ${error.message}`);
          }
        }

        setFields(allFields);
        message.success('Java文件解析成功');
      }
    } catch (error) {
      console.error('选择或解析Java文件时出错:', error);
      message.error(`选择或解析Java文件时出错: ${error.message}`);
    }
  };

  // 解析 Java 文件中的字段和继承关系
  const parseJavaClassWithInheritance = (content) => {
    const extractedFields = [];
    let parentClass = null;

    try {
      // 提取类的继承关系
      const classDeclarationRegex = /class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+(?:[\w,\s]+))?/;
      const classMatch = classDeclarationRegex.exec(content);

      if (classMatch && classMatch[2]) {
        parentClass = classMatch[2];
      }

      // 使用正则表达式匹配 Java 类中的字段声明
      // 匹配 private、protected 或 public 修饰的字段
      const fieldRegex = /(?:private|protected|public)\s+(?:final\s+)?(\w+)(?:<.*?>)?\s+(\w+)\s*;/g;
      let match;
      while ((match = fieldRegex.exec(content)) !== null) {
        // match[1] 是字段类型，match[2] 是字段名
        const fieldType = match[1];
        const fieldName = match[2];

        // 排除class属性
        if (fieldName !== "class") {
          extractedFields.push({
            name: fieldName,
            type: fieldType
          });
        }
      }

      // 也可以匹配带有注解的字段
      const annotatedFieldRegex = /@.*?\s+(?:private|protected|public)\s+(?:final\s+)?(\w+)(?:<.*?>)?\s+(\w+)\s*;/g;

      while ((match = annotatedFieldRegex.exec(content)) !== null) {
        const fieldType = match[1];
        const fieldName = match[2];

        // 排除class属性
        if (fieldName !== "class") {
          const existingField = extractedFields.find(f => f.name === fieldName);
          if (!existingField) {
            extractedFields.push({
              name: fieldName,
              type: fieldType
            });
          }
        }
      }
    } catch (error) {
      console.error('解析 Java 字段时出错:', error);
    }

    return { extractedFields, parentClass };
  };

  // 加载父类的字段
  const loadParentClassFields = async (parentClassName, currentDir) => {
    try {
      // 尝试在当前目录和子目录中查找父类文件
      const parentFile = await findParentClassFile(parentClassName, currentDir);

      if (!parentFile) {
        throw new Error(`找不到父类 ${parentClassName} 的文件`);
      }

      // 读取父类文件内容
      const parentContent = await readTextFile(parentFile);

      // 解析父类文件，提取字段
      const { extractedFields, parentClass: grandParentClass } = parseJavaClassWithInheritance(parentContent);

      // 如果父类也有父类，递归加载祖父类的字段
      let allParentFields = [...extractedFields];
      if (grandParentClass) {
        try {
          // 获取父类文件所在目录
          const parentFileDir = parentFile.substring(0, parentFile.lastIndexOf('/') + 1);
          console.log("loadParentClassFields", parentFileDir);
          const grandParentFields = await loadParentClassFields(grandParentClass, parentFileDir);
          allParentFields = mergeFields(allParentFields, grandParentFields);
        } catch (error) {
          console.warn(`无法加载祖父类 ${grandParentClass} 的属性:`, error);
        }
      }

      return allParentFields;
    } catch (error) {
      console.error('加载父类字段时出错:', error);
      throw error;
    }
  };

  // 查找父类文件
  const findParentClassFile = async (parentClassName, currentDir) => {
    try {
      // 不再尝试直接访问文件系统中的路径
      // 而是提示用户手动选择父类文件
      message.info(`请选择父类 ${parentClassName}.java 文件`);

      const selected = await open({
        multiple: false,
        filters: [{
          name: 'Java文件',
          extensions: ['java']
        }]
      });

      if (selected) {
        // 验证选择的文件是否是正确的父类文件
        try {
          const content = await readTextFile(selected);

          // 简单验证文件内容是否包含正确的类名
          const classNameRegex = new RegExp(`class\\s+${parentClassName}\\b`);
          if (classNameRegex.test(content)) {
            return selected;
          } else {
            message.warning(`选择的文件不是 ${parentClassName} 类，请重新选择`);
            // 递归调用，让用户重新选择
            return findParentClassFile(parentClassName, currentDir);
          }
        } catch (error) {
          console.error('读取选择的文件失败:', error);
          message.error(`无法读取选择的文件: ${error.message}`);
          return null;
        }
      } else {
        // 用户取消了选择
        message.warning(`未选择父类 ${parentClassName} 文件，将只加载当前类的属性`);
        return null;
      }
    } catch (error) {
      console.error('查找父类文件时出错:', error);
      message.error(`查找父类文件时出错: ${error.message}`);
      return null;
    }
  };

  // 合并字段，确保不重复
  const mergeFields = (baseFields, additionalFields) => {
    const mergedFields = [...baseFields];

    additionalFields.forEach(field => {
      // 检查字段是否已存在
      const exists = mergedFields.some(f => f.name === field.name);
      if (!exists) {
        mergedFields.push(field);
      }
    });

    return mergedFields;
  };

  const selectMybatisFile = async () => {
    try {
      // 创建一个隐藏的文件输入元素
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.xml';

      fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          // 处理选择的文件
          const reader = new FileReader();
          reader.onload = async (event) => {
            const content = event.target.result;

            // 解析 MyBatis 文件内容，提取字段
            const extractedFields = parseMybatisFields(content);
            // 直接设置到 fields 中，不再使用 mysqlFields
            setFields(extractedFields);

            message.success('MyBatis文件解析成功');
          };
          reader.readAsText(file);
        }
      };

      fileInput.click();
    } catch (error) {
      console.error('选择或解析MyBatis文件时出错:', error);
      message.error(`选择或解析MyBatis文件时出错: ${error.message}`);
    }
  };

  // 解析 MyBatis 文件中的字段
  const parseMybatisFields = (content) => {
    const extractedFields = [];
    try {
      // 使用正则表达式匹配 MyBatis XML 中的字段
      // 匹配 resultMap 中的 result 标签，尝试提取 jdbcType 属性作为类型
      const resultRegex = /<result\s+(?:property|column)="([^"]+)"(?:.*?jdbcType="([^"]*)")?/g;
      let match;

      while ((match = resultRegex.exec(content)) !== null) {
        const fieldName = match[1];
        const fieldType = match[2] || "VARCHAR"; // 默认类型为 VARCHAR

        const existingField = extractedFields.find(f => f.name === fieldName);
        if (!existingField) {
          extractedFields.push({
            name: fieldName,
            type: fieldType
          });
        }
      }

      // 也匹配 id 标签
      const idRegex = /<id\s+(?:property|column)="([^"]+)"(?:.*?jdbcType="([^"]*)")?/g;

      while ((match = idRegex.exec(content)) !== null) {
        const fieldName = match[1];
        const fieldType = match[2] || "VARCHAR"; // 默认类型为 VARCHAR

        const existingField = extractedFields.find(f => f.name === fieldName);
        if (!existingField) {
          extractedFields.push({
            name: fieldName,
            type: fieldType
          });
        }
      }
    } catch (error) {
      console.error('解析 MyBatis 字段时出错:', error);
    }

    return extractedFields;
  };

  const saveConfiguration = () => {
    if (!selectedTable) {
      message.error('请输入表名');
      return;
    }

    // 保存配置到本地存储
    const newConfig = {
      ...config,
      [selectedTable]: {
        type: configType, // 使用当前选择的类型
        fields: fields
        // 移除 mysqlFields 属性
      }
    };
    setConfig(newConfig);
    localStorage.setItem('dbConfig', JSON.stringify(newConfig));
    message.success('配置保存成功');
  };

  // 导出配置到文件
  const exportConfig = async () => {
    try {
      // 从 localStorage 获取最新配置
      const savedConfig = localStorage.getItem('dbConfig');
      if (!savedConfig) {
        message.error('没有可导出的配置');
        return;
      }

      // 格式化配置数据
      const configData = JSON.stringify(JSON.parse(savedConfig), null, 2);

      try {
        // 确定文件名
        let fileName = 'sql-helper-config.json';
        if (configFilePath) {
          // 从路径中提取文件名
          const pathParts = configFilePath.split('/');
          fileName = pathParts[pathParts.length - 1];
        }

        // 使用 AppData 目录作为基础目录
        // 这是 Tauri 应用程序数据目录，已在 capabilities 中授权
        const appDataPath = await appDataDir();
        console.log('应用数据目录:', appDataPath);

        await mkdir(`${appDataPath}/config`, { recursive: true });
        const fullPath = `${appDataPath}/config/${fileName}`;

        // 检查配置文件是否存在
        const configExists = await exists(fullPath);
        console.log(configExists, "exists");

        if (configExists) {
          // 如果文件存在，直接写入
          await writeTextFile(fullPath, configData);
        } else {
          // 如果文件不存在，创建并写入
          const configFile = await create(fullPath);
          await configFile.write(new TextEncoder().encode(configData));
          await configFile.close();
          console.log("文件写完！");
        }

        // 更新配置文件路径
        setConfigFilePath(fullPath);
        localStorage.setItem('configFilePath', fullPath);

        message.success(`配置已成功导出到应用数据目录: ${fileName}`);
      } catch (fsError) {
        console.error('写入文件失败:', fsError);
        message.error(`导出配置失败: ${fsError.message}`);
      }
    } catch (error) {
      console.error('导出配置时出错:', error);
      message.error(`导出配置时出错: ${error.message}`);
    }
  };

  // 从文件导入配置
  const importConfig = () => {
    try {
      // 创建一个隐藏的文件输入元素
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.json';

      fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = async (event) => {
            try {
              const importedConfig = JSON.parse(event.target.result);

              // 更新内存中的配置
              setConfig(importedConfig);

              // 保存到 localStorage
              localStorage.setItem('dbConfig', JSON.stringify(importedConfig));

              // 获取完整的文件路径（如果可能）
              let fullPath = '';

              // 在 Tauri 环境中，我们可以尝试获取文件的完整路径
              try {
                // 使用 webkitRelativePath 或其他可用的属性获取相对路径
                if (file.path) {
                  // Tauri 可能提供 path 属性
                  fullPath = file.path;
                } else if (file.webkitRelativePath) {
                  // 或者使用 webkitRelativePath
                  fullPath = file.webkitRelativePath;
                } else {
                  // 如果无法获取完整路径，使用文件名
                  fullPath = file.name;

                  // 如果有之前的目录路径，尝试组合
                  if (configFileDir) {
                    fullPath = `${configFileDir}/${file.name}`;
                  }
                }

                // 保存文件路径
                setConfigFilePath(fullPath);
                localStorage.setItem('configFilePath', fullPath);

                // 提取并保存目录路径
                await extractDirPath(fullPath);

                message.success(`配置导入成功，文件路径: ${fullPath}`);
              } catch (pathError) {
                console.error('获取文件路径失败:', pathError);

                // 如果无法获取完整路径，至少保存文件名
                setConfigFilePath(file.name);
                localStorage.setItem('configFilePath', file.name);

                message.warning(`配置已导入，但无法获取完整文件路径: ${pathError.message}`);
              }
            } catch (parseError) {
              console.error('解析配置文件时出错:', parseError);
              message.error('配置文件格式错误，请确保是有效的 JSON 文件');
            }
          };
          reader.readAsText(file);
        }
      };

      fileInput.click();
    } catch (error) {
      console.error('导入配置时出错:', error);
      message.error(`导入配置时出错: ${error.message}`);
    }
  };

  // 显示新增配置弹窗
  const showAddConfigModal = () => {
    setIsModalVisible(true);
    setConfigName("");
    setConfigType("MongoDB");
    setFields([]);
  };

  // 关闭新增配置弹窗
  const handleCancel = () => {
    setIsModalVisible(false);
  };

  // 保存新增配置
  const handleSaveConfig = () => {
    if (!configName) {
      message.error('请输入配置名称');
      return;
    }

    // 检查是否存在同名配置
    if (config[configName]) {
      Modal.confirm({
        title: '配置已存在',
        content: `配置 "${configName}" 已存在，是否覆盖？`,
        okText: '覆盖',
        cancelText: '取消',
        onOk() {
          saveNewConfig();
        }
      });
    } else {
      saveNewConfig();
    }
  };

  // 保存新配置到本地存储
  const saveNewConfig = async () => {
    // 更新内存中的配置
    const newConfig = {
      ...config,
      [configName]: {
        type: configType,
        fields: fields
        // 移除 mysqlFields 属性
      }
    };
    setConfig(newConfig);

    // 保存到 localStorage
    localStorage.setItem('dbConfig', JSON.stringify(newConfig));

    message.success('配置已保存到本地存储');
    setIsModalVisible(false);
  };


  // 查看表的属性
  const viewTableFields = (tableName) => {
    if (config[tableName] && config[tableName].fields) {
      setCurrentFields(config[tableName].fields);
      setIsFieldsModalVisible(true);
    } else {
      message.warning(`表 ${tableName} 没有定义字段`);
    }
  };


  // 已导入的配置表格列定义
  const columns = [
    {
      title: '配置名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (text) => <Tag color={text === 'java' ? 'blue' : text === 'mybatis' ? 'green' : 'orange'}>{text}</Tag>,
    },
    {
      title: '字段数量',
      dataIndex: 'fieldCount',
      key: 'fieldCount',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            onClick={() => handleSelectTable(record.name)}
          >
            选择
          </Button>
          <Button
            size="small"
            onClick={() => viewTableFields(record.name)}
          >
            查看属性
          </Button>
          <Button
            size="small"
            danger
            onClick={() => handleDeleteConfig(record.name)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];


  return (
    <div className="config-page">
      <Card>
        <Title level={2}>数据库表字段配置</Title>

        <Space style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={exportConfig}
          >
            导出配置
          </Button>
          <Button
            icon={<UploadOutlined />}
            onClick={importConfig}
          >
            导入配置
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={showAddConfigModal}
          >
            新增配置
          </Button>
        </Space>

        <Alert
          message={`当前配置文件路径: ${configFilePath}`}
          type="info"
          style={{ marginBottom: 16 }}
        />

        {/* 添加配置表格 */}
        <div style={{ marginBottom: 16 }}>
          <Title level={4}>已导入的配置</Title>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
            <thead>
              <tr style={{ backgroundColor: '#f0f0f0' }}>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>表名</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>类型</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>字段数</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>字段内容</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(config).length > 0 ? (
                Object.keys(config).map((tableName) => (
                  <tr key={tableName} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{tableName}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                      {config[tableName].type || "未知"}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                      {config[tableName].fields ? config[tableName].fields.length : 0}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxHeight: '80px', overflowY: 'auto' }}>
                        {config[tableName].fields && config[tableName].fields.map((field, index) => (
                          <Tag key={index} color={config[tableName].type === "MongoDB" ? "blue" : "green"} style={{ margin: '2px' }}>
                            {typeof field === 'object' ? `${field.name} (${field.type})` : field}
                          </Tag>
                        ))}
                      </div>
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                      <Space>
                        <Button
                          size="small"
                          onClick={() => {
                            setSelectedTable(tableName);
                            setFields(config[tableName].fields || []);
                            // 保存选中的表名和类型到localStorage，供脚本生成页面使用
                            localStorage.setItem('selectedTable', tableName);
                            localStorage.setItem('selectedTableType', config[tableName].type);
                            message.success(`已选择配置: ${tableName}`);
                          }}
                        >
                          选择
                        </Button>
                        <Button
                          size="small"
                          onClick={() => viewTableFields(tableName)}
                        >
                          查看属性
                        </Button>
                        <Button
                          size="small"
                          danger
                          onClick={() => {
                            Modal.confirm({
                              title: '确认删除',
                              content: `确定要删除配置 "${tableName}" 吗？`,
                              okText: '删除',
                              cancelText: '取消',
                              onOk: () => {
                                const newConfig = { ...config };
                                delete newConfig[tableName];
                                setConfig(newConfig);
                                localStorage.setItem('dbConfig', JSON.stringify(newConfig));
                                message.success(`配置 "${tableName}" 已删除`);
                              }
                            });
                          }}
                        >
                          删除
                        </Button>
                      </Space>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                    <Text type="secondary">暂无配置，请导入或新增配置</Text>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>


      {/* 属性查看弹窗 */}
      <Modal
        title="表字段属性"
        open={isFieldsModalVisible}
        onCancel={() => setIsFieldsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsFieldsModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        <div style={{ maxHeight: '400px', overflow: 'auto' }}>
          {currentFields.map((field, index) => (
            <Card key={index} style={{ marginBottom: '8px' }}>
              {typeof field === 'object' ? (
                <div>
                  <strong>字段名:</strong> {field.name}<br />
                  <strong>类型:</strong> {field.type}
                </div>
              ) : (
                <div>
                  <strong>字段名:</strong> {field}
                </div>
              )}
            </Card>
          ))}
        </div>
      </Modal>

      {/* 新增配置弹窗 */}
      <Modal
        title="新增配置"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            取消
          </Button>,
          <Button key="save" type="primary" onClick={handleSaveConfig}>
            保存配置
          </Button>
        ]}
        width={700}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input
            placeholder="请输入配置名称"
            value={configName}
            onChange={(e) => setConfigName(e.target.value)}
            style={{ marginBottom: 16 }}
          />

          <Radio.Group
            value={configType}
            onChange={(e) => setConfigType(e.target.value)}
            style={{ marginBottom: 16 }}
          >
            <Radio value="MongoDB">导入Java对象文件</Radio>
            <Radio value="MySQL">导入MyBatis表配置文件</Radio>
          </Radio.Group>

          {configType === "MongoDB" ? (
            <div>
              <Divider orientation="left">Java对象配置</Divider>
              <Button
                type="primary"
                icon={<FileOutlined />}
                onClick={selectJavaFile}
                style={{ marginBottom: 16 }}
              >
                请选择Java对象文件导入MongoDB配置
              </Button>

              <Card
                title="字段列表"
                size="small"
                className="fields-card"
              >
                {fields.length > 0 ? (
                  <div style={{ marginTop: 16 }}>
                    <Title level={5}>已导入字段</Title>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {fields.map((field, index) => (
                        <Tag key={index}>
                          {typeof field === 'object' ? `${field.name} (${field.type})` : field}
                        </Tag>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Text type="secondary">暂无字段，请选择Java文件</Text>
                )}
              </Card>
            </div>
          ) : (
            <div>
              <Divider orientation="left">MyBatis配置</Divider>
              <Button
                type="primary"
                icon={<FileOutlined />}
                onClick={selectMybatisFile}
                style={{ marginBottom: 16 }}
              >
                选择MyBatis配置文件导入SQL配置
              </Button>

              <Card
                title="字段列表"
                size="small"
                className="fields-card"
              >
                {fields.length > 0 ? (
                  <div style={{ marginTop: 16 }}>
                    <Title level={5}>已导入字段</Title>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {fields.map((field, index) => (
                        <Tag key={index}>
                          {typeof field === 'object' ? `${field.name} (${field.type})` : field}
                        </Tag>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Text type="secondary">暂无字段，请选择MyBatis文件</Text>
                )}
              </Card>
            </div>
          )}
        </Space>
      </Modal>
    </div>
  );
}

export default ConfigPage;
