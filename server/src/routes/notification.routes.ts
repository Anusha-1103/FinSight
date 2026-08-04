import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateJWT);
router.get('/', NotificationController.getNotifications);
router.put('/:id/read', NotificationController.markAsRead);

export default router;
