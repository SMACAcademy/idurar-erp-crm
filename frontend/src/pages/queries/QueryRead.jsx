import React, { useEffect, useState } from 'react';
import { Descriptions, Button, message, Divider, Form, Input, Spin } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function QueryRead() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [query, setQuery] = useState(null);
    const [loading, setLoading] = useState(true);
    const [noteForm] = Form.useForm();
    const [submittingNote, setSubmittingNote] = useState(false);

    const fetchQuery = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/queries/${id}`);
            setQuery(res.data?.query || {});
        } catch (err) {
            message.error('Failed to load query');
            navigate('/queries');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuery();
    }, [id]);

    const handleAddNote = async (values) => {
        try {
            setSubmittingNote(true);
            await axios.post(`http://localhost:5000/api/queries/${id}/notes`, values);
            message.success('Note added');
            noteForm.resetFields();
            fetchQuery();
        } catch (err) {
            message.error(err?.response?.data?.message || 'Failed to add note');
        } finally {
            setSubmittingNote(false);
        }
    };

    const handleDeleteNote = async (noteId) => {
        try {
            await axios.delete(`http://localhost:5000/api/queries/${id}/notes/${noteId}`);
            message.success('Note deleted');
            fetchQuery();
        } catch (err) {
            message.error('Failed to delete note');
        }
    };

    if (loading) return <Spin size="large" />;

    return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <h2>Query Details</h2>
            <Descriptions bordered column={1}>
                <Descriptions.Item label="Client Name">{query?.client?.name}</Descriptions.Item>
                <Descriptions.Item label="Description">{query.description}</Descriptions.Item>
                <Descriptions.Item label="Status">{query.status}</Descriptions.Item>
                <Descriptions.Item label="Resolution">{query.resolution}</Descriptions.Item>
                <Descriptions.Item label="Created At">
                    {new Date(query.createdAt).toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="Updated At">
                    {new Date(query.updatedAt).toLocaleString()}
                </Descriptions.Item>
            </Descriptions>

            <Divider />

            <h3>Notes</h3>
            {query?.notes?.length > 0 ? (
                query.notes.map((note) => (
                    <div key={note._id} style={{ marginBottom: 12 }}>
                        <p>{note.content}</p>
                        <Button type="link" danger onClick={() => handleDeleteNote(note._id)}>
                            Delete
                        </Button>
                        <Divider dashed />
                    </div>
                ))
            ) : (
                <p>No notes added yet.</p>
            )}

            <Divider />

            <h3>Add New Note</h3>
            <Form form={noteForm} onFinish={handleAddNote} layout="vertical">
                <Form.Item
                    name="content"
                    label="Note Content"
                    rules={[{ required: true, message: 'Please enter a note' }]}
                >
                    <Input.TextArea rows={3} />
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={submittingNote}>
                        Add Note
                    </Button>
                </Form.Item>
            </Form>

            <Button style={{ marginTop: 20 }} onClick={() => navigate('/queries')}>
                Back to Queries
            </Button>
        </div>
    );
}
