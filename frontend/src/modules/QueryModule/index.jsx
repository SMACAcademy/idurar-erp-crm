import React, { useEffect, useState } from 'react';
import QueryList from './QueryList';
import { request } from '@/request';

const QueryModule = () => {
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    // Fetch customer names using the shared request utility to avoid double /api/api/
    request.getCustomers()
      .then(res => {
        setCustomers(res.data);
      })
      .catch(() => setCustomers([]));
  }, []);

  return <QueryList customers={customers} />;
};

export default QueryModule;
