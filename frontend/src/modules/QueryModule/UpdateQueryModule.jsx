import { ErpLayout } from '@/layout';
import UpdateItem from '@/modules/ErpPanelModule/UpdateItem';
import QueryForm from './Forms/QueryForm';
import NotFound from '@/components/NotFound';
import PageLoader from '@/components/PageLoader';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { erp } from '@/redux/erp/actions';
import { selectReadItem } from '@/redux/erp/selectors';
import { useLayoutEffect } from 'react';

export default function UpdateQueryModule({ config }) {
    const dispatch = useDispatch();
    const { id } = useParams();

    useLayoutEffect(() => {
        dispatch(erp.read({ entity: config.entity, id }));
    }, [id]);

    const { result, isLoading, isSuccess } = useSelector(selectReadItem);

    useLayoutEffect(() => {
        if (result) {
            dispatch(erp.currentAction({ actionType: 'update', data: result }));
        }
    }, [result]);

    if (isLoading) {
        return (
            <ErpLayout>
                <PageLoader />
            </ErpLayout>
        );
    }

    return (
        <ErpLayout>
            {isSuccess ? <UpdateItem config={config} UpdateForm={QueryForm} /> : <NotFound entity={config.entity} />}
        </ErpLayout>
    );
}
