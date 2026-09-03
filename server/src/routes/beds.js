import { Router } from 'express';
import { updateBed, deleteBed } from '../controllers/bedController.js';
import { validateRequest } from '../middleware/validate.js';
import { updateBedSchema, deleteBedSchema } from '../schemas/bed.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.patch('/:id', requireRole('warden'), validateRequest(updateBedSchema), updateBed);
router.delete('/:id', requireRole('warden'), validateRequest(deleteBedSchema), deleteBed);

export default router;
