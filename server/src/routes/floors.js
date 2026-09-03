import { Router } from 'express';
import { updateFloor, deleteFloor } from '../controllers/floorController.js';
import { getRooms, createRoom } from '../controllers/roomController.js';
import { validateRequest } from '../middleware/validate.js';
import { updateFloorSchema, deleteFloorSchema } from '../schemas/floor.js';
import { createRoomSchema, getRoomsSchema } from '../schemas/room.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.patch('/:id', requireRole('warden'), validateRequest(updateFloorSchema), updateFloor);
router.delete('/:id', requireRole('warden'), validateRequest(deleteFloorSchema), deleteFloor);

// Nested room routes
router.get('/:floorId/rooms', requireRole('warden', 'student'), validateRequest(getRoomsSchema), getRooms);
router.post('/:floorId/rooms', requireRole('warden'), validateRequest(createRoomSchema), createRoom);

export default router;
