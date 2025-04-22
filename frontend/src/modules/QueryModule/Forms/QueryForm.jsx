import { Button, Col, Divider, Form, Input, InputNumber, Row, Select } from 'antd';
import { useEffect, useRef, useState } from 'react';

import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';

import AutoCompleteAsync from '@/components/AutoCompleteAsync';

import useLanguage from '@/locale/useLanguage';
import { selectFinanceSettings } from '@/redux/settings/selectors';
import { useDate } from '@/settings';

import calculate from '@/utils/calculate';
import { useSelector } from 'react-redux';

export default function QueryForm({ subTotal = 0, current = null }) {
  const { last_invoice_number } = useSelector(selectFinanceSettings);

  if (last_invoice_number === undefined) {
    return <></>;
  }

  return <LoadQueryForm subTotal={subTotal} current={current} />;
}

function LoadQueryForm({ subTotal = 0, current = null }) {
  const translate = useLanguage();
  const { dateFormat } = useDate();
  const { last_invoice_number } = useSelector(selectFinanceSettings);
  const [total, setTotal] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [taxTotal, setTaxTotal] = useState(0);
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [lastNumber, setLastNumber] = useState(() => last_invoice_number + 1);

  const handelTaxChange = (value) => {
    setTaxRate(value / 100);
  };

  useEffect(() => {
    if (current) {
      const { taxRate = 0, year, number } = current;
      setTaxRate(taxRate / 100);
      setCurrentYear(year);
      setLastNumber(number);
    }
  }, [current]);
  useEffect(() => {
    const currentTotal = calculate.add(calculate.multiply(subTotal, taxRate), subTotal);
    setTaxTotal(Number.parseFloat(calculate.multiply(subTotal, taxRate)));
    setTotal(Number.parseFloat(currentTotal));
  }, [subTotal, taxRate]);

  const addField = useRef(false);

  useEffect(() => {
    addField.current.click();
  }, []);

  return (
    <>
      <Row gutter={[12, 12]}>
        <Col className="gutter-row" xs={24} sm={12} md={8}>
          <Form.Item name="client" label={translate('Client')} rules={[{ required: true }]}>
            <AutoCompleteAsync
              entity="client"
              displayLabels={['name']}
              searchFields="name"
              redirectLabel="Add New Client"
              withRedirect
              urlToRedirect="/customer"
            />
          </Form.Item>
        </Col>

        <Col className="gutter-row" xs={24} sm={12} md={3}>
          <Form.Item
            label={translate('number')}
            name="number"
            initialValue={lastNumber}
            rules={[{ required: true }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Col>

        <Col className="gutter-row" xs={24} sm={12} md={5}>
          <Form.Item label={translate('status')} name="status" initialValue="Open">
            <Select
              options={[
                { value: 'Open', label: translate('Open') },
                { value: 'InProgress', label: translate('InProgress') },
                { value: 'Closed', label: translate('Closed') },
              ]}
            />
          </Form.Item>
        </Col>
        <Col className="gutter-row" xs={24} sm={12} md={12}>
          <Form.Item
            label={translate('Description')}
            name="description"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col className="gutter-row" xs={24} sm={12} md={12}>
          <Form.Item label={translate('Resolution')} name="resolution">
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Divider dashed />
      <Row gutter={[12, 12]} style={{ position: 'relative' }}>
        <Col className="gutter-row" span={7}>
          <p>{translate('Notes')}</p>
        </Col>
      </Row>
      <Form.List name="notes">
        {(fields, { add, remove }) => (
          <>
            {fields.map((field) => (
              <ItemRow key={field.key} remove={remove} field={field} current={current}></ItemRow>
            ))}
            <Form.Item>
              <Button
                type="dashed"
                onClick={() => add()}
                block
                icon={<PlusOutlined />}
                ref={addField}
              >
                {translate('Add field')}
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>
      <Divider dashed />
      <div style={{ position: 'relative', width: ' 100%', float: 'right' }}>
        <Row gutter={[12, -5]}>
          <Col className="gutter-row" span={5}>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<PlusOutlined />} block>
                {translate('Save')}
              </Button>
            </Form.Item>
          </Col>
        </Row>
      </div>
    </>
  );
}
function ItemRow({ field, remove, current = null }) {
  return (
    <Row gutter={[12, 12]} style={{ position: 'relative' }}>
      <Form.Item
        name={[field.name, 'text']}
        rules={[
          {
            pattern: /^(?!\s*$)[\s\S]+$/,
            message: 'Item Name must contain alphanumeric or special characters',
          },
        ]}
        style={{ width: '100%' }}
      >
        <Input placeholder="Text" />
      </Form.Item>

      <div style={{ position: 'absolute', right: '-20px', top: '5px' }}>
        <DeleteOutlined onClick={() => remove(field.name)} />
      </div>
    </Row>
  );
}
