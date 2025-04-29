import useLanguage from '@/locale/useLanguage';
import UpdateQueryModule from '@/modules/QueryModule/UpdatequeryModule';

export default function InvoiceUpdate() {
  const entity = 'queries';
  const translate = useLanguage();
  const Labels = {
    PANEL_TITLE: translate('query'),
    DATATABLE_TITLE: translate('query_list'),
    ADD_NEW_ENTITY: translate('add_query'),
  };

  const configPage = {
    entity,
    ...Labels,
  };
  return <UpdateQueryModule config={configPage} />;
}
