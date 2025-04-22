import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ErpLayout } from '@/layout';
import { Card, Descriptions, Button, Space, Empty, Select, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { EditOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import PageLoader from '@/components/PageLoader';
import { erp } from '@/redux/erp/actions';
import { selectReadItem } from '@/redux/erp/selectors';
import useLanguage from '@/locale/useLanguage';
import Notes from '@/components/Notes';
import { CrudContextProvider } from '@/context/crud';
import { request } from '@/request';
import axios from 'axios';
import { API_BASE_URL } from '@/config/serverApiConfig';

export default function ReadQueryModule({ config }) {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { result: currentResult, isSuccess, isLoading = true } = useSelector(selectReadItem);
  const translate = useLanguage();
  const navigate = useNavigate();
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [statusValue, setStatusValue] = useState('');

  useEffect(() => {
    dispatch(erp.read({ entity: config.entity, id }));
  }, [id]);

  useEffect(() => {
    if (currentResult?.status) {
      setStatusValue(currentResult.status);
    }
  }, [currentResult]);

  const handleStatusUpdate = async () => {
    try {
      const auth = JSON.parse(localStorage.getItem('auth'));
      const token = auth?.current?.token;

      if (!token) {
        message.error(translate('Authentication required'));
        return;
      }

      const response = await axios.put(
        `${API_BASE_URL}query/${id}/status`,
        { status: statusValue },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        message.success(translate('Status updated successfully'));
        setIsEditingStatus(false);
        dispatch(erp.read({ entity: config.entity, id }));
        dispatch(erp.list({ entity: config.entity }));
      } else {
        message.error(translate('Failed to update status'));
      }
    } catch (error) {
      console.error('Error updating status:', error);
      message.error(translate('Failed to update status'));
    }
  };

  if (isLoading) {
    return (
      <ErpLayout>
        <PageLoader />
      </ErpLayout>
    );
  }

  return (
    <ErpLayout>
      {isSuccess ? (
        <div style={{ padding: '20px' }}>
          <Space style={{ marginBottom: '16px' }}>
            <Button onClick={() => navigate('/query')} icon={<ArrowLeftOutlined />}>
              {translate('Back')}
            </Button>
          </Space>
          <Card title={translate('Query Details')} bordered={false}>
            <Descriptions column={2}>
              <Descriptions.Item label={translate('Customer')}>
                {currentResult.customer?.name} {currentResult._id}
              </Descriptions.Item>
              <Descriptions.Item label={translate('Status')}>
                {isEditingStatus ? (
                  <Space>
                    <Select
                      value={statusValue}
                      onChange={(value) => setStatusValue(value)}
                      style={{ width: 200 }}
                    >
                      <Select.Option value="pending">{translate('Pending')}</Select.Option>
                      <Select.Option value="in_progress">{translate('In Progress')}</Select.Option>
                      <Select.Option value="resolved">{translate('Resolved')}</Select.Option>
                      <Select.Option value="closed">{translate('Closed')}</Select.Option>
                    </Select>
                    <Button type="primary" onClick={handleStatusUpdate}>
                      {translate('Save')}
                    </Button>
                    <Button onClick={() => setIsEditingStatus(false)}>{translate('Cancel')}</Button>
                  </Space>
                ) : (
                  <Space>
                    {translate(currentResult.status)}
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => setIsEditingStatus(true)}
                    />
                  </Space>
                )}
              </Descriptions.Item>
              <Descriptions.Item label={translate('Description')} span={2}>
                {currentResult.description}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title={translate('Notes')} style={{ marginTop: '16px' }} bordered={false}>
            <CrudContextProvider>
              <Notes queryId={id} notes={currentResult.notes || []} />
            </CrudContextProvider>
          </Card>
        </div>
      ) : (
        <div>{translate('Query not found')}</div>
      )}
    </ErpLayout>
  );
}
