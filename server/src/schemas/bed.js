import { z } from 'zod';

const paramIdSchema = z.object({
  id: z.string().uuid(),
});

const roomParams = z.object({
  roomId: z.string().uuid(),
});

export const createBedSchema = z.object({
  body: z.object({
    bed_number: z.number().int().min(1, 'Bed number must be at least 1'),
    status: z.enum(['available', 'maintenance']).default('available'),
  }),
  params: roomParams,
  query: z.object({}),
});

export const getBedsSchema = z.object({
  body: z.object({}),
  params: roomParams,
  query: z.object({}),
});

export const updateBedSchema = z.object({
  body: z.object({
    status: z.enum(['available', 'maintenance']),
  }),
  params: paramIdSchema,
  query: z.object({}),
});

export const deleteBedSchema = z.object({
  body: z.object({}),
  params: paramIdSchema,
  query: z.object({}),
});
