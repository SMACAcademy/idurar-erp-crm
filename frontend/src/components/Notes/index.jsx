import React, { useState } from 'react';
import { Form, Input, Button, List, message, Popconfirm } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';
import { useCrudContext } from '@/context/crud';
import { useDispatch } from 'react-redux';
import { request } from '@/request';
import { erp } from '@/redux/erp/actions';
import axios from 'axios';
import { API_BASE_URL } from '@/config/serverApiConfig';
import storePersist from '@/redux/storePersist';

const { TextArea } = Input;

export default function Notes({ queryId, notes = [] }) {
  const translate = useLanguage();
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const { state } = useCrudContext();
  const { result: currentItem } = state;

  const handleAddNote = async (values) => {
    try {
      const response = await request.post({
        entity: `query/${queryId}/notes`,
        jsonData: { content: values.content },
      });

      if (response.success) {
        form.resetFields();
        message.success(translate('Note added successfully'));
        // Refresh the query to get updated notes
        dispatch(erp.read({ entity: 'query', id: queryId }));
      } else {
        message.error(translate('Failed to add note'));
      }
    } catch (error) {
      message.error(translate('Failed to add note'));
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      const auth = storePersist.get('auth');
      const token = auth?.current?.token;

      const response = await axios.delete(`${API_BASE_URL}query/${queryId}/notes/${noteId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.success) {
        message.success(translate('Note deleted successfully'));
        // Refresh the query to get updated notes
        dispatch(erp.read({ entity: 'query', id: queryId }));
      } else {
        message.error(translate('Failed to delete note'));
      }
    } catch (error) {
      message.error(translate('Failed to delete note'));
    }
  };

  return (
    <div>
      <Form form={form} onFinish={handleAddNote}>
        <Form.Item
          name="content"
          rules={[{ required: true, message: translate('Please enter a note') }]}
        >
          <TextArea rows={4} placeholder={translate('Add a new note...')} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            {translate('Add Note')}
          </Button>
        </Form.Item>
      </Form>

      <List
        dataSource={notes}
        renderItem={(note) => (
          <List.Item
            actions={[
              <Popconfirm
                title={translate('Are you sure you want to delete this note?')}
                onConfirm={() => handleDeleteNote(note._id)}
                okText={translate('Yes')}
                cancelText={translate('No')}
              >
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>,
            ]}
          >
            <List.Item.Meta
              title={note.createdBy?.name}
              description={
                <>
                  <p>{note.content}</p>
                  <small>{new Date(note.createdAt).toLocaleString()}</small>
                </>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
}
