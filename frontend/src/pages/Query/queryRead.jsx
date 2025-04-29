import useLanguage from '@/locale/useLanguage';
import ReadQueryModule from '@/modules/QueryModule/ReadQueryModule/index';

export default function InvoiceRead() {
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
  return <ReadQueryModule config={configPage} />;
}
