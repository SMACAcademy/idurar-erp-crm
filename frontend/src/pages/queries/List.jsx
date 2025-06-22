import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Table,
    Tag,
    Button,
    Space,
    message,
    Select,
    Row,
    Col,
} from 'antd';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;

export default function QueryList() {
    const [queries, setQueries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const navigate = useNavigate();

    const fetchQueries = async (status = '') => {
        setLoading(true);
        try {
            const response = await axios.get(
                `http://localhost:5000/api/queries${status ? `?status=${status}` : ''}`
            );
            setQueries(response.data?.result || []);
        } catch (error) {
            message.error('Failed to fetch queries');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueries(statusFilter);
    }, [statusFilter]);

    const handleStatusChange = (value) => {
        setStatusFilter(value);
    };

    const columns = [
        {
            title: 'Customer Name',
            dataIndex: ['client', 'name'],
            key: 'client.name',
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={status === 'Closed' ? 'green' : 'orange'}>{status}</Tag>
            ),
        },
        {
            title: 'Resolution',
            dataIndex: 'resolution',
            key: 'resolution',
            ellipsis: {
                showTitle: false,
            },
            render: (text) => (
                <span title={text}>
                    {text?.length > 50 ? `${text.slice(0, 50)}...` : text}
                </span>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button type="link" onClick={() => navigate(`/queries/read/${record._id}`)}>
                        View
                    </Button>
                    <Button type="link" onClick={() => navigate(`/queries/update/${record._id}`)}>
                        Edit
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                <Col>
                    <h2>Query List</h2>
                </Col>
                <Col>
                    <Space>
                        <Select
                            allowClear
                            style={{ width: 180 }}
                            placeholder="Filter by Status"
                            value={statusFilter || undefined}
                            onChange={handleStatusChange}
                        >
                            <Option value="Open">Open</Option>
                            <Option value="InProgress">In Progress</Option>
                            <Option value="Closed">Closed</Option>
                        </Select>
                        <Button type="primary" onClick={() => navigate('/queries/create')}>
                            Create Query
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
            />
        </div>
    );
}
