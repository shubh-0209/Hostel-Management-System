import { sendSuccess } from '../utils/response.js';

export const checkHealth = (req, res) => {
  return sendSuccess(res, 200, 'HMS API is running', {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
};
