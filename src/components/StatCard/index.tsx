import { Card, Statistic } from 'antd';

interface StatCardProps {
  title: string;
  value: number | string;
  suffix?: string;
  precision?: number;
  loading?: boolean;
}

export default function StatCard({ title, value, suffix, precision, loading }: StatCardProps) {
  return (
    <Card loading={loading} size="small" style={{ borderRadius: 10 }}>
      <Statistic title={title} value={value} suffix={suffix} precision={precision} />
    </Card>
  );
}
