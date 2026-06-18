/**
 * Admin AccessToken 存储工具
 *
 * 与 CoWatch 主站共用相同的双存储策略（内存 + localStorage）。
 * RefreshToken 由后端写入 HttpOnly Cookie，前端不可读。
 */

const ACCESS_TOKEN_KEY = 'daibao_admin_access_token';

let memoryToken: string | null = null;

export function setAccessToken(token: string): void {
  memoryToken = token;
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function getAccessToken(): string | null {
  if (memoryToken) return memoryToken;
  const local = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (local) memoryToken = local;
  return local;
}

export function clearAccessToken(): void {
  memoryToken = null;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function hasAccessToken(): boolean {
  return !!getAccessToken();
}
