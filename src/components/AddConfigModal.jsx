import { useState, useEffect } from "react";  // 添加 useEffect 导入
import { Modal, Input, Radio, Divider, Space, Button, message, Card, Typography, Tag } from 'antd';
import { readTextFile } from "@tauri-apps/plugin-fs";
import { open } from '@tauri-apps/plugin-dialog';
import { FileOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

function AddConfigModal({ 
  isVisible, 
  onCancel, 
  onSave, 
  config 
}) {
  const [configName, setConfigName] = useState("");
  const [configType, setConfigType] = useState("MongoDB");
  const [fields, setFields] = useState([]);

  // 使用 useEffect 监听 isVisible 变化
  useEffect(() => {
    if (isVisible) {
      // 当弹窗打开时重置表单
      setConfigName("");
      setConfigType("MongoDB");
      setFields([]);
    }
  }, [isVisible]);  // 依赖项数组中只包含 isVisible

  // 选择Java文件
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
            type: determineMongoDBType(fieldType)
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
              type: determineMongoDBType(fieldType)
            });
          }
        }
      }
    } catch (error) {
      console.error('解析 Java 字段时出错:', error);
    }

    return { extractedFields, parentClass };
  };

  // 判断Java类型对应的MongoDB类型
  const determineMongoDBType = (javaType) => {
    // 基本类型和包装类
    const basicTypes = [
      'String', 'Integer', 'int', 'Long', 'long', 'Double', 'double',
      'Float', 'float', 'Boolean', 'boolean', 'Byte', 'byte', 'Short', 'short',
      'Character', 'char'
    ];
    
    // JDK标准类型到MongoDB类型的映射
    const typeMapping = {
      'String': 'String',
      'Integer': 'Integer',
      'int': 'Integer',
      'Long': 'Long',
      'long': 'Long',
      'Double': 'Double',
      'double': 'Double',
      'Float': 'Float',
      'float': 'Float',
      'Boolean': 'Boolean',
      'boolean': 'Boolean',
      'Byte': 'Integer',
      'byte': 'Integer',
      'Short': 'Integer',
      'short': 'Integer',
      'Character': 'String',
      'char': 'String',
      'BigDecimal': 'Decimal128',
      'LocalDate': 'Date',
      'LocalDateTime': 'Date',
      'Date': 'Date',
      'Calendar': 'Date',
      'List': 'Array',
      'ArrayList': 'Array',
      'LinkedList': 'Array',
      'Set': 'Array',
      'HashSet': 'Array',
      'TreeSet': 'Array',
      'Map': 'Object',
      'HashMap': 'Object',
      'TreeMap': 'Object',
      'UUID': 'String',
    };
    
    // 检查是否为JDK标准类型
    const isJdkType = (type) => {
      // 基本类型和包装类
      if (basicTypes.includes(type)) return true;
      
      // 已知的JDK类型映射
      if (typeMapping[type]) return true;
      
      // 检查是否为java.*或javax.*包中的类型
      const jdkPackagePrefixes = ['java.', 'javax.', 'sun.', 'com.sun.', 'org.w3c.', 'org.xml.'];
      return jdkPackagePrefixes.some(prefix => type.startsWith(prefix));
    };
    
    // 如果是JDK标准类型，使用映射表中的类型
    if (typeMapping[javaType]) {
      return typeMapping[javaType];
    }
    
    // 如果是JDK包中的其他类型但没有明确映射，保持原样
    if (isJdkType(javaType)) {
      return javaType;
    }
    
    // 非JDK标准类型，视为Object类型
    return 'Object';
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
      // 提示用户手动选择父类文件
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

  // 选择MyBatis文件
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
            // 直接设置到 fields 中
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

  // 保存配置
  const handleSave = () => {
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
          onSave(configName, configType, fields);
        }
      });
    } else {
      onSave(configName, configType, fields);
    }
  };

  return (
    <Modal
    title="新增配置"
    open={isVisible}
    onCancel={onCancel}
    footer={[
      <Button key="cancel" onClick={onCancel}>
        取消
      </Button>,
      <Button key="save" type="primary" onClick={handleSave}>
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
  );
}

export default AddConfigModal;