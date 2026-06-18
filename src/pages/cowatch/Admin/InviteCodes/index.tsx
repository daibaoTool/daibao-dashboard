import { useState } from 'react';
import { Table, Tag, Button, Modal, Form, Input, InputNumber, Select, Popconfirm, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { getInviteCodesApi, createInviteCodeApi, deleteInviteCodeApi } from '@/api/cowatch';
import type { InviteCode } from '@/types';
import type { ColumnsType } from 'antd/es/table';
import styles from './index.module.scss';

interface CreateForm {
  code: string;
  maxCount: number;
  grantPlan?: string | null;
}

export default function InviteCodesPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm<CreateForm>();

  const { data: codes = [], loading, refresh } = useRequest(getInviteCodesApi);

  const handleCreate = async () => {
    const values = await form.validateFields();
    try {
      await createInviteCodeApi({
        code: values.code,
        maxCount: values.maxCount,
        grantPlan: values.grantPlan || null,
      });
      message.success('邀请码创建成功');
      setCreateOpen(false);
      form.resetFields();
      refresh();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '创建失败');
    }
  };

  const handleDelete = async (code: string) => {
    try {
      await deleteInviteCodeApi(code);
      message.success('邀请码已删除');
      refresh();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '删除失败');
    }
  };

  const columns: ColumnsType<InviteCode> = [
    {
      title: '邀请码',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => <code>{code}</code>,
    },
    {
      title: '已使用 / 总次数',
      key: 'usage',
      render: (_, record) => (
        <span>
          {record.used_count} / {record.max_count}
        </span>
      ),
    },
    {
      title: '授予权益',
      dataIndex: 'grant_plan',
      key: 'grant_plan',
      render: (plan: string | null) =>
        plan ? <Tag color="blue">{plan}</Tag> : <span>—</span>,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Popconfirm
          title="确认删除该邀请码？"
          onConfirm={() => handleDelete(record.code)}
          okText="删除"
          okType="danger"
          cancelText="取消"
        >
          <Button size="small" danger>删除</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <h2 className={styles.title}>邀请码管理</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateOpen(true)}
        >
          生成邀请码
        </Button>
      </div>

      <Table<InviteCode>
        rowKey="code"
        columns={columns}
        dataSource={codes}
        loading={loading}
        pagination={{ pageSize: 20 }}
        size="middle"
      />

      <Modal
        title="生成邀请码"
        open={createOpen}
        onOk={handleCreate}
        onCancel={() => { setCreateOpen(false); form.resetFields(); }}
        okText="创建"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="code"
            label="邀请码"
            rules={[
              { required: true, message: '请输入邀请码' },
              { min: 2, message: '至少 2 个字符' },
            ]}
          >
            <Input placeholder="例：hello2025" />
          </Form.Item>
          <Form.Item
            name="maxCount"
            label="可用次数"
            rules={[{ required: true, message: '请输入次数' }]}
            initialValue={10}
          >
            <InputNumber min={1} max={999999} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="grantPlan" label="授予权益（可选）">
            <Select
              allowClear
              placeholder="不选则为普通成员"
              options={[
                { label: 'vip:basic', value: 'vip:basic' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
