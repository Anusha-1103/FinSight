import { Router } from 'express';
import { AIController } from '../controllers/ai.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateJWT);
router.get('/summary', AIController.getSummary);
router.post('/chat', AIController.chat);
router.get('/insights', AIController.getInsights);

export default router;
