import { ErpLayout } from '@/layout';
import CreateItem from '@/modules/QueryPanelModule/CreateItem';
import QueryForm from '@/modules/QueryModule/Forms/QueryForm';

export default function CreateQueryModule({ config }) {
  return (
    <ErpLayout>
      <CreateItem config={config} CreateForm={QueryForm} />
    </ErpLayout>
  );
}
