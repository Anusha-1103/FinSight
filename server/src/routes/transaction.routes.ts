import { Router } from 'express';
import multer from 'multer';
import { TransactionController } from '../controllers/transaction.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit
const router = Router();

router.use(authenticateJWT);
router.get('/', TransactionController.getTransactions);
router.post('/', TransactionController.createTransaction);
router.put('/:id', TransactionController.updateTransaction);
router.delete('/:id', TransactionController.deleteTransaction);
router.post('/scan-receipt', upload.single('receipt'), TransactionController.scanReceipt);

export default router;
