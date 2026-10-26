import { Router } from 'express';
import categoriesRoutes from './categories.routes';
import instructorsRoutes from './instructors.routes';
import coursesRoutes from './courses.routes';
import batchesRoutes from './batches.routes';
import attendanceRoutes from './attendance.routes';

const router = Router();

router.use('/categories', categoriesRoutes);
router.use('/instructors', instructorsRoutes);
router.use('/courses', coursesRoutes);
router.use('/batches', batchesRoutes);
router.use('/attendance', attendanceRoutes);

export default router;
