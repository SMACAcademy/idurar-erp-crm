import { erp } from '@/redux/erp/actions';
import { selectSummarizedItem } from '@/redux/erp/selectors';
import { Button } from 'antd';
import { useDispatch, useSelector } from 'react-redux';

function GenerateSummaryButton({ id, entity }) {
  const dispatch = useDispatch();
  const { isLoading } = useSelector(selectSummarizedItem);

  const handleGenerate = async () => {
    if (!id) {
      return alert('No notes available to summarize.');
    }

    dispatch(erp.summarize({ entity, id }));
  };

  return (
    <Button style={{ marginLeft: 'auto' }} onClick={handleGenerate} disabled={isLoading}>
      {isLoading ? 'Summarizing...' : 'Generate AI Summary'}
    </Button>
  );
}

export default GenerateSummaryButton;
