import { useMemo } from 'react';
import { Row, Col, Segmented, Card, Spin } from 'antd';
import { useRequest } from 'ahooks';
import { useAdmin } from '@/context/AdminContext';
import { getMonitorEventsApi, aggregatePerfMetrics } from '@/api/monitor';
import { useDateRange, type DateRangeOption } from '@/hooks/useDateRange';
import EChartsWrapper from '@/components/EChartsWrapper';
import StatCard from '@/components/StatCard';
import type { EChartsOption } from 'echarts';
import styles from './index.module.scss';

const RANGE_OPTIONS = [
  { label: '7天', value: '7d' },
  { label: '14天', value: '14d' },
  { label: '30天', value: '30d' },
];

export default function PerfPage() {
  const { appKey } = useAdmin();
  const { range, setRange, startTime, endTime } = useDateRange();

  const { data: events = [], loading } = useRequest(
    () => getMonitorEventsApi({ appKey, type: 'perf', limit: 5000 }),
    { refreshDeps: [appKey, startTime, endTime], retryCount: 0 },
  );

  const metrics = useMemo(() => aggregatePerfMetrics(events), [events]);

  const dates = metrics.map((m) => m.time);
  const lcpData = metrics.map((m) => +(m.avg_lcp / 1000).toFixed(2));
  const fidData = metrics.map((m) => +(m.avg_fid).toFixed(1));
  const clsData = metrics.map((m) => +(m.avg_cls).toFixed(3));

  const latestMetric = metrics[metrics.length - 1];
  const totalCount = metrics.reduce((s, m) => s + m.count, 0);

  const lcpOption: EChartsOption = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: dates },
    yAxis: { type: 'value', name: 'LCP (s)' },
    series: [{ name: 'LCP', type: 'line', data: lcpData, smooth: true }],
  };

  const fidClsOption: EChartsOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['FID (ms)', 'CLS'] },
    xAxis: { type: 'category', data: dates },
    yAxis: [
      { type: 'value', name: 'FID (ms)' },
      { type: 'value', name: 'CLS', position: 'right' },
    ],
    series: [
      { name: 'FID (ms)', type: 'line', data: fidData, smooth: true },
      { name: 'CLS', type: 'line', yAxisIndex: 1, data: clsData, smooth: true },
    ],
  };

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <h2 className={styles.title}>性能指标</h2>
        <Segmented
          options={RANGE_OPTIONS}
          value={range}
          onChange={(v) => setRange(v as DateRangeOption)}
        />
      </div>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]} className={styles.stats}>
          <Col span={8}>
            <StatCard title="采集总次数" value={totalCount} />
          </Col>
          <Col span={8}>
            <StatCard
              title="近期 avg LCP"
              value={latestMetric ? +(latestMetric.avg_lcp / 1000).toFixed(2) : '-'}
              suffix="s"
            />
          </Col>
          <Col span={8}>
            <StatCard
              title="近期 avg FID"
              value={latestMetric ? +latestMetric.avg_fid.toFixed(1) : '-'}
              suffix="ms"
            />
          </Col>
        </Row>

        <Card title="LCP 趋势" className={styles.chartCard}>
          <EChartsWrapper option={lcpOption} height={260} />
        </Card>

        <Card title="FID / CLS 趋势" className={styles.chartCard}>
          <EChartsWrapper option={fidClsOption} height={260} />
        </Card>
      </Spin>
    </div>
  );
}
