import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { sendError } from '../utils/response.js';

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;

  if (!(err instanceof ApiError)) {
    statusCode = statusCode || 500;
    message = env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message;
  }

  res.locals.errorMessage = err.message;

  const response = {
    success: false,
    message,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  if (err.name === 'ZodError') {
    response.message = 'Validation Error';
    response.errors = err.errors;
    statusCode = 422;
  }

  // Log error in production
  if (env.NODE_ENV === 'production' && statusCode === 500) {
    console.error(err);
  }

  return sendError(res, statusCode, response.message, response.errors || (env.NODE_ENV === 'development' ? err.stack : null));
};
