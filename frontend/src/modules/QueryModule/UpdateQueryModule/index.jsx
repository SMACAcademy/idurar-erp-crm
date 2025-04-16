import React from 'react';
import { ErpLayout } from '@/layout';
import QueryForm from '@/forms/QueryForm';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { erp } from '@/redux/erp/actions';
import { selectReadItem } from '@/redux/erp/selectors';
import { useParams } from 'react-router-dom';
import PageLoader from '@/components/PageLoader';

export default function UpdateQueryModule() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { result: currentResult, isSuccess, isLoading = true } = useSelector(selectReadItem);

  React.useEffect(() => {
    dispatch(erp.read({ entity: 'query', id }));
  }, [id]);

  const handleSubmit = async (formData) => {
    try {
      // Prepare the data for API
      const apiData = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        customer: formData.client,
      };

      // Update the query using the correct endpoint
      const response = await dispatch(
        erp.update({
          entity: 'query',
          id,
          jsonData: apiData,
        })
      );

      if (response && response.success) {
        message.success('Query updated successfully');
        // Refresh the query list
        dispatch(erp.list({ entity: 'query' }));
        navigate('/query');
      } else {
        message.error(response?.message || 'Failed to update query');
      }
    } catch (error) {
      console.error('Error updating query:', error);
      message.error(error?.response?.data?.message || 'Failed to update query');
    }
  };

  if (isLoading) {
    return (
      <ErpLayout>
        <PageLoader />
      </ErpLayout>
    );
  }

  if (!isSuccess) {
    return <div>Query not found</div>;
  }

  return (
    <ErpLayout>
      <QueryForm
        isUpdateForm={true}
        initialValues={{
          title: currentResult.title,
          description: currentResult.description,
          status: currentResult.status,
          priority: currentResult.priority,
          client: currentResult.customer?._id,
          clientName: currentResult.customer?.name,
        }}
        onSubmit={handleSubmit}
      />
    </ErpLayout>
  );
}
