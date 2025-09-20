import React from 'react';
import { DataTable } from '../../components/DataTable';
import dayjs from 'dayjs';
import { Button, Tag } from 'antd';

const QueryDataTableModule = ({ dataSource, loading, onEdit, onView, onDelete }) => {
  const columns = [
    { title: 'Customer Name', dataIndex: ['customerId', 'name'], key: 'customerId' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    { title: 'Created Date', dataIndex: 'createdAt', key: 'createdAt', render: (date) => dayjs(date).format('YYYY-MM-DD') },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => (
      <Tag color={status === 'Open' ? 'green' : status === 'InProgress' ? 'blue' : 'red'}>
        {status}
      </Tag>
    ) },
    { title: 'Resolution', dataIndex: 'resolution', key: 'resolution', render: (res) => res ? res.slice(0, 50) + '...' : '' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <>
          <Button onClick={() => onView(record)} style={{ marginRight: 8 }}>View</Button>
          <Button onClick={() => onEdit(record)} style={{ marginRight: 8 }}>Edit</Button>
          <Button onClick={() => onDelete(record._id)} danger>Delete</Button>
        </>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      dataSource={dataSource}
      loading={loading}
      rowKey="_id"
      pagination={{ pageSize: 10 }}
    />
  );
};

export default QueryDataTableModule;