import { useState, useEffect } from 'react';
import { Button, Row, Col, Descriptions, Tag, Divider } from 'antd';
import { PageHeader } from '@ant-design/pro-layout';
import {
  EditOutlined,
  FilePdfOutlined,
  CloseCircleOutlined,
  MailOutlined,
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
    client: {
      name: '',
      email: '',
      phone: '',
      address: '',
    },
    title: '',
    description: '',
    priority: '',
  };

  const [currentErp, setCurrentErp] = useState(selectedItem ?? resetErp);
  const [client, setClient] = useState({});

  useEffect(() => {
    if (currentResult) {
      setCurrentErp(currentResult);
    }
    return () => {
      setCurrentErp(resetErp);
    };
  }, [currentResult]);

  useEffect(() => {
    if (currentErp?.client) {
      setClient(currentErp.client);
    }
  }, [currentErp]);

  return (
    <>
      <PageHeader
        title={translate('Query Details')}
        ghost={false}
        extra={[
          <Button
            key={`${uniqueId()}`}
            onClick={() => {
              navigate(`/${entity}/update/${currentErp._id}`);
            }}
            type="primary"
            icon={<EditOutlined />}
          >
            {translate('Edit')}
          </Button>,
          <Button
            key={`${uniqueId()}`}
            onClick={() => {
              window.open(
                `${DOWNLOAD_BASE_URL}${entity}/${entity}-${currentErp._id}.pdf`,
                '_blank'
              );
            }}
            type="primary"
            icon={<FilePdfOutlined />}
          >
            {translate('Download')}
          </Button>,
          <Button
            key={`${uniqueId()}`}
            onClick={() => {
              dispatch(erp.currentAction({ actionType: 'delete', data: currentErp }));
              navigate(`/${entity}`);
            }}
            type="primary"
            danger
            icon={<CloseCircleOutlined />}
          >
            {translate('Delete')}
          </Button>,
        ]}
      />

      <div className="whiteBox shadow">
        <Descriptions title={translate('Client Information')} bordered>
          <Descriptions.Item label={translate('Name')} span={3}>
            {client.name}
          </Descriptions.Item>
          <Descriptions.Item label={translate('Email')} span={3}>
            {client.email}
          </Descriptions.Item>
          <Descriptions.Item label={translate('Phone')} span={3}>
            {client.phone}
          </Descriptions.Item>
          <Descriptions.Item label={translate('Address')} span={3}>
            {client.address}
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        <Descriptions title={translate('Query Information')} bordered>
          <Descriptions.Item label={translate('Title')} span={3}>
            {currentErp.title}
          </Descriptions.Item>
          <Descriptions.Item label={translate('Description')} span={3}>
            {currentErp.description}
          </Descriptions.Item>
          <Descriptions.Item label={translate('Status')} span={3}>
            <Tag color={currentErp.status ? 'green' : 'red'}>
              {currentErp.status ? 'Open' : 'Closed'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label={translate('Priority')} span={3}>
            <Tag color={currentErp.priority ? 'red' : 'green'}>
              {currentErp.priority ? 'High' : 'Low'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label={translate('Created Date')} span={3}>
            {new Date(currentErp.created).toLocaleDateString()}
          </Descriptions.Item>
        </Descriptions>
      </div>
    </>
  );
}
