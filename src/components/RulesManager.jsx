import React, { useState } from 'react';
import {
    Button,
    Space,
    Table,
    Tag,
    Modal,
    Form,
    Input,
    Tabs,
    Drawer,
    Divider,
    Card,
    message,
    Select,
    Upload
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ImportOutlined, ExportOutlined, ReloadOutlined } from '@ant-design/icons';
import { open, save } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';

const { Option } = Select;
const { TabPane } = Tabs;

function RulesManager({ rules, onSave, onClose }) {
    const [form] = Form.useForm();
    const [editingRule, setEditingRule] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [activeTab, setActiveTab] = useState('MySQL');
    const [activeTypeTab, setActiveTypeTab] = useState('String');
    console.log(rules, 'rule');
    // 数据类型列表
    const dataTypes = ['String', 'Number', 'Date', 'Boolean', 'Object', 'Array', 'Syntax'];
    
    // 初始化本地规则状态
    const [localRules, setLocalRules] = useState({
        MySQL: {
            String: rules.MySQL?.String || [],
            Number: rules.MySQL?.Number || [],
            Date: rules.MySQL?.Date || [],
            Boolean: rules.MySQL?.Boolean || [],
            Object: rules.MySQL?.Object || [],
            Array: rules.MySQL?.Array || [],
            Syntax: rules.MySQL?.Syntax || []
        },
        MongoDB: {
            String: rules.MongoDB?.String || [],
            Number: rules.MongoDB?.Number || [],
            Date: rules.MongoDB?.Date || [],
            Boolean: rules.MongoDB?.Boolean || [],
            Object: rules.MongoDB?.Object || [],
            Array: rules.MongoDB?.Array || [],
            Syntax: rules.MongoDB?.Syntax || []
        }
    });

    // 添加或编辑规则
    const showModal = (record = null) => {
        setEditingRule(record);
        setIsModalVisible(true);
        
        if (record) {
            form.setFieldsValue({
                name: record.name,
                description: record.description,
                pattern: record.pattern,
                message: record.message,
                severity: record.severity
            });
        } else {
            form.resetFields();
        }
    };

    // 处理表单提交
    const handleOk = () => {
        form.validateFields().then(values => {
            const newRule = {
                id: editingRule ? editingRule.id : Date.now().toString(),
                ...values
            };

            // 更新本地规则
            const updatedRules = { ...localRules };
            const currentTypeRules = [...updatedRules[activeTab][activeTypeTab]];
            
            if (editingRule) {
                // 编辑现有规则
                const index = currentTypeRules.findIndex(r => r.id === editingRule.id);
                if (index !== -1) {
                    currentTypeRules[index] = newRule;
                }
            } else {
                // 添加新规则
                currentTypeRules.push(newRule);
            }
            
            updatedRules[activeTab][activeTypeTab] = currentTypeRules;
            setLocalRules(updatedRules);
            
            setIsModalVisible(false);
            setEditingRule(null);
            form.resetFields();
        });
    };

    // 删除规则
    const handleDelete = (record) => {
        Modal.confirm({
            title: '确认删除',
            content: `确定要删除规则 "${record.name}" 吗？`,
            onOk: () => {
                const updatedRules = { ...localRules };
                updatedRules[activeTab][activeTypeTab] = updatedRules[activeTab][activeTypeTab].filter(
                    rule => rule.id !== record.id
                );
                setLocalRules(updatedRules);
            }
        });
    };

    // 保存所有规则
    const handleSaveAll = () => {
        onSave(localRules);
        onClose();
    };

    // 表格列定义
    const columns = [
        {
            title: '规则名称',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: '描述',
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: '模式/正则',
            dataIndex: 'pattern',
            key: 'pattern',
            render: text => <code>{text}</code>
        },
        {
            title: '错误信息',
            dataIndex: 'message',
            key: 'message',
        },
        {
            title: '严重程度',
            dataIndex: 'severity',
            key: 'severity',
            render: severity => (
                <Tag color={severity === 'error' ? 'red' : severity === 'warning' ? 'orange' : 'blue'}>
                    {severity === 'error' ? '错误' : severity === 'warning' ? '警告' : '信息'}
                </Tag>
            )
        },
        {
            title: '操作',
            key: 'action',
            render: (_, record) => (
                <Space size="small">
                    <Button 
                        icon={<EditOutlined />} 
                        size="small" 
                        onClick={() => showModal(record)}
                    />
                    <Button 
                        icon={<DeleteOutlined />} 
                        size="small" 
                        danger 
                        onClick={() => handleDelete(record)}
                    />
                </Space>
            ),
        },
    ];


     // 导出规则
     const exportRules = async () => {
         try {
             // 使用Tauri的save对话框
             const filePath = await save({
                 filters: [{
                     name: 'JSON',
                     extensions: ['json']
                 }],
                 defaultPath: 'validation_rules.json'
             });
             
             if (filePath) {
                 // 使用Tauri的writeTextFile API写入文件
                 await writeTextFile(filePath, JSON.stringify(localRules, null, 2));
                 message.success('规则导出成功');
             }
         } catch (error) {
             console.error('导出规则失败:', error);
             message.error(`导出规则失败: ${error.message}`);
         }
     };
     
     // 导入规则
     const importRules = async () => {
         try {
             // 使用Tauri的open对话框
             const selected = await open({
                 multiple: false,
                 filters: [{
                     name: 'JSON',
                     extensions: ['json']
                 }]
             });
             
             if (selected) {
                 // 使用Tauri的readTextFile API读取文件
                 const content = await readTextFile(selected);
                 try {
                     const importedRules = JSON.parse(content);
                     
                     // 验证导入的规则格式
                     if (importedRules.MySQL && importedRules.MongoDB) {
                         setLocalRules(importedRules);
                         message.success('规则导入成功');
                     } else {
                         message.error('导入的规则格式不正确');
                     }
                 } catch (error) {
                     console.error('解析导入的规则失败:', error);
                     message.error(`解析导入的规则失败: ${error.message}`);
                 }
             }
         } catch (error) {
             console.error('导入规则失败:', error);
             message.error(`导入规则失败: ${error.message}`);
         }
     };
     
     // 重置为默认规则
     const resetToDefaultRules = () => {
         Modal.confirm({
             title: '重置规则',
             content: '确定要重置所有规则为默认值吗？这将覆盖您的自定义规则。',
             onOk: () => {
                 // 加载默认规则
                 const defaultRules = {
                     MySQL: {
                         String: [
                             {
                                 id: '1',
                                 name: '字符串引号规则',
                                 description: '字符串值必须使用单引号',
                                 pattern: "^'.*'$",
                                 message: '应该使用单引号包围',
                                 severity: 'error'
                             }
                         ],
                         Number: [
                             {
                                 id: '2',
                                 name: '数字格式规则',
                                 description: '数字不应使用引号',
                                 pattern: "^[^'\"].*[^'\"]$",
                                 message: '不应使用引号包围',
                                 severity: 'error'
                             }
                         ],
                         Date: [
                             {
                                 id: '3',
                                 name: '日期格式规则',
                                 description: '日期应使用标准格式',
                                 pattern: "^'\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}'$",
                                 message: '应使用 YYYY-MM-DD HH:mm:ss 格式并用单引号包围',
                                 severity: 'error'
                             }
                         ],
                         Boolean: [
                             {
                                 id: '4',
                                 name: '布尔值规则',
                                 description: '布尔值应为 TRUE 或 FALSE',
                                 pattern: "^(TRUE|FALSE|0|1)$",
                                 message: '应为 TRUE、FALSE、0 或 1',
                                 severity: 'error'
                             }
                         ],
                         Object: [],
                         Array: [],
                         Syntax: [
                             {
                                 id: '5',
                                 name: 'SELECT * 规则',
                                 description: '避免使用 SELECT *',
                                 pattern: "^(?!.*SELECT\\s+\\*(?!\\s+FROM\\s+COUNT\\(\\*\\))).*$",
                                 message: '应避免使用 SELECT *，请明确指定需要的列',
                                 severity: 'warning'
                             },
                             {
                                 id: '6',
                                 name: 'UPDATE WHERE规则',
                                 description: 'UPDATE语句必须包含WHERE子句',
                                 pattern: "^(?!UPDATE\\s+\\w+\\s+SET\\s+.*(?!\\s+WHERE\\s+)).*$",
                                 message: 'UPDATE语句必须包含WHERE子句',
                                 severity: 'error'
                             },
                             {
                                 id: '7',
                                 name: 'DELETE WHERE规则',
                                 description: 'DELETE语句必须包含WHERE子句',
                                 pattern: "^(?!DELETE\\s+FROM\\s+\\w+(?!\\s+WHERE\\s+)).*$",
                                 message: 'DELETE语句必须包含WHERE子句',
                                 severity: 'error'
                             },
                             {
                                 id: '8',
                                 name: '显式JOIN规则',
                                 description: '应使用显式JOIN语法',
                                 pattern: "^(?!.*FROM\\s+\\w+\\s*,\\s*\\w+).*$",
                                 message: '应使用显式的JOIN语法代替隐式连接',
                                 severity: 'warning'
                             }
                         ]
                     },
                     MongoDB: {
                         String: [
                             {
                                 id: '9',
                                 name: '字符串引号规则',
                                 description: '字符串值必须使用单引号或双引号',
                                 pattern: '^([\'"])(.*?)\\1$',
                                 message: '应该使用单引号或双引号包围',
                                 severity: 'error'
                             }
                         ],
                         Number: [
                             {
                                 id: '10',
                                 name: '数字格式规则',
                                 description: '数字不应使用引号',
                                 pattern: "^[^'\"].*[^'\"]$",
                                 message: '不应使用引号包围',
                                 severity: 'error'
                             }
                         ],
                         Date: [
                             {
                                 id: '11',
                                 name: '日期格式规则',
                                 description: '日期应使用ISODate函数',
                                 pattern: "^ISODate\\(.*\\)$",
                                 message: '应使用ISODate()函数',
                                 severity: 'error'
                             },
                             {
                                 id: '12',
                                 name: '日期字符串格式',
                                 description: 'ISODate参数应使用标准格式',
                                 pattern: '^ISODate\\("\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d{3})?Z"\\)$',
                                 message: '应使用ISO标准日期格式，如"YYYY-MM-DDTHH:MM:SS.MMMZ"',
                                 severity: 'warning'
                             }
                         ],
                         Boolean: [
                             {
                                 id: '13',
                                 name: '布尔值规则',
                                 description: '布尔值应为 true 或 false',
                                 pattern: "^(true|false)$",
                                 message: '应为 true 或 false',
                                 severity: 'error'
                             }
                         ],
                         Syntax: [
                             {
                                 id: '14',
                                 name: '$where操作符规则',
                                 description: '避免使用$where操作符',
                                 pattern: "^(?!.*\\$where).*$",
                                 message: '不推荐使用$where操作符，请使用$expr代替',
                                 severity: 'warning'
                             },
                             {
                                 id: '15',
                                 name: 'remove方法规则',
                                 description: '避免使用已废弃的remove方法',
                                 pattern: "^(?!.*\\.remove\\().*$",
                                 message: 'remove()方法已废弃，请使用deleteOne()或deleteMany()',
                                 severity: 'error'
                             },
                             {
                                 id: '16',
                                 name: 'update方法规则',
                                 description: '避免使用已废弃的update方法',
                                 pattern: "^(?!.*\\.update\\().*$",
                                 message: 'update()方法已废弃，请使用updateOne()或updateMany()',
                                 severity: 'error'
                             },
                             {
                                 id: '17',
                                 name: '索引使用规则',
                                 description: '查询应使用索引',
                                 pattern: "^(?!.*\\.find\\(\\{\\s*\\$text).*$",
                                 message: '文本搜索应使用文本索引',
                                 severity: 'warning'
                             }
                         ],
                         Object: [],
                         Array: []
                     }
                 };
                 
                 setLocalRules(defaultRules);
                 message.success('已重置为默认规则');
             }
         });
     };

    return (
        <Drawer
            title="规则管理"
            width={800}
            onClose={onClose}
            visible={true}
            extra={
                <Space>
                    <Button icon={<ImportOutlined />} onClick={importRules}>导入规则</Button>
                    <Button icon={<ExportOutlined />} onClick={exportRules}>导出规则</Button>
                    <Button icon={<ReloadOutlined />} onClick={resetToDefaultRules}>重置为默认规则</Button>
                    <Button onClick={onClose}>取消</Button>
                    <Button type="primary" onClick={handleSaveAll}>
                        保存所有规则
                    </Button>
                </Space>
            }
        >
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
                <TabPane tab="MySQL" key="MySQL">
                    <Tabs activeKey={activeTypeTab} onChange={setActiveTypeTab} tabPosition="left">
                        {dataTypes.map(type => (
                            <TabPane tab={type} key={type}>
                                <Card 
                                    title={`${type} 类型规则`}
                                    extra={
                                        <Button 
                                            type="primary" 
                                            icon={<PlusOutlined />}
                                            onClick={() => showModal()}
                                        >
                                            添加规则
                                        </Button>
                                    }
                                >
                                    <Table 
                                        columns={columns} 
                                        dataSource={localRules.MySQL[type]} 
                                        rowKey="id"
                                        pagination={false}
                                    />
                                </Card>
                            </TabPane>
                        ))}
                    </Tabs>
                </TabPane>
                <TabPane tab="MongoDB" key="MongoDB">
                    <Tabs activeKey={activeTypeTab} onChange={setActiveTypeTab} tabPosition="left">
                        {dataTypes.map(type => (
                            <TabPane tab={type} key={type}>
                                <Card 
                                    title={`${type} 类型规则`}
                                    extra={
                                        <Button 
                                            type="primary" 
                                            icon={<PlusOutlined />}
                                            onClick={() => showModal()}
                                        >
                                            添加规则
                                        </Button>
                                    }
                                >
                                    <Table 
                                        columns={columns} 
                                        dataSource={localRules.MongoDB[type]} 
                                        rowKey="id"
                                        pagination={false}
                                    />
                                </Card>
                            </TabPane>
                        ))}
                    </Tabs>
                </TabPane>
            </Tabs>

            <Modal
                title={editingRule ? "编辑规则" : "添加规则"}
                visible={isModalVisible}
                onOk={handleOk}
                onCancel={() => {
                    setIsModalVisible(false);
                    setEditingRule(null);
                }}
            >
                <Form
                    form={form}
                    layout="vertical"
                >
                    <Form.Item
                        name="name"
                        label="规则名称"
                        rules={[{ required: true, message: '请输入规则名称' }]}
                    >
                        <Input placeholder="例如: 字符串长度限制" />
                    </Form.Item>
                    
                    <Form.Item
                        name="description"
                        label="规则描述"
                    >
                        <Input.TextArea placeholder="描述规则的用途和作用" />
                    </Form.Item>
                    
                    <Form.Item
                        name="pattern"
                        label="验证模式/正则表达式"
                        rules={[{ required: true, message: '请输入验证模式' }]}
                    >
                        <Input placeholder="例如: ^[0-9]+$ 或 length <= 50" />
                    </Form.Item>
                    
                    <Form.Item
                        name="message"
                        label="错误信息"
                        rules={[{ required: true, message: '请输入错误信息' }]}
                    >
                        <Input placeholder="例如: 必须是数字" />
                    </Form.Item>
                    
                    <Form.Item
                        name="severity"
                        label="严重程度"
                        rules={[{ required: true, message: '请选择严重程度' }]}
                        initialValue="error"
                    >
                        <Select>
                            <Option value="error">错误</Option>
                            <Option value="warning">警告</Option>
                            <Option value="info">信息</Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </Drawer>
    );
}

export default RulesManager;