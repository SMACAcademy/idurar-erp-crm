import { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import { Form, Input, InputNumber, Button, Select, Divider, Row, Col, Modal } from 'antd';

import { PlusOutlined, PrinterOutlined } from '@ant-design/icons';

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
import request from '@/request/request';

export default function InvoiceForm({ subTotal = 0, current = null }) {
  const { last_invoice_number } = useSelector(selectFinanceSettings);

  if (last_invoice_number === undefined) {
    return <></>;
  }

  return <LoadInvoiceForm subTotal={subTotal} current={current} />;
}

function LoadInvoiceForm({ subTotal = 0, current = null }) {
  const translate = useLanguage();
  const { dateFormat } = useDate();
  const { last_invoice_number } = useSelector(selectFinanceSettings);
  const [total, setTotal] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [taxTotal, setTaxTotal] = useState(0);
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [lastNumber, setLastNumber] = useState(() => last_invoice_number + 1);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summary, setSummary] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isSummaryPdfVisible, setIsSummaryPdfVisible] = useState(false);
  const [form] = Form.useForm();

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

  const handelValuesChange = (changedValues, values) => {
    const items = values['items'];
    let newSubTotal = 0;

    if (items) {
      items.map((item) => {
        if (item) {
          if (item.quantity && item.price) {
            let total = calculate.multiply(item['quantity'], item['price']);
            newSubTotal = calculate.add(newSubTotal, total);
          }
        }
      });
      setSubTotal(newSubTotal);
    }
  };

  useEffect(() => {
    const currentTaxTotal = calculate.multiply(subTotal, taxRate);
    const currentTotal = calculate.add(subTotal, currentTaxTotal);

    setTaxTotal(Number.parseFloat(currentTaxTotal));
    setTotal(Number.parseFloat(currentTotal));
  }, [subTotal, taxRate]);

  const addField = useRef(false);

  useEffect(() => {
    addField.current.click();
  }, []);

  const handleGenerateSummary = async () => {
    try {
      console.log('Button clicked - Starting to generate summary...');
      setIsGeneratingSummary(true);
      const formValues = await form.validateFields();
      console.log('Form values:', formValues);

      // Format items data properly and calculate totals
      const formattedItems =
        formValues.items?.map((item) => {
          const quantity = Number(item.quantity) || 0;
          const price = Number(item.price) || 0;
          const total = calculate.multiply(quantity, price);

          return {
            name: item.itemName || 'Unnamed Item',
            description: item.description || '',
            quantity: quantity,
            price: price,
            total: total,
            notes: item.notes || '',
          };
        }) || [];

      console.log('Making API request to /ai/invoice/summary...');
      const response = await request.post({
        entity: '/ai/invoice/summary',
        jsonData: {
          items: formattedItems,
          date: formValues.date?.format('YYYY-MM-DD') || new Date().toISOString(),
          expiredDate: formValues.expiredDate?.format('YYYY-MM-DD') || new Date().toISOString(),
          number: formValues.number,
          status: formValues.status,
          total: total,
          taxRate: taxRate * 100,
          taxTotal: taxTotal,
          subTotal: subTotal,
          invoiceId: current?._id,
        },
      });
      console.log('API Response:', response);

      if (response.success) {
        setSummary(response.summary);
        Modal.success({
          title: translate('Success'),
          content: response.summary,
        });
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      Modal.error({
        title: translate('Error'),
        content: translate('Failed to generate summary. Please try again.'),
      });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  return (
    <Form form={form} layout="vertical">
      <Row gutter={[12, 0]}>
        <Col className="gutter-row" span={8}>
          <Form.Item
            name="client"
            label={translate('Client')}
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
              redirectLabel={'Add New Client'}
              withRedirect
              urlToRedirect={'/customer'}
            />
          </Form.Item>
        </Col>
        <Col className="gutter-row" span={3}>
          <Form.Item
            label={translate('number')}
            name="number"
            initialValue={lastNumber}
            rules={[
              {
                required: true,
              },
            ]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col className="gutter-row" span={3}>
          <Form.Item
            label={translate('year')}
            name="year"
            initialValue={currentYear}
            rules={[
              {
                required: true,
              },
            ]}
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
        </Col>

        <Col className="gutter-row" span={5}>
          <Form.Item
            label={translate('status')}
            name="status"
            rules={[
              {
                required: false,
              },
            ]}
            initialValue={'draft'}
          >
            <Select
              options={[
                { value: 'draft', label: translate('Draft') },
                { value: 'pending', label: translate('Pending') },
                { value: 'sent', label: translate('Sent') },
              ]}
            ></Select>
          </Form.Item>
        </Col>

        <Col className="gutter-row" span={8}>
          <Form.Item
            name="date"
            label={translate('Date')}
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
        <Col className="gutter-row" span={6}>
          <Form.Item
            name="expiredDate"
            label={translate('Expire Date')}
            rules={[
              {
                required: true,
                type: 'object',
              },
            ]}
            initialValue={dayjs().add(30, 'days')}
          >
            <DatePicker style={{ width: '100%' }} format={dateFormat} />
          </Form.Item>
        </Col>
        <Col className="gutter-row" span={10}>
          <Form.Item label={translate('Note')} name="notes">
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Divider dashed />
      <Row gutter={[12, 12]} style={{ position: 'relative' }}>
        <Col className="gutter-row" span={5}>
          <p>{translate('Item')}</p>
        </Col>
        <Col className="gutter-row" span={7}>
          <p>{translate('Description')}</p>
        </Col>
        <Col className="gutter-row" span={3}>
          <p>{translate('Quantity')}</p>{' '}
        </Col>
        <Col className="gutter-row" span={4}>
          <p>{translate('Price')}</p>
        </Col>
        <Col className="gutter-row" span={3}>
          <p>{translate('Notes')}</p>
        </Col>
        <Col className="gutter-row" span={2}>
          <p>{translate('Total')}</p>
        </Col>
      </Row>
      <Form.List name="items">
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
          <Col className="gutter-row" span={5}>
            <Form.Item>
              <Button
                type="default"
                icon={<PlusOutlined />}
                block
                onClick={handleGenerateSummary}
                loading={isGeneratingSummary}
              >
                {translate('Generate AI Summary')}
              </Button>
            </Form.Item>
          </Col>
          <Col className="gutter-row" span={5}>
            <Form.Item>
              <Button
                type="default"
                icon={<PrinterOutlined />}
                block
                onClick={async () => {
                  try {
                    setIsGeneratingSummary(true);
                    const formValues = await form.validateFields();

                    // Format items data properly
                    const formattedItems =
                      formValues.items?.map((item) => ({
                        name: item.name || 'Unnamed Item',
                        description: item.description || '',
                        quantity: item.quantity || 0,
                        price: item.price || 0,
                        total: item.total || 0,
                        notes: item.notes || '',
                      })) || [];

                    const previewData = {
                      items: formattedItems,
                      date: formValues.date?.format('YYYY-MM-DD') || new Date().toISOString(),
                      expiredDate:
                        formValues.expiredDate?.format('YYYY-MM-DD') || new Date().toISOString(),
                      number: formValues.number,
                      status: formValues.status,
                      total: total,
                      taxRate: taxRate * 100,
                      taxTotal: taxTotal,
                      subTotal: subTotal,
                      _id: current?._id || 'preview',
                    };

                    // Generate AI summary
                    const response = await request.post({
                      entity: '/ai/invoice/summary',
                      jsonData: previewData,
                    });

                    if (response.success) {
                      setSummary(response.summary);
                      setPreviewData(previewData);
                      setIsSummaryPdfVisible(true);
                    }
                  } catch (error) {
                    Modal.error({
                      title: translate('Error'),
                      content: translate('Failed to generate PDF view. Please try again.'),
                    });
                  } finally {
                    setIsGeneratingSummary(false);
                  }
                }}
                loading={isGeneratingSummary}
              >
                {translate('PDF View')}
              </Button>
            </Form.Item>
          </Col>
          <Col className="gutter-row" span={5}>
            <Form.Item>
              <Button
                type="default"
                icon={<PrinterOutlined />}
                block
                onClick={async () => {
                  try {
                    setIsGeneratingSummary(true);
                    const formValues = await form.validateFields();
                    const previewData = {
                      items:
                        formValues.items?.map((item) => ({
                          name: item.name,
                          description: item.description,
                          quantity: item.quantity,
                          price: item.price,
                          notes: item.notes,
                          total: item.total,
                        })) || [],
                      date: formValues.date?.format('YYYY-MM-DD') || new Date().toISOString(),
                      expiredDate:
                        formValues.expiredDate?.format('YYYY-MM-DD') || new Date().toISOString(),
                      number: formValues.number,
                      status: formValues.status,
                      _id: current?._id || 'preview',
                    };

                    // Generate AI summary
                    const response = await request.post({
                      entity: '/ai/invoice/summary',
                      jsonData: {
                        ...previewData,
                        invoiceId: current?._id,
                      },
                    });

                    if (response.success) {
                      setSummary(response.summary);
                      setPreviewData(previewData);
                      setIsPreviewVisible(true);
                    }
                  } catch (error) {
                    Modal.error({
                      title: translate('Error'),
                      content: translate('Failed to generate preview. Please try again.'),
                    });
                  } finally {
                    setIsGeneratingSummary(false);
                  }
                }}
                loading={isGeneratingSummary}
              >
                {translate('Print Preview')}
              </Button>
            </Form.Item>
          </Col>
          <Col className="gutter-row" span={4} offset={5}>
            <p
              style={{
                paddingLeft: '12px',
                paddingTop: '5px',
                margin: 0,
                textAlign: 'right',
              }}
            >
              {translate('Sub Total')} :
            </p>
          </Col>
          <Col className="gutter-row" span={5}>
            <MoneyInputFormItem readOnly value={subTotal} />
          </Col>
        </Row>
        <Row gutter={[12, -5]}>
          <Col className="gutter-row" span={4} offset={15}>
            <Form.Item
              name="taxRate"
              label={translate('Tax Rate')}
              rules={[
                {
                  required: true,
                  message: translate('Please select a tax rate'),
                },
              ]}
            >
              <Select
                value={taxRate * 100}
                onChange={handelTaxChange}
                placeholder={translate('Select Tax Rate')}
                style={{ width: '100%' }}
              >
                <Select.Option value={0}>No Tax (0%)</Select.Option>
                <Select.Option value={5}>VAT 5%</Select.Option>
                <Select.Option value={10}>VAT 10%</Select.Option>
                <Select.Option value={15}>VAT 15%</Select.Option>
                <Select.Option value={18}>VAT 18%</Select.Option>
                <Select.Option value={20}>VAT 20%</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col className="gutter-row" span={5}>
            <MoneyInputFormItem readOnly value={taxTotal} />
          </Col>
        </Row>
        <Row gutter={[12, -5]}>
          <Col className="gutter-row" span={4} offset={15}>
            <p
              style={{
                paddingLeft: '12px',
                paddingTop: '5px',
                margin: 0,
                textAlign: 'right',
              }}
            >
              {translate('Total')} :
            </p>
          </Col>
          <Col className="gutter-row" span={5}>
            <MoneyInputFormItem readOnly value={total} />
          </Col>
        </Row>
      </div>
      <Modal
        title={translate('Invoice Preview')}
        open={isPreviewVisible}
        onCancel={() => setIsPreviewVisible(false)}
        width="80%"
        footer={[
          <Button key="back" onClick={() => setIsPreviewVisible(false)}>
            {translate('Close')}
          </Button>,
          <Button
            key="next"
            type="primary"
            onClick={() => {
              setIsPreviewVisible(false);
              setIsSummaryPdfVisible(true);
            }}
          >
            {translate('Next')}
          </Button>,
        ]}
        style={{ top: 20 }}
      >
        <div
          style={{
            width: '210mm',
            minHeight: '297mm',
            margin: '0 auto',
            padding: '20mm',
            backgroundColor: 'white',
            boxShadow: '0 0 10px rgba(0,0,0,0.1)',
            position: 'relative',
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0 }}>INVOICE</h2>
            <p style={{ margin: '5px 0' }}>
              #{previewData?.number}/{previewData?.year}
            </p>
          </div>

          {/* Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Item</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Description</th>
                <th style={{ textAlign: 'right', padding: '8px' }}>Quantity</th>
                <th style={{ textAlign: 'right', padding: '8px' }}>Price</th>
                <th style={{ textAlign: 'right', padding: '8px' }}>Notes</th>
                <th style={{ textAlign: 'right', padding: '8px' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {previewData?.items?.map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '8px' }}>{item.name}</td>
                  <td style={{ padding: '8px' }}>{item.description}</td>
                  <td style={{ textAlign: 'right', padding: '8px' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right', padding: '8px' }}>{item.price}</td>
                  <td style={{ textAlign: 'right', padding: '8px' }}>{item.notes}</td>
                  <td style={{ textAlign: 'right', padding: '8px' }}>{item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Invoice Details */}
          <div style={{ marginBottom: '20px' }}>
            <p style={{ margin: '5px 0' }}>Invoice Number: {previewData?.number}</p>
            <p style={{ margin: '5px 0' }}>Status: {previewData?.status}</p>
            <p style={{ margin: '5px 0' }}>Date: {previewData?.date}</p>
            <p style={{ margin: '5px 0' }}>Due Date: {previewData?.expiredDate}</p>
          </div>

          {/* AI Summary */}
          <div style={{ marginTop: '20px', paddingTop: '10px', borderTop: '1px solid #ddd' }}>
            <h4 style={{ margin: '0 0 10px 0' }}>AI Summary:</h4>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{summary}</p>
          </div>

          {/* Notes */}
          {previewData?.notes && (
            <div style={{ marginTop: '20px', paddingTop: '10px', borderTop: '1px solid #ddd' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>Notes:</h4>
              <p style={{ margin: 0 }}>{previewData.notes}</p>
            </div>
          )}
        </div>
      </Modal>
      <Modal
        title={translate('AI Summary PDF')}
        open={isSummaryPdfVisible}
        onCancel={() => setIsSummaryPdfVisible(false)}
        width="80%"
        footer={[
          <Button
            key="back"
            onClick={() => {
              setIsSummaryPdfVisible(false);
              setIsPreviewVisible(true);
            }}
          >
            {translate('Back')}
          </Button>,
        ]}
        style={{ top: 20 }}
      >
        <div
          style={{
            width: '210mm',
            minHeight: '297mm',
            margin: '0 auto',
            padding: '20mm',
            backgroundColor: 'white',
            boxShadow: '0 0 10px rgba(0,0,0,0.1)',
            position: 'relative',
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0 }}>INVOICE SUMMARY</h2>
            <p style={{ margin: '5px 0' }}>
              #{previewData?.number}/{previewData?.year}
            </p>
          </div>

          {/* AI Summary */}
          <div
            style={{
              marginTop: '20px',
              padding: '20px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: '#f9f9f9',
            }}
          >
            <h4 style={{ margin: '0 0 10px 0' }}>AI Generated Summary:</h4>
            <p
              style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                lineHeight: '1.6',
                fontSize: '14px',
              }}
            >
              {summary}
            </p>
          </div>

          {/* Footer */}
          <div
            style={{
              position: 'absolute',
              bottom: '20mm',
              width: '100%',
              textAlign: 'center',
              fontSize: '12px',
              color: '#666',
            }}
          >
            <p>Generated by AI Assistant</p>
          </div>
        </div>
      </Modal>
    </Form>
  );
}
