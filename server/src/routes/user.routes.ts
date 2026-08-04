import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.put('/profile', authenticateJWT, UserController.updateProfile);

export default router;
