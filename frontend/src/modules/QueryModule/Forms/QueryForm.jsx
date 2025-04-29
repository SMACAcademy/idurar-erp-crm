import { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import { Form, Input, Button, Select, Row, Col, DatePicker } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useDate } from '@/settings';
import useLanguage from '@/locale/useLanguage';
import { useDispatch, useSelector } from 'react-redux';
import AutoCompleteAsync from '@/components/AutoCompleteAsync';
import { query } from '@/redux/query/actions';

export default function QueryForm({ current = null, isSubmitted, queryId, form, config }) {
  return <LoadQueryForm current={current} isSubmitted={isSubmitted} queryId={queryId} form={form} config={config} />;
}

function LoadQueryForm({ current = null, isSubmitted = false, queryId, form, config }) {
  const dispatch = useDispatch();
  const translate = useLanguage();
  const { dateFormat } = useDate();
  const { entity } = config
  const addField = useRef(false);
  const handleAddNoteSubmit = async (fieldName) => {
    try {
      const notes = form.getFieldValue('notes');
      const note = notes?.[fieldName];
      if (!note?.text) {
        return;
      }
      const noteData = {
        text: note.text,
      };
      // const data = dispatch(query.addQueryNotes({ id: queryId, entity, noteData: noteData })).unwrap();
      dispatch(query.addQueryNotes({ id: queryId, entity, noteData: noteData }))
        .then((res) => {
          const updatedBackendNotes = res?.data?.notes || [];
          const match = updatedBackendNotes.find((n) => n.text === note.text);

          if (match?._id) {
            const updatedNotes = [...notes];
            updatedNotes[fieldName] = { ...note, _id: match._id };
            form.setFieldsValue({ notes: updatedNotes });
          }
        })
        .catch((error) => {
          console.error('Error adding note:', error);
        });

    } catch (error) {
      console.error('Error getting note:', error);
    }
  };
  const handleDeleteNote = (noteId, fieldName, remove) => {
    dispatch(query.deleteQueryNote({ id: queryId, noteId: noteId, entity }))
      .then(() => {
        remove(fieldName);
      })
      .catch((err) => {
        console.error('Failed to delete note:', err);
      });
  };


  useEffect(() => {
    addField.current?.click?.();
  }, []);

  return (
    <Row gutter={[12, 0]}>
      <Col span={8}>

        <Form.Item
          name="customerName"
          label={translate('customerName')}
          rules={[
            {
              required: true,
            },
          ]}
        >
          <AutoCompleteAsync
            entity={'client'}
            displayLabels={['name']}
            searchFields={'name'}
            redirectLabel={'Add New Client'}
            withRedirect
            urlToRedirect={'/customer'}
            value={current?.name?._id}
          />
        </Form.Item>

      </Col>

      <Col span={8}>
        <Form.Item name="description" label={translate('Description')}>
          <Input.TextArea placeholder="Enter Description" autoSize />
        </Form.Item>
      </Col>

      <Col span={8}>
        <Form.Item
          name="createdDate"
          label={translate('createdDate')}
          rules={[
            {
              required: true,
              type: 'object',
            },
          ]}
          initialValue={dayjs()}
        >
          <DatePicker style={{ width: '100%' }} format={dateFormat} />
        </Form.Item>
      </Col>

      <Col span={8}>
        <Form.Item
          name="status"
          label={translate('Status')}
          initialValue="Open"
          rules={[{ required: true, message: 'Status is required' }]}
        >
          <Select
            options={[
              { label: 'Open', value: 'Open' },
              { label: 'In Progress', value: 'InProgress' },
              { label: 'Closed', value: 'Closed' },
            ]}
            placeholder="Select Status"
          />
        </Form.Item>
      </Col>

      <Col span={8}>
        <Form.Item
          name="resolution"
          label={translate('Resolution')}
          rules={[{ max: 100, message: 'Maximum 100 characters allowed' }]}
        >
          <Input.TextArea
            placeholder="Enter Resolution"
            autoSize={{ minRows: 2, maxRows: 4 }}
            maxLength={100}
          />
        </Form.Item>
      </Col>

      <Col span={24}>
        <Form.List name="notes">
          {(fields, { add, remove }) => (
            <>
              <label>{translate('Notes')}</label>

              {fields.map(({ key, name, ...restField }, index) => (
                <Row key={key} gutter={12} align="center">
                  <Col span={20}>
                    <Form.Item
                      {...restField}
                      name={[name, 'text']}
                    >
                      <Input
                        placeholder={`Note #${index + 1}`}
                        disabled={!isSubmitted}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={2}>
                    <Button
                      type="primary"
                      onClick={() => handleAddNoteSubmit(name)}
                      disabled={!isSubmitted}
                    >
                      Add
                    </Button>
                  </Col>
                  <Col span={2}>
                    <Button
                      type="danger"
                      onClick={() => handleDeleteNote(form.getFieldValue(['notes', name, '_id']), name, remove)}
                      disabled={!isSubmitted}
                    >
                      Delete
                    </Button>
                  </Col>
                </Row>
              ))}

              <Form.Item>
                <Button
                  ref={addField}
                  type="dashed"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                  disabled={!isSubmitted}
                >
                  {translate('Add Note')}
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

      </Col>
    </Row>
  );
}
