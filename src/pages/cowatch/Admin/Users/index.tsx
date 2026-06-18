import { useState } from 'react';
import { Table, Tag, Button, Space, Popconfirm, Modal, Select, message, Input } from 'antd';
import { useRequest } from 'ahooks';
import { getUsersApi, setBanApi, grantPlanApi, deleteUserApi } from '@/api/cowatch';
import type { CoWatchUser } from '@/types';
import type { ColumnsType } from 'antd/es/table';
import styles from './index.module.scss';

const PLAN_OPTIONS = [
  { label: '普通会员（vip:basic）', value: 'vip:basic' },
  { label: '测试账号（dev）', value: 'dev' },
];

export default function AdminUsersPage() {
  const [keyword, setKeyword] = useState('');
  const [planModal, setPlanModal] = useState<{ open: boolean; userId: string }>({
    open: false,
    userId: '',
  });
  const [selectedPlan, setSelectedPlan] = useState<string>('vip:basic');

  const { data: users = [], loading, refresh } = useRequest(getUsersApi);

  const filtered = keyword
    ? users.filter(
        (u) =>
          u.username.toLowerCase().includes(keyword.toLowerCase()) ||
          u.nickname.toLowerCase().includes(keyword.toLowerCase()),
      )
    : users;

  const handleBan = async (userId: string, ban: boolean) => {
    try {
      await setBanApi(userId, ban);
      message.success(ban ? '封号成功' : '解封成功');
      refresh();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      await deleteUserApi(userId);
      message.success('用户已删除');
      refresh();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleGrantPlan = async () => {
    try {
      await grantPlanApi(planModal.userId, selectedPlan);
      message.success(`权益 ${selectedPlan} 已赋予`);
      setPlanModal({ open: false, userId: '' });
      refresh();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '操作失败');
    }
  };

  const columns: ColumnsType<CoWatchUser> = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      render: (name: string, record) => (
        <Space>
          <span>{name}</span>
          {record.isBanned && <Tag color="red">封号</Tag>}
        </Space>
      ),
    },
    { title: '昵称', dataIndex: 'nickname', key: 'nickname' },
    {
      title: '权益',
      dataIndex: 'plans',
      key: 'plans',
      render: (plans: string[]) =>
        plans.length ? plans.map((p) => <Tag key={p} color="blue">{p}</Tag>) : <span>—</span>,
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (ts: number) => new Date(ts).toLocaleString('zh-CN'),
      sorter: (a, b) => a.createdAt - b.createdAt,
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            danger={!record.isBanned}
            onClick={() => handleBan(record.userId, !record.isBanned)}
          >
            {record.isBanned ? '解封' : '封号'}
          </Button>
          <Button
            size="small"
            onClick={() => {
              setPlanModal({ open: true, userId: record.userId });
            }}
          >
            赋予权益
          </Button>
          <Popconfirm
            title="确认删除该用户？"
            description="此操作不可逆！"
            onConfirm={() => handleDelete(record.userId)}
            okText="删除"
            okType="danger"
            cancelText="取消"
          >
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <h2 className={styles.title}>用户管理</h2>
        <Input.Search
          placeholder="搜索用户名或昵称"
          allowClear
          style={{ width: 260 }}
          onSearch={setKeyword}
          onChange={(e) => !e.target.value && setKeyword('')}
        />
      </div>

      <Table<CoWatchUser>
        rowKey="userId"
        columns={columns}
        dataSource={filtered}
        loading={loading}
        pagination={{ pageSize: 20 }}
        size="middle"
      />

      <Modal
        title="赋予权益"
        open={planModal.open}
        onOk={handleGrantPlan}
        onCancel={() => setPlanModal({ open: false, userId: '' })}
        okText="确认"
        cancelText="取消"
      >
        <Select
          style={{ width: '100%', marginTop: 16 }}
          options={PLAN_OPTIONS}
          value={selectedPlan}
          onChange={setSelectedPlan}
        />
      </Modal>
    </div>
  );
}
