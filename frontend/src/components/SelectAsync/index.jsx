import { useState, useEffect } from 'react';
import { request } from '@/request';
import useFetch from '@/hooks/useFetch';
import { Select, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { generate as uniqueId } from 'shortid';
import color from '@/utils/color';
import useLanguage from '@/locale/useLanguage';

const SelectAsync = ({
  entity,
  displayLabels = ['name'],
  outputValue = '_id',
  redirectLabel = '',
  withRedirect = false,
  urlToRedirect = '/',
  placeholder = 'select',
  value,
  onChange,
}) => {
  const translate = useLanguage();
  const [selectOptions, setOptions] = useState([]);
  const [currentValue, setCurrentValue] = useState(undefined);

  const navigate = useNavigate();

  const asyncList = async () => {
    if (entity === 'client') {
      const response = await request.list({ entity: 'client' });
      return response;
    }
    const response = await request.list({ entity });
    return response;
  };

  const { result, isLoading: fetchIsLoading, isSuccess, error } = useFetch(asyncList);

  useEffect(() => {
    if (isSuccess && result) {
      const data = Array.isArray(result) ? result : (result.result || []);
      setOptions(data);
    }
  }, [isSuccess, result, error]);

  const labels = (optionField) => {
    return optionField.name || optionField[displayLabels[0]];
  };

  useEffect(() => {
    if (value !== undefined) {
      const val = value?.[outputValue] ?? value;
      setCurrentValue(val);
      onChange(val);
    }
  }, [value]);

  const handleSelectChange = (newValue) => {
    if (newValue === 'redirectURL') {
      navigate(urlToRedirect);
    } else {
      const val = newValue?.[outputValue] ?? newValue;
      setCurrentValue(newValue);
      onChange(val);
    }
  };

  const optionsList = () => {
    const list = [];
    selectOptions.forEach((optionField) => {
      const value = optionField._id || optionField[outputValue] || optionField;
      const label = labels(optionField);
      list.push({ value, label });
    });
    return list;
  };

  const options = optionsList();

  return (
    <Select
      loading={fetchIsLoading}
      disabled={fetchIsLoading}
      value={currentValue}
      onChange={handleSelectChange}
      placeholder={placeholder}
      showSearch
      optionFilterProp="children"
      filterOption={(input, option) =>
        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
      }
    >
      {options?.map((option) => (
        <Select.Option key={`${uniqueId()}`} value={option.value}>
          {option.label}
        </Select.Option>
      ))}
      {withRedirect && (
        <Select.Option value={'redirectURL'}>{`+ ` + translate(redirectLabel)}</Select.Option>
      )}
    </Select>
  );
};

export default SelectAsync;
