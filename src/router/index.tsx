import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PermissionGuard from '@/components/PermissionGuard';
import LoadingSpinner from '@/components/LoadingSpinner';
import AppLayout from '@/components/AppLayout';

const LoginPage = lazy(() => import('@/pages/Login'));
const PerfPage = lazy(() => import('@/pages/cowatch/Monitor/Perf'));
const ErrorsPage = lazy(() => import('@/pages/cowatch/Monitor/Errors'));
const UsersBusinessPage = lazy(() => import('@/pages/cowatch/Business/Users'));
const RoomsPage = lazy(() => import('@/pages/cowatch/Business/Rooms'));
const TrafficPage = lazy(() => import('@/pages/cowatch/Business/Traffic'));
const AdminUsersPage = lazy(() => import('@/pages/cowatch/Admin/Users'));
const InviteCodesPage = lazy(() => import('@/pages/cowatch/Admin/InviteCodes'));

const Lazy = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
);

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 公开路由 */}
        <Route path="/login" element={<Lazy><LoginPage /></Lazy>} />

        {/* 受保护路由：所有页面均需登录 */}
        <Route
          path="/:appKey"
          element={
            <PermissionGuard>
              <AppLayout />
            </PermissionGuard>
          }
        >
          {/* Monitor */}
          <Route path="monitor/perf" element={<Lazy><PerfPage /></Lazy>} />
          <Route path="monitor/errors" element={<Lazy><ErrorsPage /></Lazy>} />

          {/* Business */}
          <Route path="business/users" element={<Lazy><UsersBusinessPage /></Lazy>} />
          <Route path="business/rooms" element={<Lazy><RoomsPage /></Lazy>} />
          <Route path="business/traffic" element={<Lazy><TrafficPage /></Lazy>} />

          {/* Admin（额外权限校验） */}
          <Route
            path="admin/users"
            element={
              <PermissionGuard require="admin:cowatch">
                <Lazy><AdminUsersPage /></Lazy>
              </PermissionGuard>
            }
          />
          <Route
            path="admin/invite-codes"
            element={
              <PermissionGuard require="admin:cowatch">
                <Lazy><InviteCodesPage /></Lazy>
              </PermissionGuard>
            }
          />

          {/* 默认跳转 */}
          <Route index element={<Navigate to="business/users" replace />} />
        </Route>

        {/* 根路径 */}
        <Route path="/" element={<Navigate to="/cowatch/business/users" replace />} />
        <Route path="*" element={<Navigate to="/cowatch/business/users" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
