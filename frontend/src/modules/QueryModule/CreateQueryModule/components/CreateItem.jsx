import { useState } from 'react';
import { Button, Form, Input, Switch, message } from 'antd';
import { PageHeader } from '@ant-design/pro-layout';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import useLanguage from '@/locale/useLanguage';
import { erp } from '@/redux/erp/actions';

export default function CreateItem({ config }) {
  const translate = useLanguage();
  const { entity } = config;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const onFinish = (values) => {
    dispatch(erp.create({ entity, jsonData: values }));
    navigate(`/${entity}`);
    message.success(translate('Query created successfully'));
  };

  return (
    <>
      <PageHeader
        title={translate('Create New Query')}
        ghost={false}
        extra={[
          <Button
            key={`${1}`}
            onClick={() => {
              navigate(`/${entity}`);
            }}
            type="primary"
          >
            {translate('Back')}
          </Button>,
        ]}
      />

      <div className="whiteBox shadow">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            status: true,
            priority: false,
          }}
        >
          <Form.Item
            name="title"
            label={translate('Title')}
            rules={[
              {
                required: true,
                message: translate('Please enter a title'),
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label={translate('Description')}
            rules={[
              {
                required: true,
                message: translate('Please enter a description'),
              },
            ]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item name="status" label={translate('Status')} valuePropName="checked">
            <Switch
              checkedChildren={<CheckOutlined />}
              unCheckedChildren={<CloseOutlined />}
              style={{
                backgroundColor: '#52c41a',
              }}
            />
          </Form.Item>

          <Form.Item name="priority" label={translate('Priority')} valuePropName="checked">
            <Switch
              checkedChildren={<CheckOutlined />}
              unCheckedChildren={<CloseOutlined />}
              style={{
                backgroundColor: '#ff4d4f',
              }}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              {translate('Create')}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </>
  );
}
