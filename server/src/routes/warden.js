import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as wardenController from '../controllers/wardenController.js';
// Add validation schemas later if needed

const router = Router();

router.use(requireAuth);
router.use(requireRole('warden'));

// Dashboard Stats
router.get('/dashboard-stats', wardenController.getDashboardStats);

// Outings
router.get('/outings', wardenController.getOutings);
router.patch('/outings/:id/status', wardenController.updateOutingStatus);
router.patch('/outings/:id/checkout', wardenController.checkoutRequest);
router.patch('/outings/:id/return', wardenController.returnRequest);

// Maintenance
router.get('/maintenance', wardenController.getMaintenanceRequests);
router.post('/maintenance', wardenController.createMaintenanceRequest);
router.patch('/maintenance/:id', wardenController.updateMaintenanceStatus);

// Reports
router.get('/reports/occupancy', wardenController.getOccupancyReport);

export default router;
