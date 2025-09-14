import React from 'react';
import { ReadItem } from '../../components/ReadItem';
import QueryNotes from './QueryNotes';
import dayjs from 'dayjs';

const QueryReadModule = ({ query, onAddNote, onDeleteNote }) => {
  return (
    <div>
      <ReadItem
        title="Query Details"
        data={query}
        fields={[
          { label: 'Customer Name', value: query.customerId?.name },
          { label: 'Description', value: query.description },
          { label: 'Status', value: query.status },
          { label: 'Resolution', value: query.resolution },
          { label: 'Created Date', value: dayjs(query.createdAt).format('YYYY-MM-DD') },
        ]}
      />
      <QueryNotes notes={query.notes} onAddNote={onAddNote} onDeleteNote={onDeleteNote} />
    </div>
  );
};

export default QueryReadModule;