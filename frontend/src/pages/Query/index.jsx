import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Card, Button, Tag, Space } from 'antd';
import axios from 'axios';

export default function Query() {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    try {
      const response = await axios.get('queries');
      setQueries(response.data);
    } catch (error) {
      console.error('Failed to fetch queries:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open':
        return 'blue';
      case 'InProgress':
        return 'orange';
      case 'Closed':
        return 'green';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: 'Customer Name',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => navigate(`/query/read/${record._id}`)}>
            View
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Queries"
      extra={
        <Button type="primary" onClick={() => navigate('/query/create')}>
          Create Query
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={queries}
        loading={loading}
        rowKey="_id"
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
}

