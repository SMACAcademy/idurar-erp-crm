import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Tag, Button, Space, List, Comment, Form, Input, message, Popconfirm } from 'antd';
import { UserOutlined, DeleteOutlined } from '@ant-design/icons';
import { crudAction } from '@/redux/crud/actions';
import { selectQuery } from '@/redux/crud/selectors';
import QueryForm from './QueryForm';

const QueryDetail = ({ queryId }) => {
  const dispatch = useDispatch();
  const { current: query } = useSelector(selectQuery);
  const [comments, setComments] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    if (queryId) {
      dispatch(crudAction.read({ entity: 'query', id: queryId }));
    }
  }, [queryId, dispatch]);

  const handleCommentSubmit = (values) => {
    const newComment = {
      id: Date.now(),
      content: values.comment,
      author: 'Current User',
      datetime: new Date().toISOString(),
    };
    setComments([...comments, newComment]);
    form.resetFields();
  };

  const handleDeleteComment = (commentId) => {
    setComments(comments.filter((comment) => comment.id !== commentId));
  };

  if (!query) return null;

  return (
    <Card>
      <div style={{ marginBottom: 24 }}>
        <h2>{query.title}</h2>
        <Tag color={query.status === 'open' ? 'green' : 'red'}>{query.status}</Tag>
        <p>{query.description}</p>
      </div>

      <List
        className="comment-list"
        header={`${comments.length} replies`}
        itemLayout="horizontal"
        dataSource={comments}
        renderItem={(item) => (
          <li>
            <Comment
              actions={[
                <Popconfirm
                  title="Are you sure you want to delete this comment?"
                  onConfirm={() => handleDeleteComment(item.id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button type="text" icon={<DeleteOutlined />} />
                </Popconfirm>,
              ]}
              author={item.author}
              avatar={<UserOutlined />}
              content={item.content}
              datetime={item.datetime}
            />
          </li>
        )}
      />

      <Form form={form} onFinish={handleCommentSubmit}>
        <Form.Item
          name="comment"
          rules={[{ required: true, message: 'Please input your comment!' }]}
        >
          <Input.TextArea rows={4} placeholder="Add a comment..." />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Add Comment
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default QueryDetail;
