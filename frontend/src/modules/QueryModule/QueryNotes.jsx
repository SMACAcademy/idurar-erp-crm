import React from 'react';
import { List, Button, Form, Input } from 'antd';

const { TextArea } = Input;

const QueryNotes = ({ notes, onAddNote, onDeleteNote }) => {
  const [form] = Form.useForm();

  const handleAddNote = () => {
    form.validateFields().then((values) => {
      onAddNote(values.note);
      form.resetFields();
    });
  };

  return (
    <div style={{ marginTop: 16 }}>
      <List
        dataSource={notes}
        renderItem={(note) => (
          <List.Item actions={[<Button onClick={() => onDeleteNote(note._id)}>Delete</Button>]}>
            {note.note}
          </List.Item>
        )}
      />
      <Form form={form} layout="inline" style={{ marginTop: 16 }}>
        <Form.Item name="note" rules={[{ required: true, message: 'Please input a note!' }]}>
          <TextArea rows={3} placeholder="Add note" />
        </Form.Item>
        <Button type="primary" onClick={handleAddNote} style={{ marginLeft: 8 }}>Add Note</Button>
      </Form>
    </div>
  );
};

export default QueryNotes;