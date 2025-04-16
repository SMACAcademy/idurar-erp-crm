import React from 'react';
import useLanguage from '@/locale/useLanguage';
import ReadQueryModule from '@/modules/QueryModule/ReadQueryModule';

export default function QueryRead() {
  const translate = useLanguage();
  const entity = 'query';

  const config = {
    entity,
    PANEL_TITLE: translate('query'),
    DATATABLE_TITLE: translate('query_details'),
    ENTITY_NAME: translate('query'),
  };

  return <ReadQueryModule config={config} />;
}
