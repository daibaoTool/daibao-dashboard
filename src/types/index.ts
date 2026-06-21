// ─── 通用 API 响应 ─────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

// ─── Admin 账号 ────────────────────────────────────────────────────────────────
export interface AdminInfo {
  adminId: string;
  username: string;
  permissions: string[];
}

// ─── CoWatch 用户 ──────────────────────────────────────────────────────────────
export interface CoWatchUser {
  userId: string;
  username: string;
  nickname: string;
  avatarUrl: string | null;
  isBanned: boolean;
  plans: string[];
  createdAt: number;
}

// ─── CoWatch 房间 ──────────────────────────────────────────────────────────────
export interface CoWatchRoom {
  id: string;
  name: string;
  video_url: string | null;
  created_at: number;
  updated_at: number;
  member_count: number;
  /** 当月 HLS 流量（字节），来自 segment_views 表 */
  traffic_month: number;
  /** 近 7 天 HLS 流量（字节） */
  traffic_7d: number;
  /** 今日 HLS 流量（字节） */
  traffic_today: number;
}

// ─── Monitor：性能数据 ─────────────────────────────────────────────────────────
export interface PerfMetric {
  time: string;
  avg_lcp: number;
  avg_fid: number;
  avg_cls: number;
  count: number;
}

// ─── Monitor：错误数据 ─────────────────────────────────────────────────────────
export interface ErrorEvent {
  id: string;
  type: string;
  message: string;
  stack: string | null;
  url: string;
  occurred_at: number;
  count: number;
}

// ─── Business：流量数据 ────────────────────────────────────────────────────────
export interface TrafficStat {
  date: string;
  pv: number;
  uv: number;
}

// ─── 分页参数 ──────────────────────────────────────────────────────────────────
export interface PageParams {
  page: number;
  pageSize: number;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
