import { Router } from 'express';
import taskRoutes from './taskRoutes';
import systemRoutes from './systemRoutes';

const router = Router();

// Mount task routes
router.use('/tasks', taskRoutes);

// Mount system routes
router.use('/', systemRoutes);

export default router;
