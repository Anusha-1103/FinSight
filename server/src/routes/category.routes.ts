import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateJWT);
router.get('/', CategoryController.getCategories);

export default router;
