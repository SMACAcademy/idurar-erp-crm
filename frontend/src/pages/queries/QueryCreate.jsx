import React, { useState } from 'react';
import { Form, Input, Button, Select, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PlusOutlined } from '@ant-design/icons';

import AutoCompleteAsync from '@/components/AutoCompleteAsync';

export default function QueryCreate() {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [form] = Form.useForm();

    const handleSubmit = async (values) => {
        try {
            setLoading(true);
            const payload = {
                client: values.client,
                description: values.description,
                status: values.status,
                resolution: values.resolution,
            };

            const response = await axios.post('http://localhost:5000/api/queries', payload);
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
            <h2>Create New Query</h2>

            <Form
                layout="vertical"
                form={form}
                onFinish={handleSubmit}
                autoComplete="off"
                initialValues={{
                    status: 'Open',
                }}
            >
                <Form.Item
                    name="client"
                    label="Client"
                    rules={[{ required: true, message: 'Please select a client' }]}
                >
                    <AutoCompleteAsync
                        entity="client"
                        displayLabels={['name']}
                        searchFields="name"
                        outputValue="_id"
                        withRedirect
                        urlToRedirect="/customer"
                        redirectLabel="Add New Client"
                    />
                </Form.Item>

                <Form.Item
                    name="description"
                    label="Description"
                    rules={[{ required: true, message: 'Please enter a description' }]}
                >
                    <Input.TextArea rows={3} placeholder="What is the issue?" />
                </Form.Item>

                <Form.Item
                    name="status"
                    label="Status"
                    rules={[{ required: true, message: 'Please select a status' }]}
                >
                    <Select>
                        <Select.Option value="Open">Open</Select.Option>
                        <Select.Option value="InProgress">In Progress</Select.Option>
                        <Select.Option value="Closed">Closed</Select.Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    name="resolution"
                    label="Resolution"
                    rules={[
                        {
                            max: 100,
                            message: 'Resolution must be less than 100 characters',
                        },
                    ]}
                >
                    <Input placeholder="Resolution if known" />
                </Form.Item>

                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        icon={<PlusOutlined />}
                        block
                    >
                        Create Query
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
}
