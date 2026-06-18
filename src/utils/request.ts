import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
} from 'axios';
import { getAccessToken, setAccessToken, clearAccessToken, hasAccessToken } from './token';

export class ApiError extends Error {
  response: AxiosResponse;
  constructor(message: string, response: AxiosResponse) {
    super(message);
    this.name = 'ApiError';
    this.response = response;
  }
}

// ─── Admin 请求实例（代理到 CoWatch-backend /api/admin）────────────────────────
export const adminRequest: AxiosInstance = axios.create({
  baseURL: '/api/admin',
  timeout: 30000,
  withCredentials: true,
});

// ─── monitor-backend 请求实例（代理到 /monitor-api → monitor-backend /api）──────
// timeout 设为 8s：本地未启动 monitor-backend 时快速失败，避免长时间等待堆积请求
export const monitorRequest: AxiosInstance = axios.create({
  baseURL: '/monitor-api',
  timeout: 8000,
});

// ─── 无感刷新全局状态 ──────────────────────────────────────────────────────────
let isRefreshing = false;
let pendingQueue: Array<{ resolve: (token: string) => void; reject: (err: AxiosError) => void }> = [];

async function refreshAdminToken(): Promise<string> {
  const res = await axios.post(
    '/api/admin/auth/refresh',
    {},
    { withCredentials: true, timeout: 5000 },
  );
  if (res.data.code !== 200) throw new Error('刷新 Token 失败');
  return res.data.data.accessToken as string;
}

// ─── adminRequest 拦截器 ───────────────────────────────────────────────────────
adminRequest.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

adminRequest.interceptors.response.use(
  (response: AxiosResponse) => {
    const { data } = response;
    if (typeof data !== 'object' || data === null || !('code' in data)) return response;
    if (data.code !== 200) {
      return Promise.reject(new ApiError(data.message || '请求失败', response));
    }
    return response;
  },
  async (error: AxiosError): Promise<never> => {
    if (!error.response) return Promise.reject(error);
    const { response, config } = error;

    if (response?.status === 401 && config) {
      if (!hasAccessToken()) {
        clearAccessToken();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const newToken = await refreshAdminToken();
          setAccessToken(newToken);
          pendingQueue.forEach(({ resolve }) => resolve(newToken));
          pendingQueue = [];
          isRefreshing = false;
          config.headers = config.headers ?? {};
          config.headers.Authorization = `Bearer ${newToken}`;
          return adminRequest(config) as never;
        } catch (refreshErr) {
          clearAccessToken();
          pendingQueue.forEach(({ reject }) => reject(refreshErr as AxiosError));
          pendingQueue = [];
          isRefreshing = false;
          window.location.href = '/login';
          return Promise.reject(refreshErr);
        }
      }

      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            config.headers = config.headers ?? {};
            config.headers.Authorization = `Bearer ${token}`;
            resolve(adminRequest(config) as never);
          },
          reject,
        });
      }) as never;
    }

    if (response && typeof response.data === 'object' && response.data !== null && 'message' in response.data) {
      const msg = (response.data as { message?: string }).message;
      if (msg) return Promise.reject(new ApiError(msg, response));
    }

    return Promise.reject(error);
  },
);

// ─── monitorRequest 拦截器（只做业务 code 校验，无 token）─────────────────────
monitorRequest.interceptors.response.use(
  (response: AxiosResponse) => {
    const { data } = response;
    if (typeof data !== 'object' || data === null || !('code' in data)) return response;
    if (data.code !== 200) {
      return Promise.reject(new ApiError(data.message || '请求失败', response));
    }
    return response;
  },
  (error: AxiosError) => Promise.reject(error),
);
