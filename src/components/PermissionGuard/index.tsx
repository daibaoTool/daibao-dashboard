import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdmin } from '@/context/AdminContext';
import LoadingSpinner from '@/components/LoadingSpinner';

interface PermissionGuardProps {
  children: ReactNode;
  /** 额外要求的权限，未传则只校验登录态 */
  require?: string;
  /** 无权限时的重定向目标，默认 '/login' */
  redirectTo?: string;
}

/**
 * 路由权限守卫
 *
 * - 未登录 → 重定向 /login
 * - 有 require 且无权限 → 重定向 redirectTo（默认 /cowatch/business/users）
 */
export default function PermissionGuard({
  children,
  require,
  redirectTo,
}: PermissionGuardProps) {
  const { adminInfo, isAuthLoading, hasPermission } = useAdmin();
  const location = useLocation();

  if (isAuthLoading) return <LoadingSpinner />;

  if (!adminInfo) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (require && !hasPermission(require)) {
    return <Navigate to={redirectTo ?? '/cowatch/business/users'} replace />;
  }

  return <>{children}</>;
}
