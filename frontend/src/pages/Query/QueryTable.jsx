import React from 'react';
import { Table, Tag, Button, Space, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, CommentOutlined } from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';

const QueryTable = ({ data, loading, onEdit, onDelete, onViewNotes, pagination, onChange }) => {
  const translate = useLanguage();

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'blue';
      case 'in_progress':
        return 'orange';
      case 'resolved':
        return 'green';
      case 'closed':
        return 'gray';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: translate('customer_name'),
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: translate('description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: translate('created_date'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: translate('status'),
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={getStatusColor(status)}>{translate(status)}</Tag>,
    },
    {
      title: translate('resolution'),
      dataIndex: 'resolution',
      key: 'resolution',
      ellipsis: true,
    },
    {
      title: translate('actions'),
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => onEdit(record)}>
            {translate('edit')}
          </Button>
          <Button icon={<CommentOutlined />} onClick={() => onViewNotes(record)}>
            {translate('notes')}
          </Button>
          <Popconfirm
            title={translate('delete_confirm')}
            onConfirm={() => onDelete(record._id)}
            okText={translate('yes')}
            cancelText={translate('no')}
          >
            <Button danger icon={<DeleteOutlined />}>
              {translate('delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="_id"
      loading={loading}
      pagination={pagination}
      onChange={onChange}
    />
  );
};

export default QueryTable;
