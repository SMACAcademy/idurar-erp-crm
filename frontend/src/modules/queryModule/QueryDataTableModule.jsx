import { ErpLayout } from '@/layout';
import ErpPanel from '@/modules/ErpPanelModule';
import useLanguage from '@/locale/useLanguage';
import { ContainerOutlined } from '@ant-design/icons';

export default function QueryDataTableModule({ config }) {
  const translate = useLanguage();
  return (
    <ErpLayout>
      <ErpPanel
        config={config}
        extra={[]}
      ></ErpPanel>
    </ErpLayout>
  );
}