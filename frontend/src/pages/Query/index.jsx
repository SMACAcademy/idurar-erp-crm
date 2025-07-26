import { useEffect, useState } from 'react';
import CrudModule from '@/modules/CrudModule/CrudModule';
import DynamicForm from '@/forms/DynamicForm';
import { fields as defaultFields } from './config';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentItem } from '@/redux/crud/selectors';
import useLanguage from '@/locale/useLanguage';
import { request } from '@/request';
import QueryNotes from './queryNotes';

export default function Query() {
    const dispatch = useDispatch();
    const translate = useLanguage();
    const entity = 'query';
    const searchConfig = {
        displayLabels: ['name'],
        searchFields: 'name',
    };
    const deleteModalLabels = ['name'];

    const Labels = {
        PANEL_TITLE: translate('query'),
        DATATABLE_TITLE: translate('query_list'),
        ADD_NEW_ENTITY: translate('add_new_query'),
        ENTITY_NAME: translate('query'),
    };
    const configPage = {
        entity,
        ...Labels,
    };

    const config = {
        ...configPage,
        fields: defaultFields,
        searchConfig,
        deleteModalLabels,
    };

    const { result: currentItem } = useSelector(selectCurrentItem);
    const queryId = currentItem?._id;
    const [fields, setFields] = useState(defaultFields);

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const res = await request.listAll({ entity: 'client' });
                const clientOptions = res?.result?.map(client => ({
                    label: client.name,
                    value: client._id
                }));

                setFields(prev => ({
                    ...prev,
                    client: {
                        ...prev.client,
                        options: clientOptions,
                    }
                }));
            } catch (err) {
                console.error('Failed to fetch clients :', err);
            }
        };

        fetchClients();
    }, [dispatch]);

    return (
        <CrudModule
            createForm={<DynamicForm fields={fields} />}
            updateForm={<DynamicForm fields={fields} />}
            config={config}
            sidePanelExtraContent={queryId ? <QueryNotes queryId={queryId} /> : null}
        />
    );
}
