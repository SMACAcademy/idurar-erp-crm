import React from 'react';
import { Switch, Tag, Select } from 'antd';
import { CloseOutlined, CheckOutlined } from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';
import QueryDataTableModule from '@/modules/QueryModule/QueryDataTableModule';

export default function Query() {
  const translate = useLanguage();
  const entity = 'query';

  const searchConfig = {
    entity: 'client',
    displayLabels: ['name'],
    searchFields: 'name',
    outputValue: '_id',
  };

  const deleteModalLabels = ['title'];
  const dataTableColumns = [
    {
      title: translate('Client'),
      dataIndex: '_id',
      render: (id) => id || '-',
    },
    {
      title: translate('Title'),
      dataIndex: 'title',
    },
    {
      title: translate('Description'),
      dataIndex: 'description',
    },
    {
      title: translate('Created Date'),
      dataIndex: 'createdAt',
      render: (createdAt) => {
        if (!createdAt) return '-';
        const d = new Date(createdAt);
        if (isNaN(d.getTime())) return '-';
        return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(
          d.getDate()
        ).padStart(2, '0')}`;
      },
    },
    {
      title: translate('Status'),
      dataIndex: 'status',
      render: (status) => {
        let color = 'green';
        let text = 'Open';

        if (status === 'in_progress') {
          color = 'blue';
          text = 'In Progress';
        } else if (status === 'closed') {
          color = 'red';
          text = 'Closed';
        }

        return <Tag color={color}>{text}</Tag>;
      },
      filters: [
        { text: 'Open', value: 'open' },
        { text: 'In Progress', value: 'in_progress' },
        { text: 'Closed', value: 'closed' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: translate('Priority'),
      dataIndex: 'priority',
      render: (priority) => {
        let color = priority === 'high' ? 'red' : priority === 'medium' ? 'orange' : 'blue';
        let text = priority === 'high' ? 'High' : priority === 'medium' ? 'Medium' : 'Low';
        return <Tag color={color}>{text}</Tag>;
      },
      filters: [
        { text: 'High', value: 'high' },
        { text: 'Medium', value: 'medium' },
        { text: 'Low', value: 'low' },
      ],
      onFilter: (value, record) => record.priority === value,
    },
  ];

  const Labels = {
    PANEL_TITLE: translate('query'),
    DATATABLE_TITLE: translate('query_list'),
    ADD_NEW_ENTITY: translate('add_new_query'),
    ENTITY_NAME: translate('query'),
  };

  const configPage = {
    entity,
    ...Labels,
  };

  const config = {
    ...configPage,
    dataTableColumns,
    searchConfig,
    deleteModalLabels,
  };

  return <QueryDataTableModule config={config} />;
}
