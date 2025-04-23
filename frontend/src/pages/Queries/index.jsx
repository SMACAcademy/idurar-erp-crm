import useLanguage from '@/locale/useLanguage';
import dayjs from 'dayjs';

import { useDate, useMoney } from '@/settings';
import QueryDataTableModule from '@/modules/QueryModule/QueryDataTableModule';

export default function Queries() {
  const translate = useLanguage();
  const { dateFormat } = useDate();
  const entity = 'query';
  const { moneyFormatter } = useMoney();

  const searchConfig = {
    entity: 'client',
    displayLabels: ['name'],
    searchFields: 'name',
  };
  const deleteModalLabels = ['number', 'client.name'];
  const dataTableColumns = [
    {
      title: translate('Number'),
      dataIndex: 'number',
      render: (number, record, index) => {
        return index + 1;
      },
    },
    {
      title: translate('Client'),
      dataIndex: ['client', 'name'],
    },
    {
      title: translate('Description'),
      dataIndex: 'description',
      render: (description) => {
        return description?.length > 50 ? `${description.slice(0, 50)}...` : description;
      },
    },
    {
      title: translate('Created Date'),
      dataIndex: 'date',
      render: (date) => {
        return dayjs(date).format(dateFormat);
      },
    },
    {
      title: translate('Status'),
      dataIndex: 'status',
    },
    {
      title: translate('Resolution'),
      dataIndex: 'resolution',
      render: (resolution) => {
        return resolution?.length > 50 ? `${resolution.slice(0, 50)}...` : resolution;
      },
    },
  ];

  const Labels = {
    PANEL_TITLE: translate('invoice'),
    DATATABLE_TITLE: translate('query_list'),
    ADD_NEW_ENTITY: translate('add_new_query'),
    ENTITY_NAME: translate('query'),

    RECORD_ENTITY: translate('record_payment'),
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
