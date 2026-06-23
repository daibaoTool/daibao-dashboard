import { useMemo, useState } from 'react';
import { Table, Input, Tag, Button, Modal, Select, message } from 'antd';
import { useRequest } from 'ahooks';
import { getRoomsApi, setRoomPlanLevelApi } from '@/api/cowatch';
import type { CoWatchRoom } from '@/types';
import type { ColumnsType } from 'antd/es/table';
import styles from './index.module.scss';

const PLAN_LEVEL_OPTIONS = [
  { value: 'free',      label: '过期（free）' },
  { value: 'vip:basic', label: '普通会员（vip:basic）' },
  { value: 'vip:pro',   label: '高级会员（vip:pro）' },
];

function planLevelTag(planLevel: string) {
  if (planLevel === 'vip:pro')   return <Tag color="gold">vip:pro</Tag>;
  if (planLevel === 'vip:basic') return <Tag color="blue">vip:basic</Tag>;
  return <Tag color="red">free</Tag>;
}

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

  // 等级设置 Modal 状态
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [planTarget, setPlanTarget] = useState<CoWatchRoom | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('free');
  const [planLoading, setPlanLoading] = useState(false);

  const { data: rooms = [], loading, refresh } = useRequest(getRoomsApi);

  const filtered = useMemo(() =>
    keyword
      ? rooms.filter((r) => r.name.toLowerCase().includes(keyword.toLowerCase()) || r.id.includes(keyword))
      : rooms,
    [rooms, keyword],
  );

  function openPlanModal(room: CoWatchRoom) {
    setPlanTarget(room);
    setSelectedPlan(room.plan_level ?? 'free');
    setPlanModalOpen(true);
  }

  async function handlePlanConfirm() {
    if (!planTarget) return;
    setPlanLoading(true);
    try {
      await setRoomPlanLevelApi(planTarget.id, selectedPlan);
      message.success(`房间「${planTarget.name}」等级已设置为 ${selectedPlan}`);
      setPlanModalOpen(false);
      refresh();
    } catch {
      message.error('设置失败，请重试');
    } finally {
      setPlanLoading(false);
    }
  }

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
      title: '等级',
      dataIndex: 'plan_level',
      key: 'plan_level',
      width: 130,
      filters: [
        { text: 'vip:pro',   value: 'vip:pro' },
        { text: 'vip:basic', value: 'vip:basic' },
        { text: 'free',      value: 'free' },
      ],
      onFilter: (value, record) => record.plan_level === value,
      render: (planLevel: string) => planLevelTag(planLevel),
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
    {
      title: '操作',
      key: 'action',
      width: 110,
      render: (_, record) => (
        <Button size="small" onClick={() => openPlanModal(record)}>
          设置等级
        </Button>
      ),
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

      {/* 设置房间等级 Modal */}
      <Modal
        title={`设置房间等级：${planTarget?.name ?? ''}`}
        open={planModalOpen}
        onOk={handlePlanConfirm}
        onCancel={() => setPlanModalOpen(false)}
        confirmLoading={planLoading}
        okText="确认"
        cancelText="取消"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
          <span>目标等级：</span>
          <Select
            value={selectedPlan}
            onChange={setSelectedPlan}
            options={PLAN_LEVEL_OPTIONS}
            style={{ width: 220 }}
          />
        </div>
      </Modal>
    </div>
  );
}
