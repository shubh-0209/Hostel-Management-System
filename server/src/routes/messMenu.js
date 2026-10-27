import { Router } from 'express';
import {
  getMessMenu,
  getMessMenuById,
  createMessMenu,
  updateMessMenu,
  deleteMessMenu,
} from '../controllers/messMenuController.js';
import { validateRequest } from '../middleware/validate.js';
import {
  getMessMenuSchema,
  getMessMenuByIdSchema,
  createMessMenuSchema,
  updateMessMenuSchema,
  deleteMessMenuSchema,
} from '../schemas/messMenu.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Authentication required for all mess menu endpoints
router.use(requireAuth);

// Student & Warden can read menu entries
router.get('/', requireRole('warden', 'student'), validateRequest(getMessMenuSchema), getMessMenu);
router.get('/:id', requireRole('warden', 'student'), validateRequest(getMessMenuByIdSchema), getMessMenuById);

// Only Warden can manage menu entries
router.post('/', requireRole('warden'), validateRequest(createMessMenuSchema), createMessMenu);
router.put('/:id', requireRole('warden'), validateRequest(updateMessMenuSchema), updateMessMenu);
router.patch('/:id', requireRole('warden'), validateRequest(updateMessMenuSchema), updateMessMenu);
router.delete('/:id', requireRole('warden'), validateRequest(deleteMessMenuSchema), deleteMessMenu);

export default router;
