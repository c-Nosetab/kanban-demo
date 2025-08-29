import { Router } from 'express';
import systemController from '../controllers/system.controller';

const router = Router();

// GET /api/cron/status - Get cron job status
router.get('/cron/status', systemController.getCronStatus);

// GET /api/security/status - Get security configuration status
router.get('/security/status', systemController.getSecurityStatus);

export default router;
