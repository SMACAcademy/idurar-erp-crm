import React, { useState, useEffect } from 'react';
import { Form, Input, Button, DatePicker, Select, message, Row, Col, InputNumber } from 'antd';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import axios from 'axios';
import { API_BASE_URL } from '@/config/constants';
import { DeleteOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

const ItemRow = ({ field, remove }) => {
  const form = Form.useFormInstance();

  const calculateTotal = (quantity, price) => {
    return quantity * price;
  };

  const handleQuantityChange = (value) => {
    const price = form.getFieldValue(['items', field.name, 'price']) || 0;
    form.setFieldValue(['items', field.name, 'total'], calculateTotal(value, price));
  };

  const handlePriceChange = (value) => {
    const quantity = form.getFieldValue(['items', field.name, 'quantity']) || 0;
    form.setFieldValue(['items', field.name, 'total'], calculateTotal(quantity, value));
  };

  return (
    <div key={field.key} style={{ marginBottom: 16, border: '1px solid #d9d9d9', padding: 16, borderRadius: 4 }}>
      <Row gutter={16}>
        <Col xs={24} sm={12} md={8} lg={6} xl={6}>
          <Form.Item
            name={[field.name, 'itemName']}
            label="Item Name"
            rules={[{ required: true, message: 'Please enter item name' }]}
          >
            <Input placeholder="Enter item name" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6} xl={6}>
          <Form.Item
            name={[field.name, 'description']}
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input placeholder="Enter description" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6} xl={6}>
          <Form.Item
            name={[field.name, 'note']}
            label="Note"
          >
            <TextArea rows={2} placeholder="Enter note (optional)" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4} xl={4}>
          <Form.Item
            name={[field.name, 'quantity']}
            label="Quantity"
            rules={[{ required: true, message: 'Please enter quantity' }]}
          >
            <InputNumber
              min={1}
              style={{ width: '100%' }}
              onChange={handleQuantityChange}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4} xl={4}>
          <Form.Item
            name={[field.name, 'price']}
            label="Price"
            rules={[{ required: true, message: 'Please enter price' }]}
          >
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              onChange={handlePriceChange}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4} xl={4}>
          <Form.Item
            name={[field.name, 'total']}
            label="Total"
          >
            <InputNumber
              disabled
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={24} md={24} lg={24} xl={24} style={{ textAlign: 'right' }}>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => remove(field.name)}
          >
            Remove Item
          </Button>
        </Col>
      </Row>
    </div>
  );
};

const CreateItem = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/client/search`, {
        params: {
          q: '',
          fields: 'name'
        }
      });
      if (response.data.success) {
        setClients(response.data.result);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      message.error('Failed to fetch clients');
    }
  };

  const onFinish = async (values) => {
    if (!values.client || !values.date || !values.expiredDate || !values.items || values.items.length === 0) {
      message.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/invoice/create`, {
        ...values,
        date: moment(values.date).format('YYYY-MM-DD'),
        expiredDate: moment(values.expiredDate).format('YYYY-MM-DD'),
        status: 'draft',
        paymentStatus: 'unpaid'
      });

      if (response.data.success) {
        message.success('Invoice created successfully');
        navigate('/invoice');
      } else {
        message.error(response.data.message || 'Failed to create invoice');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      message.error(error.response?.data?.message || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ marginBottom: '24px' }}>Create New Invoice</h1>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          items: [{
            itemName: '',
            description: '',
            note: '',
            quantity: 1,
            price: 0,
            total: 0
          }]
        }}
      >
        <Form.Item
          name="client"
          label="Client"
          rules={[{ required: true, message: 'Please select a client' }]}
        >
          <Select
            showSearch
            placeholder="Select a client"
            optionFilterProp="children"
            loading={loading}
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {clients.map(client => (
              <Option key={client._id} value={client._id}>
                {client.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="date"
          label="Date"
          rules={[{ required: true, message: 'Please select a date' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="expiredDate"
          label="Expiry Date"
          rules={[{ required: true, message: 'Please select an expiry date' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.List name="items">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field, index) => (
                <ItemRow key={field.key} field={field} remove={remove} />
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add()} block>
                  Add Item
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Create Invoice
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default CreateItem; 