export const sendSuccess = (res, statusCode, message, data = null) => {
  const response = {
    success: true,
    message,
    data: data !== undefined ? data : null,
  };
  return res.status(statusCode).json(response);
};

export const sendError = (res, statusCode, message, errors = null) => {
  const response = {
    success: false,
    message,
  };
  if (errors !== null) {
    response.errors = errors;
  }
  return res.status(statusCode).json(response);
};
