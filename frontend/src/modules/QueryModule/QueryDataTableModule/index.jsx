import { ErpLayout } from '@/layout';
import useLanguage from '@/locale/useLanguage';
import ErpPanel from '@/modules/ErpPanelModule';

export default function QueryDataTableModule({ config }) {
  const translate = useLanguage();
  return (
    <ErpLayout>
      <ErpPanel
        config={config}
        // extra={[
        //   {
        //     label: translate('Record Payment'),
        //     key: 'recordPayment',
        //     icon: <CreditCardOutlined />,
        //   },
        // ]}
      ></ErpPanel>
    </ErpLayout>
  );
}
