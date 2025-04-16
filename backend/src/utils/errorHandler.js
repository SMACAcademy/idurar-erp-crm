exports.handleError = (res, error) => {
  console.error('Error:', error);
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  res.status(statusCode).json({ message });
};
