export const fields = {
  // <SelectAsync
  //       entity={field.entity}
  //       displayLabels={field.displayLabels}
  //       outputValue={field.outputValue}
  //       loadDefault={field.loadDefault}
  //       withRedirect={field.withRedirect}
  //       urlToRedirect={field.urlToRedirect}
  //       redirectLabel={field.redirectLabel}
  //     ></SelectAsync>
  customerName: {
    type: 'async',
    entity: 'client',
    displayLabels: ['name'],
    withRedirect: true,
    redirectLabel: 'Add New Customer',
    urlToRedirect: '/customer',
    searchFields: 'name',
  },
  description: {
    type: 'string',
    // color: 'red',
  },
  status: {
    type: 'select',
    name: 'status',
    defaultValue: 'Open',
    options: [
      { label: 'Open', value: 'Open' },
      { label: 'Closed', value: 'Closed' },
      { label: 'InProgress', value: 'InProgress' },
    ],
  },
  resolution: {
    type: 'string',
  },
  
};

