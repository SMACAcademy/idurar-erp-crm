import React from 'react';
import { Form, Input, Select, Button } from 'antd';
import useLanguage from '@/locale/useLanguage';
import SelectAsync from '@/components/SelectAsync';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { message } from 'antd';

export default function QueryForm({ isUpdateForm = false, initialValues = {}, onSubmit }) {
  const translate = useLanguage();
  const { TextArea } = Input;
  const [form] = Form.useForm();
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  React.useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    }
  }, [initialValues, form]);

  const handleSubmit = async (values) => {
    try {
      // Get the latest auth state
      const storedAuth = localStorage.getItem('auth');
      let currentToken = null;

      if (storedAuth) {
        try {
          const parsedAuth = JSON.parse(storedAuth);
          if (parsedAuth.current?.token) {
            currentToken = parsedAuth.current.token;
          }
        } catch (error) {
          console.error('Error parsing stored auth:', error);
        }
      }

      if (!currentToken) {
        messageApi.error('Authentication required. Please login first.');
        return;
      }

      // Log the form values
      console.log('Form values:', values);

      // Get first word of description for title
      const title = values.title || values.description.split(' ')[0];
      if (!title) {
        messageApi.error('Please enter a valid title');
        return;
      }

      // Ensure we have a valid description
      if (!values.description) {
        messageApi.error('Please enter a description');
        return;
      }

      // Ensure we have a valid client
      if (!values.client) {
        messageApi.error('Please select a client');
        return;
      }

      // Prepare the data exactly as the backend expects
      const apiData = {
        title: title,
        description: values.description,
        customer: values.client,
        status: values.status || 'pending',
        priority: values.priority || 'medium',
        createdBy: user?._id || '507f1f77bcf86cd799439011',
      };

      // Log the exact data being sent
      console.log('Submitting query with data:', JSON.stringify(apiData, null, 2));

      if (onSubmit) {
        onSubmit(apiData);
        return;
      }

      const response = await axios({
        method: 'post',
        url: 'http://localhost:8888/api/query',
        data: apiData,
        headers: {
          Authorization: `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data && response.data.success) {
        messageApi.success('Query created successfully');
        navigate('/query');
      }
    } catch (error) {
      console.error('Error submitting query:', error);
      console.error('Error response:', error.response?.data);
      console.error('Request data:', error.config?.data);
      const errorMessage =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        'An error occurred while submitting the query';

      messageApi.error(errorMessage.toString());
    }
  };

  return (
    <>
      {contextHolder}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          status: 'pending',
          priority: 'medium',
          ...initialValues,
        }}
      >
        <Form.Item
          name="title"
          label={translate('Title')}
          rules={[{ required: true, message: 'Please enter a title' }]}
        >
          <Input placeholder="Enter query title" />
        </Form.Item>

        <Form.Item
          name="client"
          label={translate('Client')}
          rules={[{ required: true, message: 'Please select a client' }]}
        >
          <SelectAsync
            entity="client"
            displayLabels={['name']}
            outputValue="_id"
            withRedirect={false}
          />
        </Form.Item>

        <Form.Item
          name="description"
          label={translate('Description')}
          rules={[{ required: true, message: 'Please enter a description' }]}
        >
          <TextArea rows={4} placeholder="Enter query description" />
        </Form.Item>

        <Form.Item name="status" label={translate('Status')}>
          <Select>
            <Select.Option value="pending">{translate('Pending')}</Select.Option>
            <Select.Option value="in_progress">{translate('In Progress')}</Select.Option>
            <Select.Option value="resolved">{translate('Resolved')}</Select.Option>
            <Select.Option value="closed">{translate('Closed')}</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="priority" label={translate('Priority')}>
          <Select>
            <Select.Option value="high">{translate('High')}</Select.Option>
            <Select.Option value="medium">{translate('Medium')}</Select.Option>
            <Select.Option value="low">{translate('Low')}</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            {isUpdateForm ? translate('Update Query') : translate('Add Query')}
          </Button>
        </Form.Item>
      </Form>
    </>
  );
}
