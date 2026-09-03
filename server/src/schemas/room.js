import { z } from 'zod';

const paramIdSchema = z.object({
  id: z.string().uuid(),
});

const floorParams = z.object({
  floorId: z.string().uuid(),
});

export const createRoomSchema = z.object({
  body: z.object({
    room_number: z.string().min(1, 'Room number is required').max(50),
    type: z.string().max(100).optional(),
    is_ac: z.boolean().default(false),
    capacity: z.number().int().min(1, 'Capacity must be at least 1'),
    status: z.enum(['active', 'maintenance']).default('active'),
  }),
  params: floorParams,
  query: z.object({}),
});

export const getRoomsSchema = z.object({
  body: z.object({}),
  params: floorParams,
  query: z.object({}),
});

export const updateRoomSchema = z.object({
  body: z.object({
    room_number: z.string().min(1).max(50).optional(),
    type: z.string().max(100).optional().nullable(),
    is_ac: z.boolean().optional(),
    capacity: z.number().int().min(1).optional(),
    status: z.enum(['active', 'maintenance']).optional(),
  }),
  params: paramIdSchema,
  query: z.object({}),
});

export const deleteRoomSchema = z.object({
  body: z.object({}),
  params: paramIdSchema,
  query: z.object({}),
});
