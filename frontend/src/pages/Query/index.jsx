import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Tag, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Space, 
  Card, 
  Typography,
  message,
  Popconfirm
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  MessageOutlined,
  CloseOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';
import useLanguage from '@/locale/useLanguage';
import { useDate } from '@/settings';

const { TextArea } = Input;
const { Title, Text } = Typography;

const QueryPage = () => {
  const translate = useLanguage();
  const { dateFormat } = useDate();
  
  const [queries, setQueries] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isNotesModalVisible, setIsNotesModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [noteForm] = Form.useForm();

  // const fetchClients = async () => {
  //   try {
  //     const response = await axios.get('/client'); // Adjust endpoint if needed
  //     setClients(response.data.result || []);
  //   } catch (error) {
  //     message.error('Failed to fetch clients');
  //     console.error('Error fetching clients:', error);
  //   }
  // };

  const fetchQueries = async (page = 1, limit = 10, status = statusFilter) => {
    setLoading(true);
    try {
      let url = `/queries?page=${page}&limit=${limit}`;
      if (status !== 'all') url += `&status=${status}`;
      const response = await axios.get(url);
      setQueries(response.data.data || []);
      setPagination(prev => ({
        ...prev,
        current: page,
        total: response.data.total || 0,
      }));
    } catch (error) {
      message.error('Failed to fetch queries');
      console.error('Error fetching queries:', error);
    } finally {
      setLoading(false);
    }
  };

  // useEffect(() => {
  //   fetchClients();
  //   fetchQueries();
  // }, []);

  useEffect(() => {
    fetchQueries(1, pagination.pageSize, statusFilter);
  }, [statusFilter]);

  const handleTableChange = (paginationInfo) => {
    fetchQueries(paginationInfo.current, paginationInfo.pageSize, statusFilter);
  };

  const handleCreateQuery = async (values) => {
    try {
      await axios.post('/queries', values);
      message.success('Query created successfully');
      setIsModalVisible(false);
      form.resetFields();
      fetchQueries(pagination.current, pagination.pageSize, statusFilter);
    } catch (error) {
      message.error(`Error creating query: ${error.message}`);
      console.error('Error creating query:', error);
    }
  };

  const handleUpdateQuery = async (values) => {
    try {
      await axios.put(`/queries/${selectedQuery._id}`, values);
      message.success('Query updated successfully');
      setIsModalVisible(false);
      setSelectedQuery(null);
      form.resetFields();
      fetchQueries(pagination.current, pagination.pageSize, statusFilter);
    } catch (error) {
      message.error(`Error updating query: ${error.message}`);
      console.error('Error updating query:', error);
    }
  };

  const handleDeleteQuery = async (queryId) => {
    try {
      await axios.delete(`/queries/${queryId}`);
      message.success('Query deleted successfully');
      fetchQueries(pagination.current, pagination.pageSize, statusFilter);
    } catch (error) {
      message.error(`Error deleting query: ${error.message}`);
      console.error('Error deleting query:', error);
    }
  };

  const handleAddNote = async (values) => {
    try {
      await axios.post(`/queries/${selectedQuery._id}/notes`, values);
      message.success('Note added successfully');
      setIsNotesModalVisible(false);
      noteForm.resetFields();
      fetchQueries(pagination.current, pagination.pageSize, statusFilter);
    } catch (error) {
      message.error(`Error adding note: ${error.message}`);
      console.error('Error adding note:', error);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await axios.delete(`/queries/${selectedQuery._id}/notes/${noteId}`);
      message.success('Note deleted successfully');
      fetchQueries(pagination.current, pagination.pageSize, statusFilter);
    } catch (error) {
      message.error(`Error deleting note: ${error.message}`);
      console.error('Error deleting note:', error);
    }
  };

  const openCreateModal = () => {
    setSelectedQuery(null);
    setIsModalVisible(true);
    form.resetFields();
  };

  const openEditModal = (query) => {
    setSelectedQuery(query);
    setIsModalVisible(true);
    form.setFieldsValue({
      customerId: query.customerId?._id,
      description: query.description,
      status: query.status,
      resolution: query.resolution,
    });
  };

  const openNotesModal = (query) => {
    setSelectedQuery(query);
    setIsNotesModalVisible(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'red';
      case 'InProgress': return 'orange';
      case 'Closed': return 'green';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Customer',
      dataIndex: ['customerId', 'name'],
      key: 'customer',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Created Date',
      dataIndex: 'createdAt', // Changed from createdDate
      key: 'createdAt',
      render: (date) => dayjs(date).format(dateFormat),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Resolution',
      dataIndex: 'resolution',
      key: 'resolution',
      ellipsis: true,
      render: (resolution) => resolution ? resolution.substring(0, 50) + '...' : '-',
    },
    {
      title: 'Notes',
      key: 'notes',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<MessageOutlined />}
            onClick={() => openNotesModal(record)}
          >
            {record.notes?.length || 0} notes
          </Button>
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => openEditModal(record)}
          >
            View
          </Button>
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this query?"
            onConfirm={() => handleDeleteQuery(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              type="link" 
              danger 
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>Query Management</Title>
        <Space>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 150 }}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'Open', label: 'Open' },
              { value: 'InProgress', label: 'In Progress' },
              { value: 'Closed', label: 'Closed' },
            ]}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            Add Query
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={queries}
        loading={loading}
        rowKey="_id"
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} queries`,
        }}
        onChange={handleTableChange}
      />

      <Modal
        title={selectedQuery ? 'Edit Query' : 'Create Query'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setSelectedQuery(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={selectedQuery ? handleUpdateQuery : handleCreateQuery}
        >
          <Form.Item
            name="customerId"
            label="Customer"
            rules={[{ required: true, message: 'Please select a customer' }]}
          >
            <Select
              placeholder="Select a customer"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {clients.map(client => (
                <Select.Option key={client._id} value={client._id}>
                  {client.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter a description' }]}
          >
            <TextArea rows={4} placeholder="Enter query description" />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select a status' }]}
          >
            <Select placeholder="Select status">
              <Select.Option value="Open">Open</Select.Option>
              <Select.Option value="InProgress">In Progress</Select.Option>
              <Select.Option value="Closed">Closed</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="resolution"
            label="Resolution"
          >
            <TextArea rows={3} placeholder="Enter resolution details" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setIsModalVisible(false);
                setSelectedQuery(null);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {selectedQuery ? 'Update' : 'Create'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Notes for Query: ${selectedQuery?.description?.substring(0, 50)}...`}
        open={isNotesModalVisible}
        onCancel={() => {
          setIsNotesModalVisible(false);
          setSelectedQuery(null);
          noteForm.resetFields();
        }}
        footer={null}
        width={700}
      >
        <div style={{ marginBottom: '16px' }}>
          <Form
            form={noteForm}
            layout="vertical"
            onFinish={handleAddNote}
          >
            <Form.Item
              name="text"
              rules={[{ required: true, message: 'Please enter a note' }]}
            >
              <TextArea rows={3} placeholder="Add a new note..." />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Button type="primary" htmlType="submit">
                Add Note
              </Button>
            </Form.Item>
          </Form>
        </div>

        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {selectedQuery?.notes?.map((note, index) => (
            <Card
              key={note._id || index}
              size="small"
              style={{ marginBottom: '8px' }}
              actions={[
                <Popconfirm
                  title="Are you sure you want to delete this note?"
                  onConfirm={() => handleDeleteNote(note._id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button type="link" danger icon={<CloseOutlined />}>
                    Delete
                  </Button>
                </Popconfirm>
              ]}
            >
              <Text>{note.text}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {dayjs(note.createdAt).format('YYYY-MM-DD HH:mm')}
              </Text>
            </Card>
          ))}
          {(!selectedQuery?.notes || selectedQuery.notes.length === 0) && (
            <Text type="secondary">No notes yet. Add the first note above.</Text>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default QueryPage;