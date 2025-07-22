import { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import { Form, Input, InputNumber, Button, Select, Divider, Row, Col } from 'antd';

import { PlusOutlined } from '@ant-design/icons';

import { DatePicker } from 'antd';

import AutoCompleteAsync from '@/components/AutoCompleteAsync';

import ItemRow from '@/modules/ErpPanelModule/ItemRow';

import MoneyInputFormItem from '@/components/MoneyInputFormItem';
import { selectFinanceSettings } from '@/redux/settings/selectors';
import { useDate } from '@/settings';
import useLanguage from '@/locale/useLanguage';

import calculate from '@/utils/calculate';
import { useSelector } from 'react-redux';
import SelectAsync from '@/components/SelectAsync';

export default function QueryForm({ subTotal = 0, current = null }) {
  // const { last_query_number } = useSelector(selectFinanceSettings);

  // if (last_query_number === undefined) {
  //   return <></>;
  // }

  return <LoadQueryForm subTotal={subTotal} current={current} />;
}

function LoadQueryForm({ subTotal = 0, current = null }) {
  const translate = useLanguage();
  const { dateFormat } = useDate();
  // const { last_invoice_number } = useSelector(selectFinanceSettings);
  // const [total, setTotal] = useState(0);
  // const [taxRate, setTaxRate] = useState(0);
  // const [taxTotal, setTaxTotal] = useState(0);
  // const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  // const [lastNumber, setLastNumber] = useState(() => last_invoice_number + 1);

  // const handelTaxChange = (value) => {
  //   setTaxRate(value / 100);
  // };

  // useEffect(() => {
  //   if (current) {
  //     const { taxRate = 0, year, number } = current;
  //     setTaxRate(taxRate / 100);
  //     setCurrentYear(year);
  //     setLastNumber(number);
  //   }
  // }, [current]);
  // useEffect(() => {
  //   const currentTotal = calculate.add(calculate.multiply(subTotal, taxRate), subTotal);
  //   setTaxTotal(Number.parseFloat(calculate.multiply(subTotal, taxRate)));
  //   setTotal(Number.parseFloat(currentTotal));
  // }, [subTotal, taxRate]);

  // const addField = useRef(false);

  // useEffect(() => {
  //   addField.current.click();
  // }, []);

  return (
    <>
      <Row gutter={[12, 0]}>
        <Col className="gutter-row" span={24}>
          <Form.Item
            name="customerName"
            label={translate('Customer Name')}
            rules={[
              {
                required: true,
              },
            ]}
          >
            <AutoCompleteAsync
              entity={'client'}
              displayLabels={['name']}
              searchFields={'name'}
              redirectLabel={'Add New Customer'}
              withRedirect
              urlToRedirect={'/customer'}
            />
          </Form.Item>
        </Col>
        <Col className="gutter-row" span={24}>
          <Form.Item
            label={translate('Description')}
            name="description"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col className="gutter-row" span={24}>
          <Form.Item
            name="createdDate"
            label={translate('Created Date')}
            rules={[
              {
                required: true,
                type: 'object',
              },
            ]}
            initialValue={dayjs()}
          >
            <DatePicker style={{ width: '100%' }} format={dateFormat} />
          </Form.Item>
        </Col>
        <Col className="gutter-row" span={24}>
          <Form.Item
            label={translate('status')}
            name="status"
            rules={[
              {
                required: false,
              },
            ]}
            initialValue={'Open'}
          >
           
            <Select
              options={[
                { value: 'Open', label: translate('Open') },
                { value: 'InProgress', label: translate('InProgress') },
                { value: 'Closed', label: translate('Closed') },
              ]}
            ></Select>
          </Form.Item>
        </Col>
        <Col className="gutter-row" span={24}>
          <Form.Item
            label={translate('Resolution')}
            name="resolution"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Input />
          </Form.Item>
        </Col>
      </Row>

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
