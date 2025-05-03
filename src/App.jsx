import { useState, useEffect } from "react";
import { 
  Layout, 
  Tabs, 
  Typography
} from 'antd';
import { DatabaseOutlined, CodeOutlined, CheckCircleOutlined } from '@ant-design/icons';
import ConfigPage from './components/ConfigPage';
import ScriptGenerationPage from './components/ScriptGenerationPage';
import ScriptValidationPage from './components/ScriptValidationPage';
import "./App.css";

const { Header, Content } = Layout;
const { Title } = Typography;
const { TabPane } = Tabs;

function App() {
  const [activeTab, setActiveTab] = useState("script");
  
  const handleTabChange = (key) => {
    setActiveTab(key);
    
    // 触发自定义事件，通知组件重新加载配置
    const event = new CustomEvent('tab-change', { detail: { tab: key } });
    document.dispatchEvent(event);
  };
  
  // 组件挂载时触发一次初始标签事件
  useEffect(() => {
    const event = new CustomEvent('tab-change', { detail: { tab: activeTab } });
    document.dispatchEvent(event);
  }, []);
  
  return (
    <Layout className="app-layout">
      <Header className="app-header">
        <Title level={3} style={{ color: 'white', margin: 0 }}>
          <DatabaseOutlined /> SQL 助手
        </Title>
      </Header>
      
      <Content className="app-content">
        <Tabs 
          activeKey={activeTab} 
          onChange={handleTabChange}
          type="card"
          className="main-tabs"
        >
          <TabPane 
            tab={<span><CodeOutlined />脚本生成</span>} 
            key="script"
          >
            <ScriptGenerationPage />
          </TabPane>
          <TabPane 
            tab={<span><CheckCircleOutlined />脚本校验</span>} 
            key="validation"
          >
            <ScriptValidationPage />
          </TabPane>
          <TabPane 
            tab={<span><DatabaseOutlined />配置页面</span>} 
            key="config"
          >
            <ConfigPage />
          </TabPane>
        </Tabs>
      </Content>
    </Layout>
  );
}

export default App;