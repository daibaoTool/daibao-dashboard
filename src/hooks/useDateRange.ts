import { useState, useMemo } from 'react';

export type DateRangeOption = '7d' | '14d' | '30d';

const RANGE_MAP: Record<DateRangeOption, number> = {
  '7d': 7,
  '14d': 14,
  '30d': 30,
};

export function useDateRange(defaultRange: DateRangeOption = '7d') {
  const [range, setRange] = useState<DateRangeOption>(defaultRange);

  // useMemo 保证 range 不变时 startTime/endTime 引用稳定，
  // 避免每次渲染产生新值导致 useRequest 的 refreshDeps 无限触发
  const { startTime, endTime } = useMemo(() => {
    const end = Date.now();
    return { endTime: end, startTime: end - RANGE_MAP[range] * 24 * 60 * 60 * 1000 };
  }, [range]);

  return { range, setRange, startTime, endTime };
}
