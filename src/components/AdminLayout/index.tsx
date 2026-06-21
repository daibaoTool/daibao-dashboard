import { Outlet, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Tabs } from 'antd';
import styles from './index.module.scss';

const TAB_ITEMS = [
  { key: 'users', label: '用户管理' },
  { key: 'rooms', label: '房间管理' },
];

/**
 * 运营模块二级 Tab 布局
 *
 * 路由结构：/:appKey/admin/users  /:appKey/admin/rooms
 * 此组件作为父 Route 的 element，内部通过 <Outlet /> 渲染子页面。
 */
export default function AdminLayout() {
  const { appKey = 'cowatch' } = useParams<{ appKey: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // 从路径末段解析当前激活的 tab（users / rooms）
  const segments = location.pathname.split('/');
  const activeTab = segments[segments.length - 1] ?? 'users';

  const handleTabChange = (key: string) => {
    navigate(`/${appKey}/admin/${key}`);
  };

  return (
    <div className={styles.container}>
      <Tabs
        className={styles.tabs}
        activeKey={activeTab}
        items={TAB_ITEMS}
        onChange={handleTabChange}
        tabBarStyle={{ marginBottom: 0 }}
      />
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
}
