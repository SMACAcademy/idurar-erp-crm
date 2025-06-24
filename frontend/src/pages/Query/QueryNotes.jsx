import React, { useState } from 'react';
import { Drawer, List, Input, Button, Space, Typography, message } from 'antd';
import useLanguage from '@/locale/useLanguage';

const { TextArea } = Input;
const { Text } = Typography;

const QueryNotes = ({ visible, onClose, query, onAddNote, onDeleteNote }) => {
  const translate = useLanguage();
  const [newNote, setNewNote] = useState('');

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      message.error(translate('please_enter_note'));
      return;
    }

    try {
      await onAddNote(query._id, newNote);
      setNewNote('');
      message.success(translate('note_added_success'));
    } catch (error) {
      message.error(translate('failed_to_add_note'));
    }
  };

  return (
    <Drawer
      title={`${translate('notes_for')} ${query?.customerName}`}
      width={720}
      onClose={onClose}
      visible={visible}
      bodyStyle={{ paddingBottom: 80 }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <TextArea
          rows={4}
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder={translate('enter_note')}
        />
        <Button type="primary" onClick={handleAddNote}>
          {translate('add_note')}
        </Button>

        <List
          dataSource={query?.notes || []}
          renderItem={(note) => (
            <List.Item
              actions={[
                <Button type="text" danger onClick={() => onDeleteNote(query._id, note._id)}>
                  {translate('delete')}
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={new Date(note.createdAt).toLocaleString()}
                description={note.content}
              />
            </List.Item>
          )}
        />
      </Space>
    </Drawer>
  );
};

export default QueryNotes;
