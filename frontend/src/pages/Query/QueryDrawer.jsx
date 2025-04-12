import React from 'react';
import { Drawer, Form, Input, Select, Button, Space, message } from 'antd';
import useLanguage from '@/locale/useLanguage';

const { TextArea } = Input;
const { Option } = Select;

const QueryDrawer = ({ visible, onClose, onSubmit, initialValues, mode }) => {
  const translate = useLanguage();
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
      form.resetFields();
      onClose();
    } catch (error) {
      message.error(translate('form_validation_error'));
    }
  };

  return (
    <Drawer
      title={mode === 'create' ? translate('add_new_query') : translate('edit_query')}
      width={720}
      onClose={onClose}
      visible={visible}
      bodyStyle={{ paddingBottom: 80 }}
      extra={
        <Space>
          <Button onClick={onClose}>{translate('cancel')}</Button>
          <Button onClick={handleSubmit} type="primary">
            {mode === 'create' ? translate('create') : translate('update')}
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
      >
        <Form.Item
          name="customerName"
          label={translate('customer_name')}
          rules={[{ required: true, message: translate('please_enter_customer_name') }]}
        >
          <Input placeholder={translate('enter_customer_name')} />
        </Form.Item>

        <Form.Item
          name="description"
          label={translate('description')}
          rules={[{ required: true, message: translate('please_enter_description') }]}
        >
          <TextArea rows={4} placeholder={translate('enter_description')} />
        </Form.Item>

        <Form.Item
          name="status"
          label={translate('status')}
          rules={[{ required: true, message: translate('please_select_status') }]}
        >
          <Select placeholder={translate('select_status')}>
            <Option value="open">{translate('open')}</Option>
            <Option value="in_progress">{translate('in_progress')}</Option>
            <Option value="resolved">{translate('resolved')}</Option>
            <Option value="closed">{translate('closed')}</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="resolution"
          label={translate('resolution')}
        >
          <TextArea rows={4} placeholder={translate('enter_resolution')} />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default QueryDrawer; 