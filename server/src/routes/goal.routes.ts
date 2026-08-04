import { Router } from 'express';
import { GoalController } from '../controllers/goal.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateJWT);
router.get('/', GoalController.getGoals);
router.post('/', GoalController.createGoal);
router.put('/:id', GoalController.updateGoal);
router.delete('/:id', GoalController.deleteGoal);

export default router;
