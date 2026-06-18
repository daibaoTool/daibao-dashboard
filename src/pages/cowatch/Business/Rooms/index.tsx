import { useMemo } from 'react';
import { Row, Col, Card, Table, Spin } from 'antd';
import { useRequest } from 'ahooks';
import { getRoomsApi } from '@/api/cowatch';
import EChartsWrapper from '@/components/EChartsWrapper';
import StatCard from '@/components/StatCard';
import type { CoWatchRoom } from '@/types';
import type { ColumnsType } from 'antd/es/table';
import type { EChartsOption } from 'echarts';
import styles from './index.module.scss';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function buildActivityOption(rooms: CoWatchRoom[]): EChartsOption {
  const buckets: Record<string, number> = {};
  for (const r of rooms) {
    const day = new Date(r.updated_at).toISOString().slice(0, 10);
    buckets[day] = (buckets[day] ?? 0) + 1;
  }
  const days = Object.keys(buckets).sort().slice(-14);
  return {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: days },
    yAxis: { type: 'value', name: '活跃房间数' },
    series: [{ name: '活跃房间', type: 'bar', data: days.map((d) => buckets[d] ?? 0) }],
  };
}

const columns: ColumnsType<CoWatchRoom> = [
  { title: '房间名', dataIndex: 'name', key: 'name', ellipsis: true },
  { title: '成员数', dataIndex: 'member_count', key: 'member_count', width: 90, sorter: (a, b) => a.member_count - b.member_count },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 180,
    render: (ts: number) => new Date(ts).toLocaleString('zh-CN'),
    sorter: (a, b) => a.created_at - b.created_at,
  },
];

export default function RoomsPage() {
  const { data: rooms = [], loading } = useRequest(getRoomsApi);

  const now = Date.now();
  const activeRooms = rooms.filter((r) => r.updated_at >= now - SEVEN_DAYS_MS);
  const chartOption = useMemo(() => buildActivityOption(rooms), [rooms]);

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>房间统计</h2>
      <Spin spinning={loading}>
        <Row gutter={[16, 16]} className={styles.stats}>
          <Col span={12}>
            <StatCard title="房间总数" value={rooms.length} />
          </Col>
          <Col span={12}>
            <StatCard title="7天活跃房间" value={activeRooms.length} />
          </Col>
        </Row>

        <Card title="近 14 天活跃房间趋势" className={styles.chartCard}>
          <EChartsWrapper option={chartOption} height={260} />
        </Card>

        <Table<CoWatchRoom>
          rowKey="id"
          columns={columns}
          dataSource={rooms}
          pagination={{ pageSize: 20 }}
          size="middle"
        />
      </Spin>
    </div>
  );
}
