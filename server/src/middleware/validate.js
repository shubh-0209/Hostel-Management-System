import { ApiError } from '../utils/ApiError.js';

export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse({
        body: req.body !== undefined ? req.body : {},
        query: req.query !== undefined ? req.query : {},
        params: req.params !== undefined ? req.params : {},
      });

      // Update the request with the validated/coerced data
      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.query !== undefined) {
        // req.query only has a getter in express, so we mutate it
        for (const key in req.query) delete req.query[key];
        Object.assign(req.query, parsed.query);
      }
      if (parsed.params !== undefined) {
        for (const key in req.params) delete req.params[key];
        Object.assign(req.params, parsed.params);
      }
      
      next();
    } catch (error) {
      next(error); // Express error handler catches ZodError
    }
  };
};
