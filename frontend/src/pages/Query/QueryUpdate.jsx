import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Form, Input, Button, message } from 'antd';
import axios from 'axios';

export default function QueryUpdate() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    fetchQuery();
    // eslint-disable-next-line
  }, [id]);

  const fetchQuery = async () => {
    try {
      const response = await axios.get(`/queries/${id}`);
      form.setFieldsValue({
        customerName: response.data.customerName,
        description: response.data.description,
        summary: response.data.summary,
      });
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to fetch query');
    } finally {
      setFetching(false);
    }
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);
      await axios.put(`queries/${id}`, values);
      message.success('Query updated successfully');
      navigate('/query');
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to update query');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div>Loading...</div>;

  return (
    <Card title="Update Query">
      <Form layout="vertical" form={form} onFinish={onFinish}>
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
            Update Query
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
} 