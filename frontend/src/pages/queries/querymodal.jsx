import React, { useEffect } from 'react';
import { Modal, Form, Input, Button } from 'antd';

const QueryModal = ({ open, onClose, query, onUpdate }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (query) {
      form.setFieldsValue(query);
    }
  }, [query, form]);

  const handleSubmit = (values) => {
    onUpdate(query._id, values);
    onClose();
  };

  return (
    <Modal
      open={open}
      title={`Query Details - ${query?.customername}`}
      onCancel={onClose}
      footer={null}
      centered
      width={600}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item label="Customer Name">
          <Input value={query?.customername} disabled />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <Input.TextArea rows={3}  />
        </Form.Item>

        <Form.Item name="resolution" label="Resolution">
          <Input.TextArea rows={2}  />
        </Form.Item>

        <Form.Item name="status" label="Status">
          <Input />
        </Form.Item>

        <Form.Item label="Created At">
          <Input  value={new Date(query?.createdAt).toLocaleString()} disabled />
        </Form.Item>

        <Form.Item label="Updated At">
          <Input  value={new Date(query?.updatedAt).toLocaleString()} disabled />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Update
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default QueryModal;
