import { useMemo } from 'react';
import { Row, Col, Card, Spin, Alert } from 'antd';
import { useRequest } from 'ahooks';
import { getRoomsApi } from '@/api/cowatch';
import EChartsWrapper from '@/components/EChartsWrapper';
import StatCard from '@/components/StatCard';
import type { EChartsOption } from 'echarts';
import styles from './index.module.scss';

function buildUploadTrendOption(rooms: { created_at: number }[]): EChartsOption {
  const buckets: Record<string, number> = {};
  for (const r of rooms) {
    const day = new Date(r.created_at).toISOString().slice(0, 10);
    buckets[day] = (buckets[day] ?? 0) + 1;
  }
  const days = Object.keys(buckets).sort();
  return {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: days },
    yAxis: { type: 'value', name: '新建房间数' },
    series: [{ name: '新建房间', type: 'line', data: days.map((d) => buckets[d] ?? 0), smooth: true, areaStyle: {} }],
  };
}

export default function TrafficPage() {
  const { data: rooms = [], loading } = useRequest(getRoomsApi);

  const trendOption = useMemo(() => buildUploadTrendOption(rooms), [rooms]);

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>流量 & 存储</h2>

      <Alert
        type="info"
        message="当前为精简版"
        description="视频文件大小字段（file_size）待 CoWatch-backend 补充后，本页将展示精确存储用量。当前以房间创建趋势近似替代。"
        showIcon
        closable
        className={styles.alert}
      />

      <Spin spinning={loading}>
        <Row gutter={[16, 16]} className={styles.stats}>
          <Col span={12}>
            <StatCard title="房间总数（含存档）" value={rooms.length} />
          </Col>
          <Col span={12}>
            <StatCard title="有视频的房间" value={rooms.filter((r) => r.video_url).length} />
          </Col>
        </Row>

        <Card title="房间创建趋势（近似流量）" className={styles.chartCard}>
          <EChartsWrapper option={trendOption} height={260} />
        </Card>
      </Spin>
    </div>
  );
}
