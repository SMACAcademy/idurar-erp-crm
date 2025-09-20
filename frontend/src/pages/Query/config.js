export const fields = {
  customerId: {
    type: 'selectAsync',
    entity: 'client',
    displayLabels: ['name'],
    outputValue: '_id',
    required: true,
  },
  description: {
    type: 'textarea',
    required: true,
  },
  status: {
    type: 'select',
    options: [
      { value: 'Open', label: 'Open' },
      { value: 'InProgress', label: 'In Progress' },
      { value: 'Closed', label: 'Closed' },
    ],
    defaultValue: 'Open',
  },
  resolution: {
    type: 'textarea',
  },
};
