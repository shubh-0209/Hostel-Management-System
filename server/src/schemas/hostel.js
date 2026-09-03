import { z } from 'zod';

const paramIdSchema = z.object({
  id: z.string().uuid(),
});

export const createHostelSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(255),
    code: z.string().min(1, 'Code is required').max(50),
    status: z.enum(['active', 'maintenance']).default('active'),
    academic_years: z.array(z.number().int().min(1).max(4)).min(1, 'At least one academic year is required'),
  }),
  params: z.object({}),
  query: z.object({}),
});

export const updateHostelSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    code: z.string().min(1).max(50).optional(),
    status: z.enum(['active', 'maintenance']).optional(),
    academic_years: z.array(z.number().int().min(1).max(4)).min(1).optional(),
  }),
  params: paramIdSchema,
  query: z.object({}),
});

export const getHostelSchema = z.object({
  body: z.object({}),
  params: paramIdSchema,
  query: z.object({}),
});

export const deleteHostelSchema = z.object({
  body: z.object({}),
  params: paramIdSchema,
  query: z.object({}),
});
