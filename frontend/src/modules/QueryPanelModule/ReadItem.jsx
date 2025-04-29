import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@ant-design/pro-layout';
import { Descriptions, Button, Divider, Tag } from 'antd';
import { EditOutlined, CloseCircleOutlined } from '@ant-design/icons';

import { selectCurrentItem } from '@/redux/erp/selectors';
import { query } from '@/redux/query/actions';
import useLanguage from '@/locale/useLanguage';

export default function ReadQueryItem({ config }) {
  const translate = useLanguage();
  const { entity, ENTITY_NAME } = config;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  const { result: currentResult } = useSelector(selectCurrentItem);


  if (!currentResult) return null;

  return (
    <>
      <PageHeader
        onBack={() => navigate(`/${entity.toLowerCase()}`)}
        title={`View`}
        ghost={false}
        tags={[
          currentResult.status && <Tag color="blue" key="status">{translate(currentResult.status)}</Tag>,
        ]}
        extra={[
          <Button
            key="close"
            onClick={() => navigate(`/${entity.toLowerCase()}`)}
            icon={<CloseCircleOutlined />}
          >
            {translate('Close')}
          </Button>,
          <Button
            key="edit"
            onClick={() => {
              dispatch(
                query.currentAction({
                  actionType: 'update',
                  data: currentResult,
                })
              );
              navigate(`/${entity.toLowerCase()}/update/${currentResult._id}`);
            }}
            type="primary"
            icon={<EditOutlined />}
          >
            {translate('Edit')}
          </Button>,
        ]}
        style={{ padding: '20px 0' }}
      />

      <Divider dashed />

      <Descriptions title={translate('Query Details')} bordered column={1}>
        {currentResult.title && (
          <Descriptions.Item label={translate('Title')}>
            {currentResult.title}
          </Descriptions.Item>
        )}

        {currentResult.description && (
          <Descriptions.Item label={translate('Description')}>
            {currentResult.description}
          </Descriptions.Item>
        )}

        {currentResult.status && (
          <Descriptions.Item label={translate('Status')}>
            {translate(currentResult.status)}
          </Descriptions.Item>
        )}

        {currentResult.createdDate && (
          <Descriptions.Item label={translate('Created Date')}>
            {new Date(currentResult.createdDate).toLocaleString()}
          </Descriptions.Item>
        )}

        {Array.isArray(currentResult.notes) && currentResult.notes.length > 0 && (
          <Descriptions.Item label={translate('Notes')}>
            <ul style={{ paddingLeft: '20px' }}>
              {currentResult.notes.map((noteObj, index) => {
                const text = noteObj?.note?.text || noteObj?.text || '';
                const date = noteObj?.note?.createdAt || noteObj?.createdAt;
                return (
                  <li key={noteObj._id || index}>
                    {text} {date ? `— ${new Date(date).toLocaleString()}` : ''}
                  </li>
                );
              })}
            </ul>
          </Descriptions.Item>
        )}
      </Descriptions>

    </>
  );
}
