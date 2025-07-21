import { useState, useEffect } from 'react';
import { Divider, Button, Row, Col, Descriptions, Statistic, message } from 'antd';
import { PageHeader } from '@ant-design/pro-layout';
import {
  EditOutlined,
  FilePdfOutlined,
  CloseCircleOutlined,
  RetweetOutlined,
  MailOutlined,
  BulbOutlined,
} from '@ant-design/icons';

import { useSelector, useDispatch } from 'react-redux';
import useLanguage from '@/locale/useLanguage';
import { erp } from '@/redux/erp/actions';
import { generate as uniqueId } from 'shortid';
import { selectCurrentItem } from '@/redux/erp/selectors';
import { DOWNLOAD_BASE_URL } from '@/config/serverApiConfig';
import { useMoney } from '@/settings';
import useMail from '@/hooks/useMail';
import { useNavigate } from 'react-router-dom';

import { generateGeminiSummary } from '@/request/invoice'; // ✅ Make sure this exists

const Item = ({ item, currentErp }) => {
  const { moneyFormatter } = useMoney();
  return (
    <Row gutter={[12, 0]} key={item._id}>
      <Col className="gutter-row" span={11}>
        <p style={{ marginBottom: 5 }}>
          <strong>{item.itemName}</strong>
        </p>
        <p>{item.description}</p>
      </Col>
      <Col className="gutter-row" span={4} style={{ textAlign: 'right' }}>
        {moneyFormatter({ amount: item.price, currency_code: currentErp.currency })}
      </Col>
      <Col className="gutter-row" span={4} style={{ textAlign: 'right' }}>
        {item.quantity}
      </Col>
      <Col className="gutter-row" span={5} style={{ textAlign: 'right', fontWeight: '700' }}>
        {moneyFormatter({ amount: item.total, currency_code: currentErp.currency })}
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
  const { moneyFormatter } = useMoney();
  const { send, isLoading: mailInProgress } = useMail({ entity });
  const { result: currentResult } = useSelector(selectCurrentItem);

  const resetErp = {
    status: '',
    client: { name: '', email: '', phone: '', address: '' },
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
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    if (currentResult) {
      const { items, invoice, summary, ...others } = currentResult;
      if (items) {
        setItemsList(items);
        setCurrentErp(currentResult);
        setSummary(summary || '');
      } else if (invoice?.items) {
        setItemsList(invoice.items);
        setCurrentErp({ ...invoice, ...others });
        setSummary(invoice.summary || '');
      }
    }
    return () => {
      setItemsList([]);
      setCurrentErp(resetErp);
      setSummary('');
    };
  }, [currentResult]);

  useEffect(() => {
    if (currentErp?.client) {
      setClient(currentErp.client);
    }
  }, [currentErp]);

  const handleGenerateSummary = async () => {
    try {
      setLoadingSummary(true);
      const res = await generateGeminiSummary(currentErp._id);
      if (res?.data?.summary) {
        setSummary(res.data.summary);
        message.success('Summary generated successfully.');
      } else {
        message.warning('No summary generated.');
      }
    } catch (err) {
      message.error('Failed to generate summary.');
    } finally {
      setLoadingSummary(false);
    }
  };

  return (
    <>
      <PageHeader
        onBack={() => navigate(`/${entity.toLowerCase()}`)}
        title={`${ENTITY_NAME} # ${currentErp.number}/${currentErp.year || ''}`}
        ghost={false}
        tags={[
          <span key="status">{translate(currentErp.status)}</span>,
          currentErp.paymentStatus && (
            <span key="paymentStatus">{translate(currentErp.paymentStatus)}</span>
          ),
        ]}
        extra={[
          <Button key="close" onClick={() => navigate(`/${entity.toLowerCase()}`)} icon={<CloseCircleOutlined />}>
            {translate('Close')}
          </Button>,
          <Button key="pdf" onClick={() => window.open(`${DOWNLOAD_BASE_URL}${entity}/${entity}-${currentErp._id}.pdf`, '_blank')} icon={<FilePdfOutlined />}>
            {translate('Download PDF')}
          </Button>,
          <Button key="mail" loading={mailInProgress} onClick={() => send(currentErp._id)} icon={<MailOutlined />}>
            {translate('Send by Email')}
          </Button>,
          <Button key="summary" loading={loadingSummary} onClick={handleGenerateSummary} icon={<BulbOutlined />}>
            {translate('Generate Summary')}
          </Button>,
          <Button key="edit" type="primary" icon={<EditOutlined />} onClick={() => {
            dispatch(erp.currentAction({ actionType: 'update', data: currentErp }));
            navigate(`/${entity.toLowerCase()}/update/${currentErp._id}`);
          }}>
            {translate('Edit')}
          </Button>,
        ]}
        style={{ padding: '20px 0px' }}
      >
        <Row>
          <Statistic title="Status" value={currentErp.status} />
          <Statistic
            title={translate('SubTotal')}
            value={moneyFormatter({ amount: currentErp.subTotal, currency_code: currentErp.currency })}
            style={{ margin: '0 32px' }}
          />
          <Statistic
            title={translate('Total')}
            value={moneyFormatter({ amount: currentErp.total, currency_code: currentErp.currency })}
            style={{ margin: '0 32px' }}
          />
          <Statistic
            title={translate('Paid')}
            value={moneyFormatter({ amount: currentErp.credit, currency_code: currentErp.currency })}
            style={{ margin: '0 32px' }}
          />
        </Row>
      </PageHeader>

      <Divider dashed />
      <Descriptions title={`Client : ${client.name}`}>
        <Descriptions.Item label={translate('Address')}>{client.address}</Descriptions.Item>
        <Descriptions.Item label={translate('email')}>{client.email}</Descriptions.Item>
        <Descriptions.Item label={translate('Phone')}>{client.phone}</Descriptions.Item>
      </Descriptions>

      <Divider />
      <Row gutter={[12, 0]}>
        <Col span={11}><strong>{translate('Product')}</strong></Col>
        <Col span={4} style={{ textAlign: 'right' }}><strong>{translate('Price')}</strong></Col>
        <Col span={4} style={{ textAlign: 'right' }}><strong>{translate('Quantity')}</strong></Col>
        <Col span={5} style={{ textAlign: 'right' }}><strong>{translate('Total')}</strong></Col>
        <Divider />
      </Row>

      {itemslist.map(item => (
        <Item key={item._id} item={item} currentErp={currentErp} />
      ))}

      <div style={{ width: '300px', float: 'right', textAlign: 'right', fontWeight: '700' }}>
        <Row gutter={[12, -5]}>
          <Col span={12}>{translate('Sub Total')}:</Col>
          <Col span={12}>{moneyFormatter({ amount: currentErp.subTotal, currency_code: currentErp.currency })}</Col>

          <Col span={12}>{translate('Tax Total')} ({currentErp.taxRate}%) :</Col>
          <Col span={12}>{moneyFormatter({ amount: currentErp.taxTotal, currency_code: currentErp.currency })}</Col>

          <Col span={12}>{translate('Total')}:</Col>
          <Col span={12}>{moneyFormatter({ amount: currentErp.total, currency_code: currentErp.currency })}</Col>
        </Row>
      </div>

      {summary && (
        <>
          <Divider />
          <h3>{translate('Summary')}</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{summary}</p>
        </>
      )}
    </>
  );
}
