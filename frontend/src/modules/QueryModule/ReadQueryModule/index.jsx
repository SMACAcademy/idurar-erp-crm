import NotFound from '@/components/NotFound';
import { ErpLayout } from '@/layout';
import ReadQueryItem from '@/modules/QueryPanelModule/ReadItem';

import PageLoader from '@/components/PageLoader';
import { query } from '@/redux/query/actions';
import { selectReadQuery } from '@/redux/query/selectors';
import { useLayoutEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useParams } from 'react-router-dom';

export default function ReadInvoiceModule({ config }) {
    const dispatch = useDispatch();
    const { id } = useParams();

    useLayoutEffect(() => {
        dispatch(query.read({ entity: config.entity, id }));
    }, [id]);

    const { result: currentResult, isSuccess, isLoading = true } = useSelector(selectReadQuery);

    if (isLoading) {
        return (
            <ErpLayout>
                <PageLoader />
            </ErpLayout>
        );
    } else
        return (
            <ErpLayout>
                {isSuccess ? (
                    <ReadQueryItem config={config} selectedItem={currentResult} />
                ) : (
                    <NotFound entity={config.entity} />
                )}
            </ErpLayout>
        );
}
