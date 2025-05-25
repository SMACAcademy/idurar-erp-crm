import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, message } from 'antd';
import axios from 'axios';

export default function QueryCreate() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      setLoading(true);
      await axios.post('queries', values);
      message.success('Query created successfully');
      navigate('/query');
    } catch (error) {
      message.error('Failed to create query');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Create New Query">
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="Customer Name"
          name="customerName"
          rules={[{ required: true, message: 'Please enter customer name' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Description"
          name="description"
          rules={[{ required: true, message: 'Please enter description' }]}
        >
          <Input.TextArea rows={4} />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Create Query
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
} 