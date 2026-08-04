import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateJWT, requireRole(['ADMIN']));
router.get('/users', AdminController.getUsers);
router.put('/users/:id/role', AdminController.updateUserRole);
router.get('/metrics', AdminController.getSystemMetrics);
router.get('/audit-logs', AdminController.getAuditLogs);

export default router;
