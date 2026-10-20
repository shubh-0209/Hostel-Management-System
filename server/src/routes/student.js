import { Router } from 'express';
import { 
  getProfile, 
  updateProfile, 
  getHostels, 
  getHostel, 
  getAllocation, 
  allocateBed, 
  vacateBed,
  getOutings, 
  createOuting, 
  cancelOuting,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getMaintenanceRequests,
  createMaintenanceRequest,
  cancelMaintenanceRequest
} from '../controllers/studentController.js';
import { validateRequest } from '../middleware/validate.js';
import { 
  updateProfileSchema, 
  allocateBedSchema, 
  createOutingSchema,
  createMaintenanceSchema 
} from '../schemas/student.js';
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
router.post('/allocation/vacate', vacateBed);

// Outings
router.get('/outings', getOutings);
router.post('/outings', validateRequest(createOutingSchema), createOuting);
router.patch('/outings/:id/cancel', cancelOuting);

// Notifications
router.get('/notifications', getNotifications);
router.patch('/notifications/read-all', markAllNotificationsRead);
router.patch('/notifications/:id/read', markNotificationRead);

// Maintenance / Complaints
router.get('/maintenance', getMaintenanceRequests);
router.post('/maintenance', validateRequest(createMaintenanceSchema), createMaintenanceRequest);
router.patch('/maintenance/:id/cancel', cancelMaintenanceRequest);

export default router;
