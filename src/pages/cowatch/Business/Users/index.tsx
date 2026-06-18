import { useMemo } from 'react';
import { Row, Col, Card, Spin } from 'antd';
import { useRequest } from 'ahooks';
import { getUsersApi } from '@/api/cowatch';
import EChartsWrapper from '@/components/EChartsWrapper';
import StatCard from '@/components/StatCard';
import type { EChartsOption } from 'echarts';
import styles from './index.module.scss';

function buildGrowthOption(users: { createdAt: number }[]): EChartsOption {
  // 按天统计注册量
  const buckets: Record<string, number> = {};
  for (const u of users) {
    const day = new Date(u.createdAt).toISOString().slice(0, 10);
    buckets[day] = (buckets[day] ?? 0) + 1;
  }
  const sortedDays = Object.keys(buckets).sort();
  // 累计注册数
  let cum = 0;
  const cumData = sortedDays.map((d) => {
    cum += buckets[d];
    return cum;
  });

  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['每日新增', '累计注册'] },
    xAxis: { type: 'category', data: sortedDays },
    yAxis: [
      { type: 'value', name: '每日新增' },
      { type: 'value', name: '累计', position: 'right' },
    ],
    series: [
      { name: '每日新增', type: 'bar', data: sortedDays.map((d) => buckets[d]) },
      { name: '累计注册', type: 'line', yAxisIndex: 1, data: cumData, smooth: true },
    ],
  };
}

export default function UsersBusinessPage() {
  const { data: users = [], loading } = useRequest(getUsersApi);

  const totalUsers = users.length;
  const bannedUsers = users.filter((u) => u.isBanned).length;
  const vipUsers = users.filter((u) => u.plans.some((p) => p.startsWith('vip'))).length;

  const chartOption = useMemo(() => buildGrowthOption(users), [users]);

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>用户增长</h2>
      <Spin spinning={loading}>
        <Row gutter={[16, 16]} className={styles.stats}>
          <Col span={8}>
            <StatCard title="注册用户总数" value={totalUsers} />
          </Col>
          <Col span={8}>
            <StatCard title="会员用户" value={vipUsers} />
          </Col>
          <Col span={8}>
            <StatCard title="封号用户" value={bannedUsers} />
          </Col>
        </Row>

        <Card title="注册趋势" className={styles.chartCard}>
          <EChartsWrapper option={chartOption} height={280} />
        </Card>
      </Spin>
    </div>
  );
}
