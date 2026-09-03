import { z } from 'zod';

const paramIdSchema = z.object({
  id: z.string().uuid(),
});

const hostelParams = z.object({
  hostelId: z.string().uuid(),
});

export const createFloorSchema = z.object({
  body: z.object({
    floor_number: z.number().int().min(0, 'Floor number must be >= 0'),
  }),
  params: hostelParams,
  query: z.object({}),
});

export const getFloorsSchema = z.object({
  body: z.object({}),
  params: hostelParams,
  query: z.object({}),
});

export const updateFloorSchema = z.object({
  body: z.object({
    floor_number: z.number().int().min(0),
  }),
  params: paramIdSchema,
  query: z.object({}),
});

export const deleteFloorSchema = z.object({
  body: z.object({}),
  params: paramIdSchema,
  query: z.object({}),
});
