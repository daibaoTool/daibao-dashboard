import { useState } from 'react';
import { Table, Tag, Typography, Input, Spin } from 'antd';
import { useRequest } from 'ahooks';
import { useAdmin } from '@/context/AdminContext';
import { getMonitorEventsApi, aggregateErrorEvents } from '@/api/monitor';
import type { ErrorEvent } from '@/types';
import type { ColumnsType } from 'antd/es/table';
import styles from './index.module.scss';

const { Search } = Input;
const { Text } = Typography;

export default function ErrorsPage() {
  const { appKey } = useAdmin();
  const [keyword, setKeyword] = useState('');

  const { data: events = [], loading } = useRequest(
    () => getMonitorEventsApi({ appKey, type: 'error', limit: 2000 }),
    { refreshDeps: [appKey], retryCount: 0 },
  );

  const errors = aggregateErrorEvents(events);
  const filtered = keyword
    ? errors.filter(
        (e) =>
          e.message.toLowerCase().includes(keyword.toLowerCase()) ||
          e.url.toLowerCase().includes(keyword.toLowerCase()),
      )
    : errors;

  const columns: ColumnsType<ErrorEvent> = [
    {
      title: '错误信息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: (msg: string) => <Text code>{msg}</Text>,
    },
    {
      title: '页面 URL',
      dataIndex: 'url',
      key: 'url',
      ellipsis: true,
      render: (url: string) => <Text type="secondary">{url}</Text>,
    },
    {
      title: '出现次数',
      dataIndex: 'count',
      key: 'count',
      width: 110,
      sorter: (a, b) => a.count - b.count,
      render: (count: number) => (
        <Tag color={count >= 10 ? 'red' : count >= 3 ? 'orange' : 'default'}>{count}</Tag>
      ),
    },
    {
      title: '最近发生',
      dataIndex: 'occurred_at',
      key: 'occurred_at',
      width: 180,
      sorter: (a, b) => a.occurred_at - b.occurred_at,
      render: (ts: number) => new Date(ts).toLocaleString('zh-CN'),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <h2 className={styles.title}>错误列表</h2>
        <Search
          placeholder="搜索错误信息或 URL"
          allowClear
          style={{ width: 280 }}
          onSearch={setKeyword}
          onChange={(e) => !e.target.value && setKeyword('')}
        />
      </div>

      <Spin spinning={loading}>
        <Table<ErrorEvent>
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          pagination={{ pageSize: 20, showSizeChanger: false }}
          size="middle"
        />
      </Spin>
    </div>
  );
}
