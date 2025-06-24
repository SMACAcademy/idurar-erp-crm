import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PlusOutlined } from '@ant-design/icons';
import { Form, Input, Button, Select, message } from 'antd';

import AutoCompleteAsync from '@/components/AutoCompleteAsync';

export default function CreateQuery() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    console.log('Form values:', values);
    try {
      setLoading(true);
      const body = {
        customername: values.customername,
        description: values.description,
        status: values.status,
        resolution: values.resolution,
      };

      const response = await axios.post('http://localhost:8888/api/queries', body);
      if (response.data.success === false) {
        return message.error(response.data.message || 'Failed to create query');
      }
      message.success('Query created successfully');
      navigate(`/queries`);
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to create query');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <h2>Create a New Query</h2>

      <Form
        layout="vertical"
        form={form}
        onFinish={handleSubmit}
        autoComplete="off"
        initialValues={{
          status: 'open',
        }}
      >
        <Form.Item
          name="customername"
          label="customer name"
          rules={[{ message: 'select your customer' }]}
        >
          <AutoCompleteAsync
            entity="client"
            displayLabels={['name']}
            searchFields="name"
            outputValue="_id"
            withRedirect
            urlToRedirect="/customer"
            redirectLabel="New customer"
          />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: 'Please enter a description' }]}
        >
          <Input.TextArea rows={3} placeholder="enter description" />
        </Form.Item>

        <Form.Item name="status" label="Status">
          <Select>
            <Select.Option value="open">open</Select.Option>
            <Select.Option value="inProgress">inProgress</Select.Option>
            <Select.Option value="closed">closed</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="resolution"
          label="Resolution"
          rules={[
            {
              max: 100,
              message: '...less than 100 characters',
            },
          ]}
        >
          <Input placeholder="Enter Resolution" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} icon={<PlusOutlined />} block>
            Create Query
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
