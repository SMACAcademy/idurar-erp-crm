import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Table, Card, Button, Modal, Tag, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { crudAction } from '@/redux/crud/actions';
import { selectQuery } from '@/redux/crud/selectors';
import QueryForm from '@/forms/QueryForm';
import QueryDetail from '@/modules/QueryModule/ReadQueryModule';
import useLanguage from '@/locale/useLanguage';

const QueryList = () => {
  const dispatch = useDispatch();
  const translate = useLanguage();
  const { list: queries, loading } = useSelector(selectQuery);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
  });

  useEffect(() => {
    loadQueries();
  }, [pagination.current, pagination.pageSize]);

  const loadQueries = () => {
    dispatch(
      crudAction.list({
        entity: 'query',
        options: {
          page: pagination.current,
          items: pagination.pageSize,
        },
      })
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'orange';
      case 'in_progress':
        return 'blue';
      case 'resolved':
        return 'green';
      case 'closed':
        return 'red';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: translate('Title'),
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: translate('Status'),
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={getStatusColor(status)}>{translate(status)}</Tag>,
    },
    {
      title: translate('Priority'),
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => (
        <Tag color={priority === 'high' ? 'red' : priority === 'medium' ? 'orange' : 'blue'}>
          {translate(priority)}
        </Tag>
      ),
    },
    {
      title: translate('Actions'),
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            onClick={() => {
              setSelectedQuery(record);
              setIsModalVisible(true);
            }}
          >
            {translate('View')}
          </Button>
          <Button
            type="link"
            onClick={() => {
              setSelectedQuery(record);
              setIsModalVisible(true);
            }}
          >
            {translate('Edit')}
          </Button>
        </Space>
      ),
    },
  ];

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedQuery(null);
    // Refresh the list when modal closes
    loadQueries();
  };

  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
  };

  return (
    <div>
      <Card
        title={translate('Queries')}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedQuery(null);
              setIsModalVisible(true);
            }}
          >
            {translate('New Query')}
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={queries}
          loading={loading}
          rowKey="_id"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `${translate('Total')} ${total} ${translate('items')}`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          onChange={handleTableChange}
        />
      </Card>

      <Modal
        title={selectedQuery ? translate('Query Details') : translate('Create New Query')}
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={800}
      >
        {selectedQuery ? (
          <QueryDetail queryId={selectedQuery._id} />
        ) : (
          <QueryForm onSuccess={handleModalClose} />
        )}
      </Modal>
    </div>
  );
};

export default QueryList;
