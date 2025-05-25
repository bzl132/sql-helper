import { useState, useEffect } from "react";
import { Modal, Input, Radio, Alert, Space, Button, message } from 'antd';
import { readTextFile } from "@tauri-apps/plugin-fs";
import { open } from '@tauri-apps/plugin-dialog';

function AddConfigModal({ 
  isVisible, 
  onCancel, 
  onSave, 
  config 
}) {
  const [configName, setConfigName] = useState("");
  const [configType, setConfigType] = useState("MongoDB");
  const [fields, setFields] = useState([]);

  // 使用 useEffect 监听 isVisible 变化，当弹窗打开时重置表单
  useEffect(() => {
    if (isVisible) {
      setConfigName("");
      setConfigType("MongoDB");
      setFields([]);
    }
  }, [isVisible]);

  // 选择Java文件
  const selectJavaFile = async () => {
    // ... existing code ...
  };

  // ... existing code ...

  // 保存配置
  const handleSave = () => {
    // ... existing code ...
  };

  // 删除这个函数，改为直接在 useEffect 中设置状态
  // const resetForm = () => {
  //   setConfigName("");
  //   setConfigType("MongoDB");
  //   setFields([]);
  // };

  // 删除这段代码，因为已经在 useEffect 中处理了
  // if (isVisible) {
  //   resetForm();
  // }

  return (
    <Modal
      title="新增配置"
      open={isVisible}
      onOk={handleSave}
      onCancel={onCancel}
      okText="保存"
      cancelText="取消"
    >
      // ... existing code ...
    </Modal>
  );
}

export default AddConfigModal;