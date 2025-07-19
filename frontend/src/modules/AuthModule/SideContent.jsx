import { Space, Layout, Divider, Typography } from 'antd';
import logo from '@/logo-icon.svg';
import useLanguage from '@/locale/useLanguage';
import { useSelector } from 'react-redux';
import { selectLangDirection } from '@/redux/translate/selectors';

const { Content } = Layout;
const { Title, Text } = Typography;

export default function SideContent() {
  const translate = useLanguage();
  const langDirection = useSelector(selectLangDirection);

  return (
    <Content
      style={{
        padding: '0 30px 0',
        width: '100%',
        maxWidth: '400px',
        margin: '0 auto',
        fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
      }}
      className="sideContent"
    >
      <div style={{ width: '100%' }}>
        <img
          src={logo}
          alt="CRM ERP Logo"
          style={{ margin: '0 auto', display: 'block', borderRadius: 16, boxShadow: '0 2px 12px rgba(37,99,235,0.08)' }}
          height={120}
          width={120}
        />
        <div className="space40"></div>
        <Title level={3} style={{ color: '#2563eb', textAlign: 'center', fontWeight: 800, letterSpacing: 1 }}>
          CRM ERP
        </Title>
        <Text style={{ display: 'block', textAlign: 'center', color: '#555', marginBottom: 16 }}>
          {translate('Manage your company with')}<br />
          <span style={{ color: '#f59e42', fontWeight: 600 }}>Modern CRM ERP Platform</span>
        </Text>
        <ul className="list-checked" style={{ paddingRight: 0, marginTop: 24 }}>
          <li className={`list-checked-item ${langDirection === "rtl" ? "list-checked-item-right" : "list-checked-item-left"}`} style={{ marginBottom: 18 }}>
            <Space direction="vertical">
              <Text strong style={{ color: '#2563eb' }}>{translate('All-in-one tool')}</Text>
              <Text>{translate('Run and scale your CRM ERP Apps')}</Text>
            </Space>
          </li>
          <li className={`list-checked-item ${langDirection === "rtl" ? "list-checked-item-right" : "list-checked-item-left"}`} style={{ marginBottom: 18 }}>
            <Space direction="vertical">
              <Text strong style={{ color: '#2563eb' }}>{translate('Easily add and manage your services')}</Text>
              <Text>{translate('It brings together your invoice clients and leads')}</Text>
            </Space>
          </li>
        </ul>
        <Divider />
      </div>
    </Content>
  );
}
