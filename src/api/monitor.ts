import { monitorRequest } from '@/utils/request';
import type { ApiResponse, PerfMetric, ErrorEvent } from '@/types';

export interface MonitorStatsResponse {
  perf: Array<{ name: string; count: number; avg_value: number }>;
  counts: Array<{ type: string; name: string; count: number }>;
}

export interface MonitorEvent {
  id: string;
  app_key: string;
  type: string;
  name: string;
  value: number | null;
  extra: string | null;
  url: string;
  occurred_at: number;
}

/**
 * 获取聚合性能 / 错误统计
 * GET /api/stats?appKey=cowatch&startTime=xxx&endTime=xxx
 */
export async function getMonitorStatsApi(params: {
  appKey: string;
  startTime: number;
  endTime: number;
}): Promise<MonitorStatsResponse> {
  const res = await monitorRequest.get<ApiResponse<MonitorStatsResponse>>('/stats', { params });
  return res.data.data;
}

/**
 * 获取原始事件列表（错误列表 / 性能详情）
 * GET /api/stats/events?appKey=cowatch&type=error&limit=50&offset=0
 */
export async function getMonitorEventsApi(params: {
  appKey: string;
  type?: string;
  limit?: number;
  offset?: number;
}): Promise<MonitorEvent[]> {
  const res = await monitorRequest.get<ApiResponse<{ events: MonitorEvent[] }>>('/stats/events', {
    params: { ...params, limit: params.limit ?? 50, offset: params.offset ?? 0 },
  });
  return res.data.data.events;
}

// ─── 本地聚合工具：把原始 perf events 处理为按时间分桶的 PerfMetric[] ───────────
export function aggregatePerfMetrics(
  events: MonitorEvent[],
  bucketKey: 'hour' | 'day' = 'day',
): PerfMetric[] {
  const buckets: Record<string, { lcp: number[]; fid: number[]; cls: number[]; count: number }> = {};

  for (const e of events) {
    if (e.type !== 'perf') continue;
    const date = new Date(e.occurred_at);
    const key =
      bucketKey === 'hour'
        ? `${date.toISOString().slice(0, 13)}:00`
        : date.toISOString().slice(0, 10);

    if (!buckets[key]) buckets[key] = { lcp: [], fid: [], cls: [], count: 0 };
    buckets[key].count++;

    if (e.name === 'LCP') buckets[key].lcp.push(e.value ?? 0);
    if (e.name === 'FID') buckets[key].fid.push(e.value ?? 0);
    if (e.name === 'CLS') buckets[key].cls.push(e.value ?? 0);
  }

  const avg = (arr: number[]) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0);

  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([time, { lcp, fid, cls, count }]) => ({
      time,
      avg_lcp: avg(lcp),
      avg_fid: avg(fid),
      avg_cls: avg(cls),
      count,
    }));
}

// ─── 本地聚合工具：错误事件 → ErrorEvent[] ─────────────────────────────────────
export function aggregateErrorEvents(events: MonitorEvent[]): ErrorEvent[] {
  const map: Record<string, ErrorEvent> = {};

  for (const e of events) {
    if (e.type !== 'error') continue;
    const key = `${e.name}::${e.url}`;
    if (!map[key]) {
      map[key] = {
        id: e.id,
        type: e.type,
        message: e.name,
        stack: e.extra,
        url: e.url,
        occurred_at: e.occurred_at,
        count: 0,
      };
    }
    map[key].count++;
    // 保留最新发生时间
    if (e.occurred_at > map[key].occurred_at) {
      map[key].occurred_at = e.occurred_at;
    }
  }

  return Object.values(map).sort((a, b) => b.count - a.count);
}
