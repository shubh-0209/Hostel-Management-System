import { Router } from 'express';
import { getHostels, getHostel, createHostel, updateHostel, deleteHostel } from '../controllers/hostelController.js';
import { getFloors, createFloor } from '../controllers/floorController.js';
import { validateRequest } from '../middleware/validate.js';
import { createHostelSchema, updateHostelSchema, getHostelSchema, deleteHostelSchema } from '../schemas/hostel.js';
import { createFloorSchema, getFloorsSchema } from '../schemas/floor.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Require authentication for all routes
router.use(requireAuth);

router.get('/', requireRole('warden', 'student'), getHostels);
router.post('/', requireRole('warden'), validateRequest(createHostelSchema), createHostel);

router.get('/:id', requireRole('warden', 'student'), validateRequest(getHostelSchema), getHostel);
router.patch('/:id', requireRole('warden'), validateRequest(updateHostelSchema), updateHostel);
router.delete('/:id', requireRole('warden'), validateRequest(deleteHostelSchema), deleteHostel);

// Nested floor routes
router.get('/:hostelId/floors', requireRole('warden', 'student'), validateRequest(getFloorsSchema), getFloors);
router.post('/:hostelId/floors', requireRole('warden'), validateRequest(createFloorSchema), createFloor);

export default router;
