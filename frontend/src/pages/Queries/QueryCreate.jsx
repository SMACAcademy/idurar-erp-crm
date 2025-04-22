import useLanguage from '@/locale/useLanguage';
import CreateQueryModule from '@/modules/QueryModule/CreateQueryModule';

export default function QueryCreate() {
  const entity = 'query';
  const translate = useLanguage();
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
  return <CreateQueryModule config={configPage} />;
}
