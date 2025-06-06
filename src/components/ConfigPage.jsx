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
  Alert,
  Table
} from 'antd';
import { FileOutlined, DownloadOutlined, UploadOutlined, PlusOutlined } from '@ant-design/icons';
import { readTextFile, writeTextFile, mkdir, exists, create } from "@tauri-apps/plugin-fs";
import { dirname, appDataDir } from '@tauri-apps/api/path';
import { open } from '@tauri-apps/plugin-dialog';
import AddConfigModal from './AddConfigModal';

const { Title, Text } = Typography;

function ConfigPage() {
  const [fields, setFields] = useState([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [config, setConfig] = useState({});

  // 新增配置弹窗相关状态
  const [isModalVisible, setIsModalVisible] = useState(false);

  // 配置文件路径 - 不要使用硬编码的路径
  const [configFilePath, setConfigFilePath] = useState("");
  const [configFileDir, setConfigFileDir] = useState("");

  // 添加属性列表弹窗状态
  const [isFieldsModalVisible, setIsFieldsModalVisible] = useState(false);
  const [currentFields, setCurrentFields] = useState([]);
  // 添加编辑模式状态
  const [editMode, setEditMode] = useState(false);
  // 添加当前编辑的表名
  const [editingTable, setEditingTable] = useState("");

  // 添加一个状态来跟踪是否已经显示过配置文件不存在的提示
  const [configWarningShown, setConfigWarningShown] = useState(false);

   // 添加一个状态来存储编辑时的新表名
   const [newTableName, setNewTableName] = useState("");

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
  };

  // 关闭新增配置弹窗
  const handleCancel = () => {
    setIsModalVisible(false);
  };

  // 保存新配置到本地存储
  const saveNewConfig = (configName, configType, configFields) => {
    // 更新内存中的配置
    const newConfig = {
      ...config,
      [configName]: {
        type: configType,
        fields: configFields
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
      setEditMode(false); // 设置为非编辑模式
    } else {
      message.warning(`表 ${tableName} 没有定义字段`);
    }
  };

  // 编辑表的属性
  const editTableFields = (tableName) => {
    if (config[tableName] && config[tableName].fields) {
      // 将字段转换为统一格式
      const fields = config[tableName].fields.map(field => {
        if (typeof field === 'string') {
          return { name: field, type: '' };
        }
        return field;
      });
      
      setCurrentFields(fields);
      setEditingTable(tableName);
      setNewTableName(tableName); // 初始化新表名为当前表名
      setIsFieldsModalVisible(true);
      setEditMode(true); // 设置为编辑模式
    } else {
      message.warning(`表 ${tableName} 没有定义字段`);
    }
  };

  // 删除配置
  const deleteConfig = (tableName) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除配置 "${tableName}" 吗？此操作不可恢复。`,
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        // 创建新的配置对象，排除要删除的配置
        const newConfig = { ...config };
        delete newConfig[tableName];
        
        // 更新状态和本地存储
        setConfig(newConfig);
        localStorage.setItem('dbConfig', JSON.stringify(newConfig));
        
        message.success(`配置 "${tableName}" 已删除`);
      }
    });
  };

  // 添加字段
  const addField = () => {
    setCurrentFields([...currentFields, { name: '', type: '' }]);
  };

  // 更新字段
  const updateField = (index, key, value) => {
    const newFields = [...currentFields];
    newFields[index] = { ...newFields[index], [key]: value };
    setCurrentFields(newFields);
  };

  // 删除字段
  const removeField = (index) => {
    const newFields = [...currentFields];
    newFields.splice(index, 1);
    setCurrentFields(newFields);
  };

  // 添加一个函数来处理配置编辑后的更新
  const updateConfigInLocalStorage = (tableName, updatedFields) => {
    // 获取当前配置
    const currentConfig = { ...config };
    
    // 更新指定表的字段
    if (currentConfig[tableName]) {
      currentConfig[tableName].fields = updatedFields;
      
      // 更新状态
      setConfig(currentConfig);
      
      // 保存到 localStorage
      localStorage.setItem('dbConfig', JSON.stringify(currentConfig));
      
      message.success(`配置 ${tableName} 已更新`);
    } else {
      message.error(`找不到配置 ${tableName}`);
    }
  };

  // 保存编辑后的字段
  const saveFields = () => {
    // 验证字段名不为空
    const invalidFields = currentFields.filter(field => !field.name);
    if (invalidFields.length > 0) {
      message.error('字段名不能为空');
      return;
    }

    // 验证新表名不为空
    if (!newTableName.trim()) {
      message.error('表名不能为空');
      return;
    }

    // 创建新的配置对象
    const newConfig = { ...config };
    
    // 如果表名发生了变化
    if (newTableName !== editingTable) {
      // 检查新表名是否已存在
      if (newConfig[newTableName] && newTableName !== editingTable) {
        Modal.confirm({
          title: '表名已存在',
          content: `表名 "${newTableName}" 已存在，是否覆盖？`,
          okText: '覆盖',
          cancelText: '取消',
          onOk() {
            // 删除旧表名的配置
            delete newConfig[editingTable];
            
            // 添加新表名的配置
            newConfig[newTableName] = {
              type: config[editingTable].type,
              fields: currentFields
            };
            
            // 更新状态和本地存储
            setConfig(newConfig);
            localStorage.setItem('dbConfig', JSON.stringify(newConfig));
            
            // 关闭弹窗
            setIsFieldsModalVisible(false);
            message.success(`配置已保存为 "${newTableName}"`);
            
            // 调用字段编辑完成的处理函数
            handleFieldsEditComplete(newTableName, currentFields);
          }
        });
        return;
      }
      
      // 删除旧表名的配置
      delete newConfig[editingTable];
      
      // 添加新表名的配置
      newConfig[newTableName] = {
        type: config[editingTable].type,
        fields: currentFields
      };
    } else {
      // 表名没有变化，只更新字段
      newConfig[editingTable] = {
        ...newConfig[editingTable],
        fields: currentFields
      };
    }

    // 更新状态和本地存储
    setConfig(newConfig);
    localStorage.setItem('dbConfig', JSON.stringify(newConfig));

    // 关闭弹窗
    setIsFieldsModalVisible(false);
    message.success('配置已保存');
    
    // 调用字段编辑完成的处理函数
    handleFieldsEditComplete(newTableName !== editingTable ? newTableName : editingTable, currentFields);
  };
  
  // 在表格编辑完成后调用此函数
  const handleFieldsEditComplete = (tableName, editedFields) => {
    // 更新配置
    updateConfigInLocalStorage(tableName, editedFields);
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
            type="link" 
            size="small" 
            onClick={() => viewTableFields(record.name)}
          >
            查看属性
          </Button>
          <Button 
            type="link" 
            size="small" 
            onClick={() => editTableFields(record.name)}
          >
            编辑
          </Button>
          <Button 
            type="link" 
            danger 
            size="small" 
            onClick={() => deleteConfig(record.name)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];


  // 在渲染部分，将原来的列表改为Table组件
  return (
    <div className="config-page">
      <Card title="数据库配置" style={{ width: '100%' }}>
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

        {/* 已导入的配置区域 */}
        <div className="imported-configs">
          <Title level={4}>已导入的配置</Title>
          <Table 
            columns={columns} 
            dataSource={Object.keys(config).map(key => ({
              key,
              name: key,
              type: config[key].type || 'unknown',
              fieldCount: config[key].fields ? config[key].fields.length : 0
            }))}
            size="small"
            pagination={false}
          />
        </div>
        
        {/* 属性查看弹窗 */}
        <Modal
          title={editMode ? `编辑 "${editingTable}" 的字段` : "字段属性"}
          open={isFieldsModalVisible}
          onCancel={() => setIsFieldsModalVisible(false)}
          footer={editMode ? [
            <Button key="cancel" onClick={() => setIsFieldsModalVisible(false)}>
              取消
            </Button>,
            <Button key="save" type="primary" onClick={saveFields}>
              保存
            </Button>
          ] : [
            <Button key="close" type="primary" onClick={() => setIsFieldsModalVisible(false)}>
              关闭
            </Button>
          ]}
          width={700}
        >
          {editMode ? (
            <>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={addField}
                style={{ marginBottom: 16 }}
              >
                添加字段
              </Button>
              <Table
                dataSource={currentFields.map((field, index) => ({ ...field, key: index }))}
                pagination={false}
                bordered
                size="small"
                columns={[
                  {
                    title: '字段名',
                    dataIndex: 'name',
                    key: 'name',
                    render: (text, record, index) => (
                      <Input 
                        value={text} 
                        onChange={(e) => updateField(index, 'name', e.target.value)}
                      />
                    )
                  },
                  {
                    title: '类型',
                    dataIndex: 'type',
                    key: 'type',
                    render: (text, record, index) => (
                      <Input 
                        value={text || ''} 
                        onChange={(e) => updateField(index, 'type', e.target.value)}
                        placeholder="可选"
                      />
                    )
                  },
                  {
                    title: '操作',
                    key: 'action',
                    render: (_, record, index) => (
                      <Button 
                        type="link" 
                        danger 
                        onClick={() => removeField(index)}
                      >
                        删除
                      </Button>
                    )
                  }
                ]}
              />
            </>
          ) : (
            <div className="fields-list">
              {currentFields.map((field, index) => (
                <Tag key={index} className="field-item">
                  {typeof field === 'string' ? field : `${field.name}${field.type ? ` (${field.type})` : ''}`}
                </Tag>
              ))}
            </div>
          )}
        </Modal>
      </Card>
      
      {/* 字段属性弹窗 */}
      <Modal
        title={editMode ? "编辑配置" : "字段属性"}
        open={isFieldsModalVisible}
        onCancel={() => setIsFieldsModalVisible(false)}
        footer={editMode ? [
          <Button key="cancel" onClick={() => setIsFieldsModalVisible(false)}>
            取消
          </Button>,
          <Button key="save" type="primary" onClick={saveFields}>
            保存
          </Button>
        ] : [
          <Button key="close" type="primary" onClick={() => setIsFieldsModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {editMode ? (
          <>
            {/* 添加表名编辑输入框 */}
            <div style={{ marginBottom: 16 }}>
              <Input
                addonBefore="表名"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                placeholder="请输入表名"
              />
            </div>
            
            <Table
              dataSource={currentFields.map((field, index) => ({ ...field, key: index }))}
              pagination={false}
              bordered
              size="small"
              columns={[
                {
                  title: '字段名',
                  dataIndex: 'name',
                  key: 'name',
                  render: (text, record, index) => (
                    <Input 
                      value={text} 
                      onChange={(e) => updateField(index, 'name', e.target.value)}
                    />
                  )
                },
                {
                  title: '类型',
                  dataIndex: 'type',
                  key: 'type',
                  render: (text, record, index) => (
                    <Input 
                      value={text || ''} 
                      onChange={(e) => updateField(index, 'type', e.target.value)}
                      placeholder="可选"
                    />
                  )
                },
                {
                  title: '操作',
                  key: 'action',
                  render: (_, record, index) => (
                    <Button 
                      type="link" 
                      danger 
                      onClick={() => removeField(index)}
                    >
                      删除
                    </Button>
                  )
                }
              ]}
            />
            
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={addField}
              style={{ marginTop: 16 }}
            >
              添加字段
            </Button>
          </>
        ) : (
          <div className="fields-list">
            {currentFields.map((field, index) => (
              <Tag key={index} className="field-item">
                {typeof field === 'string' ? field : `${field.name}${field.type ? ` (${field.type})` : ''}`}
              </Tag>
            ))}
          </div>
        )}
      </Modal>

      
      {/* 使用新的 AddConfigModal 组件 */}
      <AddConfigModal
        isVisible={isModalVisible}
        onCancel={handleCancel}
        onSave={saveNewConfig}
        config={config}
      />
    </div>
  );
}

export default ConfigPage;
