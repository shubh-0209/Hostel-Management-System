import { z } from 'zod';

const paramIdSchema = z.object({
  id: z.string().uuid('Invalid menu entry ID format'),
});

const mealTypeEnum = z.enum(['breakfast', 'lunch', 'snacks', 'dinner'], {
  errorMap: () => ({ message: "Meal type must be 'breakfast', 'lunch', 'snacks', or 'dinner'" })
});

export const getMessMenuSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    hostel_id: z.string().uuid('Invalid hostel ID format').optional(),
    day_of_week: z.coerce.number().int().min(1, 'Day must be between 1 (Monday) and 7 (Sunday)').max(7, 'Day must be between 1 (Monday) and 7 (Sunday)').optional(),
  }).optional(),
});

export const getMessMenuByIdSchema = z.object({
  body: z.object({}).optional(),
  params: paramIdSchema,
  query: z.object({}).optional(),
});

export const createMessMenuSchema = z.object({
  body: z.object({
    hostel_id: z.string({ required_error: 'Hostel ID is required' }).uuid('Valid hostel ID is required'),
    day_of_week: z.number({ required_error: 'Day of week is required' })
      .int('Day must be an integer')
      .min(1, 'Day must be between 1 (Monday) and 7 (Sunday)')
      .max(7, 'Day must be between 1 (Monday) and 7 (Sunday)'),
    meal_type: mealTypeEnum,
    menu_items: z.string({ required_error: 'Menu items are required' })
      .trim()
      .min(1, 'Menu items cannot be empty')
      .max(500, 'Menu items cannot exceed 500 characters'),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateMessMenuSchema = z.object({
  body: z.object({
    hostel_id: z.string().uuid('Valid hostel ID is required').optional(),
    day_of_week: z.number()
      .int('Day must be an integer')
      .min(1, 'Day must be between 1 (Monday) and 7 (Sunday)')
      .max(7, 'Day must be between 1 (Monday) and 7 (Sunday)')
      .optional(),
    meal_type: mealTypeEnum.optional(),
    menu_items: z.string()
      .trim()
      .min(1, 'Menu items cannot be empty')
      .max(500, 'Menu items cannot exceed 500 characters')
      .optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  }),
  params: paramIdSchema,
  query: z.object({}).optional(),
});

export const deleteMessMenuSchema = z.object({
  body: z.object({}).optional(),
  params: paramIdSchema,
  query: z.object({}).optional(),
});
