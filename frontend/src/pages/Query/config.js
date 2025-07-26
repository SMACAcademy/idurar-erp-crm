export const fields = {
    client: {
        type: 'select',
        label: 'Client',
        options: [],
        render: (client) => {
            if (!client || typeof client === 'string') return '-';
            return client.name || '-';
        },
    },
    description: {
        type: 'string',
    },
    status: {
        type: 'select',
        label: 'status',
        options: [
            { label: 'Open', value: 'Open' },
            { label: 'In Progress', value: 'InProgress' },
            { label: 'Closed', value: 'Closed' }
        ]
    },
    resolution: {
        type: 'textarea',
        label: 'Resolution',
    }
}
