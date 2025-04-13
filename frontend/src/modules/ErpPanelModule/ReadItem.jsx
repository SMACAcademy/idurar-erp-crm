import React, { useState, useEffect } from 'react';
import { Divider } from 'antd';

import { Button, Row, Col, Descriptions, Statistic, Tag, message, Card, Space } from 'antd';
import { PageHeader } from '@ant-design/pro-layout';
import {
  EditOutlined,
  FilePdfOutlined,
  CloseCircleOutlined,
  RetweetOutlined,
  MailOutlined,
  FileTextOutlined,
  SyncOutlined,
} from '@ant-design/icons';

import { useSelector, useDispatch } from 'react-redux';
import useLanguage from '@/locale/useLanguage';
import { erp } from '@/redux/erp/actions';
import { request } from '@/request';

import { generate as uniqueId } from 'shortid';

import { selectCurrentItem } from '@/redux/erp/selectors';

import { DOWNLOAD_BASE_URL } from '@/config/serverApiConfig';
import { useMoney, useDate } from '@/settings';
import useMail from '@/hooks/useMail';
import { useNavigate } from 'react-router-dom';
import { generateInvoicePDF } from '@/utils/pdfGenerator';

const Item = ({ item, currentErp }) => {
  const { moneyFormatter } = useMoney();
  return (
    <Row gutter={[12, 0]} key={item._id}>
      <Col className="gutter-row" span={11}>
        <p style={{ marginBottom: 5 }}>
          <strong>{item.itemName}</strong>
        </p>
        <p>{item.description}</p>
        {item.note && (
          <p style={{ marginTop: 5, color: '#666', fontStyle: 'italic' }}>
            <strong>Note:</strong> {item.note}
          </p>
        )}
      </Col>
      <Col className="gutter-row" span={4}>
        <p
          style={{
            textAlign: 'right',
          }}
        >
          {moneyFormatter({ amount: item.price, currency_code: currentErp.currency })}
        </p>
      </Col>
      <Col className="gutter-row" span={4}>
        <p
          style={{
            textAlign: 'right',
          }}
        >
          {item.quantity}
        </p>
      </Col>
      <Col className="gutter-row" span={5}>
        <p
          style={{
            textAlign: 'right',
            fontWeight: '700',
          }}
        >
          {moneyFormatter({ amount: item.total, currency_code: currentErp.currency })}
        </p>
      </Col>
      <Divider dashed style={{ marginTop: 0, marginBottom: 15 }} />
    </Row>
  );
};

export default function ReadItem({ config, selectedItem }) {
  const translate = useLanguage();
  const { entity, ENTITY_NAME } = config;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { moneyFormatter } = useMoney();
  const { send, isLoading: mailInProgress } = useMail({ entity });

  const { result: currentResult } = useSelector(selectCurrentItem);

  const resetErp = {
    status: '',
    client: {
      name: '',
      email: '',
      phone: '',
      address: '',
    },
    subTotal: 0,
    taxTotal: 0,
    taxRate: 0,
    total: 0,
    credit: 0,
    number: 0,
    year: 0,
  };

  const [itemslist, setItemsList] = useState([]);
  const [currentErp, setCurrentErp] = useState(selectedItem ?? resetErp);
  const [client, setClient] = useState({});
  const [summary, setSummary] = useState('');

  useEffect(() => {
    if (currentResult) {
      const { items, invoice, ...others } = currentResult;

      if (items) {
        setItemsList(items);
        setCurrentErp(currentResult);
      } else if (invoice.items) {
        setItemsList(invoice.items);
        setCurrentErp({ ...invoice.items, ...others, ...invoice });
      }
    }
    return () => {
      setItemsList([]);
      setCurrentErp(resetErp);
    };
  }, [currentResult]);

  useEffect(() => {
    if (currentErp?.client) {
      setClient(currentErp.client);
    }
  }, [currentErp]);

  const generateSummary = async () => {
    try {
      setLoading(true);
      const response = await request.post({
        entity: '/gemini/summarize-notes',
        jsonData: {
          notes: currentErp.items?.map(item => item.description) || []
        }
      });
      if (response && response.success) {
        setSummary(response.result);
        message.success('Summary generated successfully');
      } else {
        message.error(response?.message || 'Failed to generate summary');
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      message.error(error?.response?.data?.message || 'Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    try {
      const doc = generateInvoicePDF(currentErp, summary);
      doc.save(`invoice-${currentErp.number}.pdf`);
      message.success('PDF exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      message.error('Failed to export PDF');
    }
  };

  const hasNotes = itemslist.some(item => item.note && item.note.trim().length > 0);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <PageHeader
        onBack={() => {
          dispatch(erp.list({ entity: config.entity }));
        }}
        title={`${ENTITY_NAME} # ${currentErp.number}/${currentErp.year || ''}`}
        ghost={false}
        tags={[
          <span key="status">{currentErp.status && translate(currentErp.status)}</span>,
          currentErp.paymentStatus && (
            <span key="paymentStatus">
              {currentErp.paymentStatus && translate(currentErp.paymentStatus)}
            </span>
          ),
        ]}
        extra={[
          <Button
            key={`${uniqueId()}`}
            onClick={() => {
              dispatch(erp.list({ entity: config.entity }));
            }}
            icon={<CloseCircleOutlined />}
          >
            {translate('Close')}
          </Button>,
          entity === 'invoice' && (
            <Button
              key={`${uniqueId()}`}
              onClick={generateSummary}
              icon={<FileTextOutlined />}
              loading={loading}
              disabled={!hasNotes}
              title={!hasNotes ? 'No notes available for summarization' : ''}
            >
              {translate('Generate Summary')}
            </Button>
          ),
          <Button
            key={`${uniqueId()}`}
            onClick={handleExportPDF}
            icon={<MailOutlined />}
          >
            {translate('Export PDF')}
          </Button>,
          <Button
            key={`${uniqueId()}`}
            loading={mailInProgress}
            onClick={() => {
              send(currentErp._id);
            }}
            icon={<MailOutlined />}
          >
            {translate('Send by Email')}
          </Button>,
          <Button
            key={`${uniqueId()}`}
            onClick={() => {
              dispatch(erp.convert({ entity, id: currentErp._id }));
            }}
            icon={<RetweetOutlined />}
            style={{ display: entity === 'quote' ? 'inline-block' : 'none' }}
          >
            {translate('Convert to Invoice')}
          </Button>,

          <Button
            key={`${uniqueId()}`}
            onClick={() => {
              dispatch(
                erp.currentAction({
                  actionType: 'update',
                  data: currentErp,
                })
              );
              navigate(`/${entity.toLowerCase()}/update/${currentErp._id}`);
            }}
            type="primary"
            icon={<EditOutlined />}
          >
            {translate('Edit')}
          </Button>,
        ]}
      />

      <Space direction="vertical" size="large" style={{ width: '100%', marginTop: '24px' }}>
        {/* AI Summary Card */}
        <Card 
          title="AI Summary" 
          extra={
            <Button 
              type="primary" 
              onClick={generateSummary} 
              loading={loading}
              icon={<SyncOutlined />}
            >
              Generate Summary
            </Button>
          }
          style={{ width: '100%' }}
        >
          {summary ? (
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#f9f9f9', 
              borderRadius: '4px',
              whiteSpace: 'pre-wrap',
              lineHeight: '1.6'
            }}>
              {summary}
            </div>
          ) : (
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#f9f9f9', 
              borderRadius: '4px',
              color: '#999',
              textAlign: 'center'
            }}>
              No summary generated yet. Click the button above to generate one.
            </div>
          )}
        </Card>

        {/* Invoice Details Card */}
        <Card title="Invoice Details" style={{ width: '100%' }}>
          <div className="invoice-body">
            <div style={{ marginBottom: '16px' }}>
              <strong>Invoice Number:</strong> {currentErp.number}
            </div>
            <div style={{ marginBottom: '16px' }}>
              <strong>Date:</strong> {new Date(currentErp.date).toLocaleDateString()}
            </div>
            <Divider />
            <div style={{ marginBottom: '16px' }}>
              <strong>Items:</strong>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {currentErp.items?.map((item, index) => (
                  <li key={index} style={{ marginBottom: '8px', padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                    <div><strong>Description:</strong> {item.description}</div>
                    <div><strong>Quantity:</strong> {item.quantity}</div>
                    <div><strong>Price:</strong> {item.price}</div>
                    <div><strong>Total:</strong> {item.quantity * item.price}</div>
                  </li>
                ))}
              </ul>
            </div>
            <Divider />
            <div style={{ textAlign: 'right', fontSize: '16px' }}>
              <strong>Total Amount:</strong> {currentErp.total}
            </div>
          </div>
        </Card>
      </Space>
    </div>
  );
}
