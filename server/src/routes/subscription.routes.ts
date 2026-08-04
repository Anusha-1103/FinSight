import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscription.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateJWT);
router.get('/', SubscriptionController.getSubscriptions);
router.post('/', SubscriptionController.createSubscription);
router.put('/:id', SubscriptionController.updateSubscription);
router.post('/:id/record-payment', SubscriptionController.recordPayment);
router.delete('/:id', SubscriptionController.deleteSubscription);

export default router;
