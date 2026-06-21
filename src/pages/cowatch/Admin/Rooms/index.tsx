import { useMemo, useState } from 'react';
import { Table, Input, Tag } from 'antd';
import { useRequest } from 'ahooks';
import { getRoomsApi } from '@/api/cowatch';
import type { CoWatchRoom } from '@/types';
import type { ColumnsType } from 'antd/es/table';
import styles from './index.module.scss';

/** 将字节数格式化为可读字符串 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export default function AdminRoomsPage() {
  const [keyword, setKeyword] = useState('');

  const { data: rooms = [], loading } = useRequest(getRoomsApi);

  const filtered = useMemo(() =>
    keyword
      ? rooms.filter((r) => r.name.toLowerCase().includes(keyword.toLowerCase()) || r.id.includes(keyword))
      : rooms,
    [rooms, keyword],
  );

  const columns: ColumnsType<CoWatchRoom> = [
    {
      title: '房间名',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <span className={styles.roomName}>{name}</span>,
    },
    {
      title: '房间 ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => <code className={styles.roomId}>{id}</code>,
    },
    {
      title: '成员数',
      dataIndex: 'member_count',
      key: 'member_count',
      width: 90,
      sorter: (a, b) => a.member_count - b.member_count,
    },
    {
      title: '今日流量',
      dataIndex: 'traffic_today',
      key: 'traffic_today',
      width: 120,
      sorter: (a, b) => a.traffic_today - b.traffic_today,
      render: (v: number) => (
        <Tag color={v > 0 ? 'blue' : 'default'}>{formatBytes(v)}</Tag>
      ),
    },
    {
      title: '近 7 天',
      dataIndex: 'traffic_7d',
      key: 'traffic_7d',
      width: 120,
      sorter: (a, b) => a.traffic_7d - b.traffic_7d,
      render: (v: number) => (
        <Tag color={v > 0 ? 'geekblue' : 'default'}>{formatBytes(v)}</Tag>
      ),
    },
    {
      title: '当月流量',
      dataIndex: 'traffic_month',
      key: 'traffic_month',
      width: 130,
      defaultSortOrder: 'descend',
      sorter: (a, b) => a.traffic_month - b.traffic_month,
      render: (v: number) => (
        <Tag color={v > 0 ? 'purple' : 'default'}>{formatBytes(v)}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (ts: number) => new Date(ts).toLocaleString('zh-CN'),
      sorter: (a, b) => a.created_at - b.created_at,
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <h2 className={styles.title}>房间管理</h2>
        <Input.Search
          placeholder="搜索房间名或 ID"
          allowClear
          style={{ width: 260 }}
          onSearch={setKeyword}
          onChange={(e) => !e.target.value && setKeyword('')}
        />
      </div>

      <Table<CoWatchRoom>
        rowKey="id"
        columns={columns}
        dataSource={filtered}
        loading={loading}
        pagination={{ pageSize: 20 }}
        size="middle"
      />
    </div>
  );
}
