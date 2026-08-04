"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionController = void 0;
const db_1 = require("../config/db");
const cloudinary_service_1 = require("../services/cloudinary.service");
const ai_service_1 = require("../services/ai.service");
const audit_service_1 = require("../services/audit.service");
class TransactionController {
    static async getTransactions(req, res, next) {
        try {
            const userId = req.user.userId;
            const { search, categoryId, accountId, type, status, startDate, endDate, page = '1', limit = '20', sortBy = 'date', sortOrder = 'desc' } = req.query;
            const pageNum = parseInt(page, 10) || 1;
            const limitNum = parseInt(limit, 10) || 20;
            const skip = (pageNum - 1) * limitNum;
            const where = { userId };
            if (search) {
                where.OR = [
                    { description: { contains: search } },
                    { merchant: { contains: search } },
                ];
            }
            if (categoryId)
                where.categoryId = categoryId;
            if (accountId)
                where.accountId = accountId;
            if (type)
                where.type = type;
            if (status)
                where.status = status;
            if (startDate || endDate) {
                where.date = {};
                if (startDate)
                    where.date.gte = new Date(startDate);
                if (endDate)
                    where.date.lte = new Date(endDate);
            }
            const orderBy = {};
            const orderDirection = sortOrder === 'asc' ? 'asc' : 'desc';
            if (sortBy === 'amount') {
                orderBy.amount = orderDirection;
            }
            else if (sortBy === 'merchant') {
                orderBy.merchant = orderDirection;
            }
            else {
                orderBy.date = orderDirection;
            }
            const [transactions, total] = await Promise.all([
                db_1.prisma.transaction.findMany({
                    where,
                    include: { account: true, category: true, receipt: true },
                    orderBy,
                    skip,
                    take: limitNum,
                }),
                db_1.prisma.transaction.count({ where }),
            ]);
            res.json({
                success: true,
                data: {
                    transactions,
                    pagination: {
                        total,
                        page: pageNum,
                        limit: limitNum,
                        totalPages: Math.ceil(total / limitNum) || 1,
                    },
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async createTransaction(req, res, next) {
        try {
            const userId = req.user.userId;
            const { accountId, categoryId, amount, type, description, merchant, date, status = 'COMPLETED', isRecurring, recurrenceInterval, receiptId } = req.body;
            const numericAmount = parseFloat(amount);
            const txDate = date ? new Date(date) : new Date();
            const transaction = await db_1.prisma.$transaction(async (tx) => {
                const newTx = await tx.transaction.create({
                    data: {
                        userId,
                        accountId,
                        categoryId,
                        amount: numericAmount,
                        type,
                        description,
                        merchant: merchant || null,
                        date: txDate,
                        status: status || 'COMPLETED',
                        isRecurring: isRecurring || false,
                        recurrenceInterval: recurrenceInterval || 'NONE',
                        receiptId: receiptId || null,
                    },
                    include: { account: true, category: true },
                });
                // Update Account balance for COMPLETED transactions inside database transaction
                if (status === 'COMPLETED') {
                    if (type === 'INCOME') {
                        await tx.account.update({
                            where: { id: accountId },
                            data: { balance: { increment: numericAmount } },
                        });
                    }
                    else if (type === 'EXPENSE') {
                        await tx.account.update({
                            where: { id: accountId },
                            data: { balance: { decrement: numericAmount } },
                        });
                    }
                }
                return newTx;
            });
            await audit_service_1.AuditService.log(userId, 'CREATE_TRANSACTION', 'Transaction', transaction.id, { amount: numericAmount, type, description }, req.ip, req.headers['user-agent']);
            res.status(201).json({ success: true, data: transaction });
        }
        catch (error) {
            next(error);
        }
    }
    static async updateTransaction(req, res, next) {
        try {
            const userId = req.user.userId;
            const { id } = req.params;
            const { accountId, categoryId, amount, type, description, merchant, date, status } = req.body;
            const existing = await db_1.prisma.transaction.findFirst({ where: { id, userId } });
            if (!existing)
                return res.status(404).json({ success: false, error: 'Transaction not found.' });
            const updated = await db_1.prisma.$transaction(async (tx) => {
                // 1. Revert old balance impact on old account
                if (existing.status === 'COMPLETED') {
                    if (existing.type === 'INCOME') {
                        await tx.account.update({
                            where: { id: existing.accountId },
                            data: { balance: { decrement: existing.amount } },
                        });
                    }
                    else if (existing.type === 'EXPENSE') {
                        await tx.account.update({
                            where: { id: existing.accountId },
                            data: { balance: { increment: existing.amount } },
                        });
                    }
                }
                const newAccountId = accountId || existing.accountId;
                const newCategoryId = categoryId || existing.categoryId;
                const newAmount = amount !== undefined ? parseFloat(amount) : existing.amount;
                const newType = type || existing.type;
                const newStatus = status || existing.status;
                const newDate = date ? new Date(date) : existing.date;
                const newDescription = description !== undefined ? description : existing.description;
                const newMerchant = merchant !== undefined ? merchant : existing.merchant;
                // 2. Update transaction record
                const updatedTx = await tx.transaction.update({
                    where: { id },
                    data: {
                        accountId: newAccountId,
                        categoryId: newCategoryId,
                        amount: newAmount,
                        type: newType,
                        status: newStatus,
                        description: newDescription,
                        merchant: newMerchant,
                        date: newDate,
                    },
                    include: { account: true, category: true },
                });
                // 3. Apply new balance impact on new account
                if (newStatus === 'COMPLETED') {
                    if (newType === 'INCOME') {
                        await tx.account.update({
                            where: { id: newAccountId },
                            data: { balance: { increment: newAmount } },
                        });
                    }
                    else if (newType === 'EXPENSE') {
                        await tx.account.update({
                            where: { id: newAccountId },
                            data: { balance: { decrement: newAmount } },
                        });
                    }
                }
                return updatedTx;
            });
            await audit_service_1.AuditService.log(userId, 'UPDATE_TRANSACTION', 'Transaction', id, { amount: updated.amount, type: updated.type }, req.ip, req.headers['user-agent']);
            res.json({ success: true, data: updated });
        }
        catch (error) {
            next(error);
        }
    }
    static async deleteTransaction(req, res, next) {
        try {
            const userId = req.user.userId;
            const { id } = req.params;
            const existing = await db_1.prisma.transaction.findFirst({ where: { id, userId } });
            if (!existing)
                return res.status(404).json({ success: false, error: 'Transaction not found.' });
            await db_1.prisma.$transaction(async (tx) => {
                // Revert balance impact inside DB transaction
                if (existing.status === 'COMPLETED') {
                    if (existing.type === 'INCOME') {
                        await tx.account.update({
                            where: { id: existing.accountId },
                            data: { balance: { decrement: existing.amount } },
                        });
                    }
                    else if (existing.type === 'EXPENSE') {
                        await tx.account.update({
                            where: { id: existing.accountId },
                            data: { balance: { increment: existing.amount } },
                        });
                    }
                }
                await tx.transaction.delete({ where: { id } });
            });
            await audit_service_1.AuditService.log(userId, 'DELETE_TRANSACTION', 'Transaction', id, { amount: existing.amount }, req.ip, req.headers['user-agent']);
            res.json({ success: true, message: 'Transaction deleted successfully.' });
        }
        catch (error) {
            next(error);
        }
    }
    static async scanReceipt(req, res, next) {
        try {
            const userId = req.user.userId;
            const file = req.file;
            const { rawText } = req.body;
            let imageResult = { url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c', publicId: 'sample_receipt' };
            let parsedData;
            if (file) {
                imageResult = await cloudinary_service_1.CloudinaryService.uploadImageBuffer(file.buffer, 'receipts');
                parsedData = await ai_service_1.AIService.parseReceiptContent(file.buffer);
            }
            else {
                parsedData = await ai_service_1.AIService.parseReceiptContent(rawText || 'Supermarket Receipt $42.50');
            }
            // Create Receipt record
            const receipt = await db_1.prisma.receipt.create({
                data: {
                    userId,
                    imageUrl: imageResult.url,
                    cloudinaryPublicId: imageResult.publicId,
                    rawOcrText: parsedData.rawText,
                    merchantName: parsedData.merchantName,
                    totalAmount: parsedData.totalAmount,
                    dateExtracted: new Date(parsedData.dateExtracted),
                    confidenceScore: parsedData.confidenceScore,
                },
            });
            res.json({
                success: true,
                data: {
                    receipt,
                    suggestedTransaction: {
                        merchant: parsedData.merchantName,
                        amount: parsedData.totalAmount,
                        date: parsedData.dateExtracted,
                        category: parsedData.category,
                    },
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.TransactionController = TransactionController;
