import { Row, Col, Form, Input, Select } from 'antd';
import AutoCompleteAsync from '@/components/AutoCompleteAsync';
import useLanguage from '@/locale/useLanguage';

export default function QueryForm({ current = null }) {
    const translate = useLanguage();

    return (
        <>
            <Row gutter={[12, 0]}>
                <Col span={8}>
                    <Form.Item
                        name="client"
                        label={translate('Customer')}
                        rules={[{ required: true }]}
                    >
                        <AutoCompleteAsync
                            entity="client"
                            displayLabels={['name']}
                            searchFields="name"
                            withRedirect
                            urlToRedirect="/customer"
                            redirectLabel={translate('Add New Customer')}
                        />
                    </Form.Item>
                </Col>

                <Col span={8}>
                    <Form.Item
                        name="description"
                        label={translate('Description')}
                        rules={[{ required: true }]}
                    >
                        <Input.TextArea rows={3} />
                    </Form.Item>
                </Col>

                <Col span={4}>
                    <Form.Item
                        name="status"
                        label={translate('Status')}
                        rules={[{ required: true }]}
                        initialValue="Open"
                    >
                        <Select
                            options={[
                                { label: translate('Open'), value: 'Open' },
                                { label: translate('InProgress'), value: 'InProgress' },
                                { label: translate('Closed'), value: 'Closed' },
                            ]}
                        />
                    </Form.Item>
                </Col>

                <Col span={12}>
                    <Form.Item
                        name="resolution"
                        label={translate('Resolution')}
                        rules={[{ max: 100 }]}
                    >
                        <Input.TextArea rows={2} showCount maxLength={100} />
                    </Form.Item>
                </Col>
            </Row>
        </>
    );
}
