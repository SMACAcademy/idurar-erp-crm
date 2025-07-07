import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { Button, Row, Col, Descriptions, Statistic, Tag } from 'antd';
import { PageHeader } from '@ant-design/pro-layout';
import { EditOutlined, CloseCircleOutlined, FilePdfOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import useLanguage from '@/locale/useLanguage';
import { erp } from '@/redux/erp/actions';
import { useNavigate } from 'react-router-dom';
import { tagColor } from '@/utils/statusTagColor';

export default function ReadQueryItem({ config, selectedItem }) {
  const translate = useLanguage();
  const { entity, ENTITY_NAME } = config;
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [currentQuery, setCurrentQuery] = useState(selectedItem);

  useEffect(() => {
    if (selectedItem) {
      setCurrentQuery(selectedItem);
    }
  }, [selectedItem]);

  return (
    <>
      <PageHeader
        onBack={() => {
          navigate(`/${entity.toLowerCase()}`);
        }}
        title={`${ENTITY_NAME} : ${currentQuery.description}`}
        ghost={false}
        tags={[
          <Tag color={tagColor(currentQuery.status)} key="status">
            {translate(currentQuery.status)}
          </Tag>,
        ]}
        extra={[
          <Button
            key="close"
            onClick={() => {
              navigate(`/${entity.toLowerCase()}`);
            }}
            icon={<CloseCircleOutlined />}
          >
            {translate('Close')}
          </Button>,
          <Button
            key="pdf"
            onClick={() => window.open(`/download/${entity}/${currentQuery._id}`, '_blank')}
            icon={<FilePdfOutlined />}
          >
            {translate('Download PDF')}
          </Button>,
          <Button
            key="edit"
            onClick={() => {
              dispatch(
                erp.currentAction({
                  actionType: 'update',
                  data: currentQuery,
                })
              );
              navigate(`/${entity.toLowerCase()}/update/${currentQuery._id}`);
            }}
            type="primary"
            icon={<EditOutlined />}
          >
            {translate('Edit')}
          </Button>,
        ]}
        style={{
          padding: '20px 0px',
        }}
      >
        <Row>
          <Statistic title={translate('Status')} value={translate(currentQuery.status)} />
          <Statistic
            title={translate('Customer')}
            value={currentQuery.customer ? currentQuery.customer.name : 'N/A'}
            style={{
              margin: '0 32px',
            }}
          />
          <Statistic
            title={translate('Created Date')}
            value={dayjs(currentQuery.createdAt).format('DD/MM/YYYY')}
            style={{
              margin: '0 32px',
            }}
          />
        </Row>
      </PageHeader>
      <Descriptions title={translate('Details')} bordered>
        <Descriptions.Item label={translate('Description')}>
          {currentQuery.description}
        </Descriptions.Item>
        <Descriptions.Item label={translate('Resolution')}>
          {currentQuery.resolution || 'N/A'}
        </Descriptions.Item>
      </Descriptions>
    </>
  );
}
