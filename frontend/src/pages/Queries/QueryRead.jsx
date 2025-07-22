import useLanguage from '@/locale/useLanguage';
import ReadQueryModule from '@/modules/QueriesModule/ReadQueryModule';

export default function QueryRead() {
  const entity = 'queries';
  const translate = useLanguage();
  const Labels = {
    PANEL_TITLE: translate('queries'),
    DATATABLE_TITLE: translate('queries_list'),
    ADD_NEW_ENTITY: translate('add_new_query'),
    ENTITY_NAME: translate('queries'),

    RECORD_ENTITY: translate('record_payment'),
  };

  const configPage = {
    entity,
    ...Labels,
  };
  return <ReadQueryModule config={configPage} />;
}
