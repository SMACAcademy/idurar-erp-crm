import React, { useEffect } from 'react';
import { CreateForm } from '../../components/CreateForm';
import { useFetch } from '../../hooks/useFetch';
import request from '../../request/request';

const QueryCreateModule = ({ onSubmit }) => {
  const { data: customers, loading: customersLoading } = useFetch('/client');
  const [formLoading, setFormLoading] = React.useState(false);

  useEffect(() => {
    // Ensure customers are loaded before rendering options
  }, [customers, customersLoading]);

  const handleSubmit = (values) => {
    setFormLoading(true);
    request.post('/queries', values)
      .then((response) => {
        if (onSubmit) onSubmit(response.data.result);
        setFormLoading(false);
      })
      .catch((error) => {
        console.error('Error creating query:', error);
        setFormLoading(false);
      });
  };

  return (
    <CreateForm
      title="Add Query"
      onSubmit={handleSubmit}
      loading={formLoading || customersLoading}
      fields={[
        {
          name: 'customerId',
          label: 'Customer',
          type: 'select',
          options: customers?.result.map(c => ({ value: c._id, label: c.name })) || [],
          required: true,
          loading: customersLoading,
        },
        {
          name: 'description',
          label: 'Description',
          type: 'textarea',
          required: true,
        },
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          options: ['Open', 'InProgress', 'Closed'],
          initialValue: 'Open',
        },
      ]}
    />
  );
};

export default QueryCreateModule;