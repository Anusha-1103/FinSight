"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const transaction_controller_1 = require("../controllers/transaction.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload = (0, multer_1.default)({ limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateJWT);
router.get('/', transaction_controller_1.TransactionController.getTransactions);
router.post('/', transaction_controller_1.TransactionController.createTransaction);
router.put('/:id', transaction_controller_1.TransactionController.updateTransaction);
router.delete('/:id', transaction_controller_1.TransactionController.deleteTransaction);
router.post('/scan-receipt', upload.single('receipt'), transaction_controller_1.TransactionController.scanReceipt);
exports.default = router;
