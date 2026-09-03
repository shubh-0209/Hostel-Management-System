import { Router } from 'express';
import { 
  getProfile, 
  updateProfile, 
  getHostels, 
  getHostel, 
  getAllocation, 
  allocateBed, 
  getOutings, 
  createOuting, 
  getNotifications 
} from '../controllers/studentController.js';
import { validateRequest } from '../middleware/validate.js';
import { updateProfileSchema, allocateBedSchema, createOutingSchema } from '../schemas/student.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Protect all student routes
router.use(requireAuth, requireRole('student'));

// Profile
router.get('/profile', getProfile);
router.patch('/profile', validateRequest(updateProfileSchema), updateProfile);

// Hostels (Filtered by eligibility)
router.get('/hostels', getHostels);
router.get('/hostels/:hostelId', getHostel);

// Allocation
router.get('/allocation', getAllocation);
router.post('/allocation', validateRequest(allocateBedSchema), allocateBed);

// Outings
router.get('/outings', getOutings);
router.post('/outings', validateRequest(createOutingSchema), createOuting);

// Notifications
router.get('/notifications', getNotifications);

export default router;
