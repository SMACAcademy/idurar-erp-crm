import React from 'react';
import { ErpLayout } from '@/layout';
import QueryForm from '@/forms/QueryForm';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { useDispatch } from 'react-redux';
import { erp } from '@/redux/erp/actions';
import { request } from '@/request';

export default function CreateQueryModule() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = async (formData) => {
    try {
      // Prepare the data for API
      const apiData = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        customer: formData.client, // Map client to customer
        createdBy: formData.createdBy,
      };

      // Create the query using the correct endpoint
      const response = await request.post({
        entity: 'query',
        jsonData: apiData,
      });

      if (response && response.success) {
        message.success('Query created successfully');
        // Refresh the query list
        dispatch(erp.list({ entity: 'query' }));
        navigate('/query');
      } else {
        message.error(response?.message || 'Failed to create query');
      }
    } catch (error) {
      console.error('Error creating query:', error);
      message.error(error?.response?.data?.message || 'Failed to create query');
    }
  };

  return (
    <ErpLayout>
      <QueryForm onSubmit={handleSubmit} />
    </ErpLayout>
  );
}
