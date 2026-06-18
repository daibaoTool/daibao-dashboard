import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useMemoizedFn } from 'ahooks';
import { setAccessToken, clearAccessToken, getAccessToken } from '@/utils/token';
import { adminLoginApi, adminLogoutApi } from '@/api/cowatch';
import type { AdminInfo } from '@/types';

interface AdminContextValue {
  adminInfo: AdminInfo | null;
  isAuthLoading: boolean;
  /** 当前 appKey（路由驱动，由 AppLayout 同步） */
  appKey: string;
  setAppKey: (key: string) => void;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (perm: string) => boolean;
}

const AdminContext = createContext<AdminContextValue>({
  adminInfo: null,
  isAuthLoading: true,
  appKey: 'cowatch',
  setAppKey: () => {},
  login: async () => {},
  logout: async () => {},
  hasPermission: () => false,
});

export function AdminProvider({ children }: { children: ReactNode }) {
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [appKey, setAppKey] = useState('cowatch');

  // 页面刷新后：若本地有 token，尝试刷新来验证登录态
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setIsAuthLoading(false);
      return;
    }
    // 从 localStorage 恢复 adminInfo 快照
    const cached = localStorage.getItem('daibao_admin_info');
    if (cached) {
      try {
        setAdminInfo(JSON.parse(cached) as AdminInfo);
      } catch { /* ignore */ }
    }
    setIsAuthLoading(false);
  }, []);

  const login = useMemoizedFn(async (username: string, password: string) => {
    const result = await adminLoginApi(username, password);
    setAccessToken(result.accessToken);
    setAdminInfo(result.adminInfo);
    localStorage.setItem('daibao_admin_info', JSON.stringify(result.adminInfo));
  });

  const logout = useMemoizedFn(async () => {
    try { await adminLogoutApi(); } catch { /* 网络异常也要能退出 */ }
    clearAccessToken();
    localStorage.removeItem('daibao_admin_info');
    setAdminInfo(null);
  });

  const hasPermission = useMemoizedFn((perm: string): boolean => {
    const perms = adminInfo?.permissions ?? [];
    return perms.includes('admin') || perms.includes(perm);
  });

  return (
    <AdminContext.Provider
      value={{ adminInfo, isAuthLoading, appKey, setAppKey, login, logout, hasPermission }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}
