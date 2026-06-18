import { useEffect } from 'react';
import { Outlet, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Layout, Menu, Tabs, Button, Avatar, Dropdown, type MenuProps } from 'antd';
import {
  BarChartOutlined,
  ShopOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useAdmin } from '@/context/AdminContext';
import styles from './index.module.scss';

const { Sider, Header, Content } = Layout;

// ─── 产品列表（未来可扩展） ─────────────────────────────────────────────────────
const APP_ITEMS: MenuProps['items'] = [
  { key: 'cowatch', label: 'CoWatch', icon: <ShopOutlined /> },
];

// ─── Tab 配置 ──────────────────────────────────────────────────────────────────
const TAB_ITEMS = [
  { key: 'monitor', label: '监控' },
  { key: 'business', label: '业务' },
  { key: 'admin', label: '运营' },
];

// 每个 tab 的默认子路径
const TAB_DEFAULT: Record<string, string> = {
  monitor: 'perf',
  business: 'users',
  admin: 'users',
};

export default function AppLayout() {
  const { appKey = 'cowatch' } = useParams<{ appKey: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { adminInfo, logout, setAppKey } = useAdmin();

  useEffect(() => {
    setAppKey(appKey);
  }, [appKey, setAppKey]);

  // 当前激活的 tab（从路径解析）
  const segments = location.pathname.split('/');
  const activeTab = segments[2] ?? 'business';

  const handleTabChange = (tabKey: string) => {
    navigate(`/${appKey}/${tabKey}/${TAB_DEFAULT[tabKey] ?? ''}`);
  };

  const handleAppSelect: MenuProps['onClick'] = ({ key }) => {
    navigate(`/${key}/business/users`);
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
      onClick: async () => {
        await logout();
        navigate('/login');
      },
    },
  ];

  return (
    <Layout className={styles.layout}>
      {/* 左侧产品列表 */}
      <Sider className={styles.sider} width={200} theme="dark">
        <div className={styles.logo}>大盘</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[appKey]}
          items={APP_ITEMS}
          onClick={handleAppSelect}
        />
      </Sider>

      <Layout>
        {/* 顶部 Header */}
        <Header className={styles.header}>
          <Tabs
            className={styles.tabs}
            activeKey={activeTab}
            items={TAB_ITEMS}
            onChange={handleTabChange}
            tabBarStyle={{ marginBottom: 0, borderBottom: 'none' }}
          />
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Button type="text" className={styles.userBtn}>
              <Avatar size="small" icon={<UserOutlined />} />
              <span className={styles.username}>{adminInfo?.username}</span>
            </Button>
          </Dropdown>
        </Header>

        {/* 内容区 */}
        <Content className={styles.content}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
