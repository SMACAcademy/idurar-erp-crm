import { ErpLayout } from '@/layout';
import ErpPanel from '@/modules/ErpPanelModule';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { erp } from '@/redux/erp/actions';
import { Button, message, Space } from 'antd';
import { useState } from 'react';
import useLanguage from '@/locale/useLanguage';

export default function QueryDataTableModule({ config }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const translate = useLanguage();
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({});

  const handleRead = (record) => {
    dispatch(erp.currentItem({ data: record }));
    navigate(`/query/read/${record._id}`);
  };

  const handleEdit = (record) => {
    setEditingId(record._id);
    setEditingData({
      title: record.title,
      description: record.description,
      status: record.status,
      priority: record.priority,
      client: record.customer?._id,
    });
  };

  const handleDelete = (record) => {
    dispatch(erp.delete({ entity: config.entity, id: record._id }));
  };

  const handleSave = async (record) => {
    try {
      const apiData = {
        title: editingData.title,
        description: editingData.description,
        status: editingData.status,
        priority: editingData.priority,
        customer: editingData.client,
      };

      await dispatch(
        erp.update({
          entity: 'query',
          id: record._id,
          jsonData: apiData,
        })
      );

      message.success(translate('Query updated successfully'));
      setEditingId(null);
      setEditingData({});
      dispatch(erp.list({ entity: 'query' }));
    } catch (error) {
      message.error(translate('Failed to update query'));
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingData({});
  };

  const handleChange = (field, value) => {
    setEditingData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <ErpLayout>
      <ErpPanel config={config} />
    </ErpLayout>
  );
}
