import { Router } from 'express';
import { AccountController } from '../controllers/account.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateJWT);
router.get('/', AccountController.getAccounts);
router.post('/', AccountController.createAccount);
router.put('/:id', AccountController.updateAccount);
router.delete('/:id', AccountController.deleteAccount);

export default router;
