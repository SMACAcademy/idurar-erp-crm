const useDate = ({ settings }) => {
  const { erp_app_date_format } = settings;

  const dateFormat = erp_app_date_format;

  return {
    dateFormat,
  };
};

module.exports = useDate;
