import { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Row, Col, Button, Spin } from 'antd';

import { DeleteOutlined } from '@ant-design/icons';
import { useMoney, useDate } from '@/settings';
import calculate from '@/utils/calculate';
import { BulbOutlined } from '@ant-design/icons';
import { erp } from '@/redux/erp/actions';
import { useDispatch } from 'react-redux';

export default function ItemRow({ field, remove, current = null, form }) {
  const [totalState, setTotal] = useState(undefined);
  const [price, setPrice] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [note, setNote] = useState('');
  const dispatch = useDispatch();
  const [loadingSummary, setLoadingSummary] = useState(false);

  const money = useMoney();
  const updateQt = (value) => {
    setQuantity(value);
  };
  const updatePrice = (value) => {
    setPrice(value);
  };
  const handleSummarize = async () => {
    const currentNote = form.getFieldValue(['items', field.name, 'note']); // get note from form
    if (!currentNote) return;
    setLoadingSummary(true);
    try {
      await dispatch(erp.generateSummary({ entity: 'invoice', jsonData: { note: currentNote } })).then((summaryResponse) => {
        const summaryText = summaryResponse.data;
        if (summaryText) {
          const existingItems = form.getFieldValue('items') || [];
          const updatedItems = existingItems.map((item, index) =>
            index === field.name
              ? { ...item, note: summaryText }
              : item
          );

          form.setFieldsValue({
            items: updatedItems,
          });
        } else {
          console.warn('No summary returned from API');
        }
      });;

    } catch (err) {
      console.error('Error generating summary:', err);
    } finally {
      setLoadingSummary(false);
    }
  };
  useEffect(() => {
    if (current) {
      // When it accesses the /payment/ endpoint,
      // it receives an invoice.item instead of just item
      // and breaks the code, but now we can check if items exists,
      // and if it doesn't we can access invoice.items.

      const { items, invoice } = current;

      if (invoice) {
        const item = invoice[field.fieldKey];

        if (item) {
          setQuantity(item.quantity);
          setPrice(item.price);
        }
      } else {
        const item = items[field.fieldKey];

        if (item) {
          setQuantity(item.quantity);
          setPrice(item.price);
        }
      }
    }
  }, [current]);

  useEffect(() => {
    const currentTotal = calculate.multiply(price, quantity);

    setTotal(currentTotal);
  }, [price, quantity]);

  return (
    <Row gutter={[12, 12]} style={{ position: 'relative' }}>
      <Col className="gutter-row" span={5}>
        <Form.Item
          name={[field.name, 'itemName']}
          rules={[
            {
              required: true,
              message: 'Missing itemName name',
            },
            {
              pattern: /^(?!\s*$)[\s\S]+$/, // Regular expression to allow spaces, alphanumeric, and special characters, but not just spaces
              message: 'Item Name must contain alphanumeric or special characters',
            },
          ]}
        >
          <Input placeholder="Item Name" />
        </Form.Item>
      </Col>
      <Col className="gutter-row" span={7}>
        <Form.Item name={[field.name, 'description']}>
          <Input placeholder="description Name" />
        </Form.Item>
      </Col>

      <Col className="gutter-row" span={3}>
        <Form.Item name={[field.name, 'quantity']} rules={[{ required: true }]}>
          <InputNumber style={{ width: '100%' }} min={0} onChange={updateQt} />
        </Form.Item>
      </Col>
      <Col className="gutter-row" span={4}>
        <Form.Item name={[field.name, 'price']} rules={[{ required: true }]}>
          <InputNumber
            className="moneyInput"
            onChange={updatePrice}
            min={0}
            controls={false}
            addonAfter={money.currency_position === 'after' ? money.currency_symbol : undefined}
            addonBefore={money.currency_position === 'before' ? money.currency_symbol : undefined}
          />
        </Form.Item>
      </Col>
      <Col className="gutter-row" span={5}>
        <Form.Item name={[field.name, 'total']}>
          <Form.Item>
            <InputNumber
              readOnly
              className="moneyInput"
              value={totalState}
              min={0}
              controls={false}
              addonAfter={money.currency_position === 'after' ? money.currency_symbol : undefined}
              addonBefore={money.currency_position === 'before' ? money.currency_symbol : undefined}
              formatter={(value) =>
                money.amountFormatter({ amount: value, currency_code: money.currency_code })
              }
            />
          </Form.Item>
        </Form.Item>
      </Col>
      <Col className="gutter-row" span={20}>
        <Form.Item name={[field.name, 'note']}>
          <Input
            placeholder="Note"
            suffix={
              loadingSummary ? (
                <Spin size="small" />
              ) : (
                <BulbOutlined
                  onClick={handleSummarize}
                  style={{
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '16px',
                    padding: '4px',
                    borderRadius: '4px',
                    backgroundColor: '#339393',
                  }}
                  title="Summarize Note with AI"
                />
              )
            }
          />
        </Form.Item>
      </Col>
      <div style={{ position: 'absolute', right: '-20px', top: ' 5px' }}>
        <DeleteOutlined onClick={() => remove(field.name)} />
      </div>
    </Row>
  );
}
