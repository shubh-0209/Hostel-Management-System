import { Router } from 'express';
import { updateRoom, deleteRoom } from '../controllers/roomController.js';
import { getBeds, createBed } from '../controllers/bedController.js';
import { validateRequest } from '../middleware/validate.js';
import { updateRoomSchema, deleteRoomSchema } from '../schemas/room.js';
import { createBedSchema, getBedsSchema } from '../schemas/bed.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.patch('/:id', requireRole('warden'), validateRequest(updateRoomSchema), updateRoom);
router.delete('/:id', requireRole('warden'), validateRequest(deleteRoomSchema), deleteRoom);

// Nested bed routes
router.get('/:roomId/beds', requireRole('warden', 'student'), validateRequest(getBedsSchema), getBeds);
router.post('/:roomId/beds', requireRole('warden'), validateRequest(createBedSchema), createBed);

export default router;
