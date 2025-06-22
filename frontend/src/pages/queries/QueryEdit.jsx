import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { SaveOutlined } from '@ant-design/icons';

export default function QueryEdit() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [clientName, setClientName] = useState('');
    const navigate = useNavigate();
    const { id } = useParams();

    useEffect(() => {
        fetchQuery();
    }, [id]);

    const fetchQuery = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/queries/${id}`);
            const query = res.data?.query || res.data;

            form.setFieldsValue({
                description: query.description,
                status: query.status,
                resolution: query.resolution,
            });

            setClientName(query.client?.name || '');
        } catch (error) {
            message.error('Failed to load query');
            navigate('/queries');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values) => {
        try {
            setSubmitting(true);
            await axios.put(`http://localhost:5000/api/queries/${id}`, {
                status: values.status,
                resolution: values.resolution,
            });
            message.success('Query updated successfully');
            navigate('/queries');
        } catch (err) {
            message.error(err?.response?.data?.message || 'Failed to update query');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <h2>Edit Query</h2>

            <Form
                layout="vertical"
                form={form}
                onFinish={handleSubmit}
                autoComplete="off"
                initialValues={{ status: 'Open' }}
            >
                <Form.Item label="Client">
                    <Input value={clientName} disabled />
                </Form.Item>

                <Form.Item name="description" label="Description">
                    <Input.TextArea rows={3} disabled />
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
                    rules={[{ max: 100, message: 'Must be under 100 characters' }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        icon={<SaveOutlined />}
                        loading={submitting}
                        block
                    >
                        Save Changes
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
}
