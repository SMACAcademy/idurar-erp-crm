import { ErpLayout } from '@/layout';
import ErpPanel from '@/modules/QueryPanelModule';
import useLanguage from '@/locale/useLanguage';
import { CreditCardOutlined } from '@ant-design/icons';

export default function QueryDataTableModule({ config }) {
  const translate = useLanguage();
  return (
    <ErpLayout>
      <ErpPanel
        config={config}
      ></ErpPanel>
    </ErpLayout>
  );
}
