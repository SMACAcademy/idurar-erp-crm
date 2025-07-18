import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, Pagination, Tag } from 'antd';
import { request } from '@/request';
import dayjs from 'dayjs';
import NotesModal from './NotesModal';

const statusOptions = [
  { label: 'Open', value: 'Open' },
  { label: 'InProgress', value: 'InProgress' },
  { label: 'Closed', value: 'Closed' },
];

const QueryList = ({ customers }) => {
  const [queries, setQueries] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingQuery, setEditingQuery] = useState(null);
  const [form] = Form.useForm();
  const [statusFilter, setStatusFilter] = useState();
  const [showNotes, setShowNotes] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [notesKey, setNotesKey] = useState(0); // force NotesModal to remount

  const fetchQueries = async (params = {}) => {
    setLoading(true);
    try {
      const data = await request.getQueries({
        page,
        limit,
        status: statusFilter,
        ...params,
      });
      setQueries(data.data);
      setTotal(data.total);
    } catch (e) {
      setQueries([]);
      setTotal(0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQueries();
    // eslint-disable-next-line
  }, [page, limit, statusFilter]);

  const handleAdd = () => {
    setEditingQuery(null);
    setShowForm(true);
    form.resetFields();
  };

  const handleEdit = (record) => {
    setEditingQuery(record);
    setShowForm(true);
    form.setFieldsValue({ ...record });
  };

  const handleFormFinish = async (values) => {
    if (editingQuery) {
      await request.updateQuery(editingQuery._id, values);
    } else {
      await request.createQuery(values);
    }
    setShowForm(false);
    fetchQueries();
  };

  const openNotesModal = (record) => {
    setSelectedQuery(record);
    setNotesKey(notesKey + 1); // force remount to get fresh notes
    setShowNotes(true);
  };

  const columns = [
    {
      title: 'Customer Name',
      dataIndex: 'customerName',
      filters: customers.map((c) => ({ text: c, value: c })),
      onFilter: (value, record) => record.customerName === value,
    },
    {
      title: 'Description',
      dataIndex: 'description',
    },
    {
      title: 'Created Date',
      dataIndex: 'createdDate',
      render: (date) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status) => <Tag color={status === 'Closed' ? 'red' : status === 'InProgress' ? 'blue' : 'green'}>{status}</Tag>,
      filters: statusOptions.map((s) => ({ text: s.label, value: s.value })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Resolution',
      dataIndex: 'resolution',
      render: (text) => text && text.length > 30 ? text.slice(0, 30) + '...' : text,
    },
    {
      title: 'Notes',
      render: (_, record) => <Button onClick={() => openNotesModal(record)}>Notes</Button>,
    },
    {
      title: 'Edit',
      render: (_, record) => <Button onClick={() => handleEdit(record)}>Edit</Button>,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Button type="primary" onClick={handleAdd}>Add Query</Button>
        <Select
          allowClear
          placeholder="Filter by Status"
          style={{ width: 180 }}
          options={statusOptions}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </div>
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={queries}
        loading={loading}
        pagination={false}
        scroll={{ x: true }}
        bordered
        size="middle"
        style={{ background: '#fff' }}
      />
      <Pagination
        style={{ marginTop: 16, textAlign: 'right' }}
        current={page}
        pageSize={limit}
        total={total}
        onChange={setPage}
        showSizeChanger
        onShowSizeChange={(_, size) => setLimit(size)}
      />
      <Modal
        open={showForm}
        title={editingQuery ? 'Edit Query' : 'Add Query'}
        onCancel={() => setShowForm(false)}
        onOk={() => form.submit()}
        okText={editingQuery ? 'Update' : 'Create'}
      >
        <Form form={form} layout="vertical" onFinish={handleFormFinish}>
          <Form.Item name="customerName" label="Customer Name" rules={[{ required: true }]}> 
            <Select options={customers.map((c) => ({ label: c, value: c }))} showSearch />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}> 
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select options={statusOptions} />
          </Form.Item>
          <Form.Item name="resolution" label="Resolution">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
      <NotesModal
        key={notesKey}
        open={showNotes}
        query={selectedQuery}
        onClose={() => setShowNotes(false)}
        onUpdated={fetchQueries}
      />
    </div>
  );
};

export default QueryList;
