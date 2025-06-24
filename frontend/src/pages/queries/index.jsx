import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, Tag, Button, Space, message, Select, Row, Col } from 'antd';
import { useNavigate } from 'react-router-dom';
import QueryModal from './QueryModal';
import { EyeFilled } from '@ant-design/icons';
const { Option } = Select;

export default function Queries() {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const limit = 10; // Assuming a default limit of 10
  const getAllQueries = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:8888/api/queries?page=${page}&limit=${limit}&status=${status}`
      );
      console.log(response.data);
      if (response.data.success === false) {
        return message.error(response.data.message || 'Failed to fetch queries');
      }
      setQueries(response.data?.result || []);
      setTotalPages(response.data?.total || 1);
    } catch (error) {
      message.error('Failed to fetch queries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllQueries();
  }, [status, page]);

  const handleStatusChange = (value) => {
    setStatus(value);
  };
  const handleEdit = (query) => {
    setSelectedQuery(query);
    setIsModalOpen(true);
  };

  const handleUpdate = async (id, updatedValues) => {
    try {
      const response = await axios.put(`http://localhost:8888/api/queries/${id}`, updatedValues);
      if (!response.data.success) {
        return message.error(response.data.message || 'Failed to update query');
      }
      message.success('Query updated!');
      setIsModalOpen(false);
      getAllQueries();
    } catch (err) {
      console.error(err);
      message.error('Update failed');
    }
  };

  const columns = [
    {
      title: 'Customer Name',
      dataIndex: 'customername',
      key: 'customername',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },

    {
      title: 'Resolution',
      dataIndex: 'resolution',
      key: 'resolution',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, column) => (
        <Space >
          <Button type="dashed"  data-testid="view-query" icon={<EyeFilled/>}onClick={() => handleEdit(column) }>
            
          </Button>
          <Button type="primary" onClick={() => navigate(`/queries/update/${record._id}`)}>
            +Add Note
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <h2>Queries</h2>
        </Col>
        <Col>
          <Space>
            <Select
              allowClear
              style={{ width: 200 }}
              placeholder="select status"
              value={status || undefined}
              onChange={handleStatusChange}
            >
              <Option value="">All</Option>
              <Option value="open">open</Option>
              <Option value="inProgress">inProgress</Option>
              <Option value="closed">closed</Option>
            </Select>
            <Button type="primary" onClick={() => navigate('/queries/create')}>
              +Create Query
            </Button>
          </Space>
        </Col>
      </Row>
      <Table
        columns={columns}
        dataSource={queries}
        rowKey="_id"
        loading={loading}
        bordered
        pagination={{
          current: page,
          pageSize: limit,
          total: totalPages,
          onChange: (page) => setPage(page),
        }}
      />

      <QueryModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        query={selectedQuery}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
