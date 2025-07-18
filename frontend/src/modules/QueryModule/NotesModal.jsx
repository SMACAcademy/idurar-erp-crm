import React, { useState, useEffect } from 'react';
import { Modal, List, Button, Input, Popconfirm, message } from 'antd';
import { request } from '@/request';

const NotesModal = ({ open, query, onClose, onUpdated }) => {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);

  // Always reload notes from the latest query object
  useEffect(() => {
    setNotes(query?.notes || []);
  }, [query]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setLoading(true);
    try {
      await request.addQueryNote(query._id, { text: newNote });
      setNewNote('');
      await onUpdated(); // Ensure parent reloads the query and updates notes
    } catch (e) {
      message.error('Failed to add note');
    }
    setLoading(false);
  };

  const handleDeleteNote = async (noteId) => {
    setLoading(true);
    try {
      await request.deleteQueryNote(query._id, noteId);
      await onUpdated(); // Ensure parent reloads the query and updates notes
    } catch (e) {
      message.error('Failed to delete note');
    }
    setLoading(false);
  };

  return (
    <Modal open={open} title="Notes" onCancel={onClose} onOk={onClose} footer={null}>
      <List
        dataSource={notes}
        renderItem={item => (
          <List.Item
            actions={[
              <Popconfirm title="Delete note?" onConfirm={() => handleDeleteNote(item._id)} okText="Yes" cancelText="No">
                <Button danger size="small">Delete</Button>
              </Popconfirm>
            ]}
          >
            <div>{item.text}</div>
          </List.Item>
        )}
      />
      <Input.TextArea
        rows={2}
        value={newNote}
        onChange={e => setNewNote(e.target.value)}
        placeholder="Add a note..."
        style={{ marginTop: 12 }}
      />
      <Button type="primary" onClick={handleAddNote} loading={loading} style={{ marginTop: 8 }}>
        Add Note
      </Button>
    </Modal>
  );
};

export default NotesModal;
