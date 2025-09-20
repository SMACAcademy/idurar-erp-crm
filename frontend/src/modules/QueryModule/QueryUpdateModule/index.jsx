import React, { useEffect } from 'react';
import { UpdateForm } from '../../components/UpdateForm';
import { useFetch } from '../../hooks/useFetch';

const QueryUpdateModule = ({ query, onSubmit }) => {
  const { data: customers, loading: customersLoading } = useFetch('/client');

  useEffect(() => {
    // Ensure data is set
  }, [query, customers, customersLoading]);

  return (
    <UpdateForm
      title="Update Query"
      initialValues={query}
      onSubmit={onSubmit}
      fields={[
        { name: 'customerId', label: 'Customer', type: 'select', options: customers?.result.map(c => ({ value: c._id, label: c.name })) || [], loading: customersLoading },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'status', label: 'Status', type: 'select', options: ['Open', 'InProgress', 'Closed'] },
        { name: 'resolution', label: 'Resolution', type: 'textarea' },
      ]}
    />
  );
};

export default QueryUpdateModule;