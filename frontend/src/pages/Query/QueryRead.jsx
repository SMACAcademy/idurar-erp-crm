import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Descriptions, Button, Input, List, message, Select } from 'antd';
import axios from 'axios';

export default function QueryRead() {
  const { id } = useParams();
  const [query, setQuery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchQuery();
  }, [id]);

  const fetchQuery = async () => {
    try {
      const response = await axios.get(`queries/${id}`);
      setQuery(response.data);
      setStatus(response.data.status);
    } catch (error) {
      console.error('Query fetch error:', error);
      message.error(error.response?.data?.message || 'Failed to fetch query details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;
    try {
      await axios.post(`queries/${id}/notes`, { text: note });
      setNote('');
      fetchQuery();
      message.success('Note added successfully');
    } catch (error) {
      console.error('Note addition error:', error);
      message.error(error.response?.data?.message || 'Failed to add note');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await axios.put(`queries/${id}`, { status: newStatus });
      setStatus(newStatus);
      message.success('Status updated successfully');
    } catch (error) {
      console.error('Status update error:', error);
      message.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!query) return <div>Query not found</div>;

  return (
    <Card title="Query Details">
      <Descriptions bordered>
        <Descriptions.Item label="Customer Name">{query.customerName}</Descriptions.Item>
        <Descriptions.Item label="Status">
          <Select
            value={status}
            onChange={handleStatusChange}
            style={{ width: 120 }}
            options={[
              { value: 'Open', label: 'Open' },
              { value: 'InProgress', label: 'In Progress' },
              { value: 'Closed', label: 'Closed' },
            ]}
          />
        </Descriptions.Item>
        <Descriptions.Item label="Description">{query.description}</Descriptions.Item>
      </Descriptions>

      <Card title="Notes" style={{ marginTop: 16 }}>
        <Input.TextArea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note..."
          style={{ marginBottom: 16 }}
        />
        <Button type="primary" onClick={handleAddNote}>
          Add Note
        </Button>

        <List
          dataSource={query.notes}
          renderItem={(note) => (
            <List.Item>
              <List.Item.Meta
                title={new Date(note.createdAt).toLocaleString()}
                description={note.text}
              />
            </List.Item>
          )}
        />
      </Card>
    </Card>
  );
} 