import { Router } from 'express';
import healthRoutes from './health.js';
import hostelRoutes from './hostels.js';
import floorRoutes from './floors.js';
import roomRoutes from './rooms.js';
import bedRoutes from './beds.js';
import studentRoutes from './student.js';
import wardenRoutes from './warden.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/hostels', hostelRoutes);
router.use('/floors', floorRoutes);
router.use('/rooms', roomRoutes);
router.use('/beds', bedRoutes);
router.use('/student', studentRoutes);
router.use('/warden', wardenRoutes);

export default router;
