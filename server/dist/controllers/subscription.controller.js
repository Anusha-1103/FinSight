"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionController = void 0;
const db_1 = require("../config/db");
const audit_service_1 = require("../services/audit.service");
async function resolveSubscriptionsCategory(userId) {
    // 1. Query for category owned by user where name is "Subscriptions" and type is EXPENSE
    let category = await db_1.prisma.category.findFirst({
        where: {
            userId,
            type: 'EXPENSE',
            name: { equals: 'Subscriptions' },
        },
    });
    // 2. Query for system category where name is "Subscriptions" and type is EXPENSE
    if (!category) {
        category = await db_1.prisma.category.findFirst({
            where: {
                isSystem: true,
                type: 'EXPENSE',
                name: { equals: 'Subscriptions' },
            },
        });
    }
    // 3. Fallback: Query for category containing "Subscription" in name
    if (!category) {
        category = await db_1.prisma.category.findFirst({
            where: {
                type: 'EXPENSE',
                name: { contains: 'Subscription' },
                OR: [{ userId }, { isSystem: true }],
            },
        });
    }
    // 4. If no Subscriptions category exists, create it automatically for the user
    if (!category) {
        category = await db_1.prisma.category.create({
            data: {
                userId,
                name: 'Subscriptions',
                type: 'EXPENSE',
                icon: 'Tv',
                color: '#8b5cf6',
                isSystem: false,
            },
        });
    }
    return category;
}
class SubscriptionController {
    static async getSubscriptions(req, res, next) {
        try {
            const userId = req.user.userId;
            const subscriptions = await db_1.prisma.subscription.findMany({
                where: { userId },
                include: { category: true },
                orderBy: { nextBillingDate: 'asc' },
            });
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            let totalMonthlySpend = 0;
            let totalAnnualSpend = 0;
            let activeCount = 0;
            let pausedCount = 0;
            let cancelledCount = 0;
            const subscriptionsWithMetrics = subscriptions.map((s) => {
                const amount = s.amount;
                const isAnnual = s.billingCycle === 'ANNUAL';
                const monthlyCost = isAnnual ? amount / 12 : amount;
                const annualCost = isAnnual ? amount : amount * 12;
                if (s.status === 'ACTIVE') {
                    totalMonthlySpend += monthlyCost;
                    totalAnnualSpend += annualCost;
                    activeCount++;
                }
                else if (s.status === 'PAUSED') {
                    pausedCount++;
                }
                else if (s.status === 'CANCELLED') {
                    cancelledCount++;
                }
                const billingDateObj = new Date(s.nextBillingDate);
                billingDateObj.setHours(0, 0, 0, 0);
                const daysRemaining = Math.ceil((billingDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                let dueStatus = 'Payment due in ' + daysRemaining + ' days';
                if (daysRemaining < 0) {
                    dueStatus = 'Overdue';
                }
                else if (daysRemaining === 0) {
                    dueStatus = 'Due Today';
                }
                return {
                    ...s,
                    monthlyCost,
                    annualCost,
                    daysRemaining,
                    dueStatus,
                };
            });
            res.json({
                success: true,
                data: {
                    subscriptions: subscriptionsWithMetrics,
                    summary: {
                        totalMonthlySpend: Math.round(totalMonthlySpend * 100) / 100,
                        totalAnnualSpend: Math.round(totalAnnualSpend * 100) / 100,
                        activeCount,
                        pausedCount,
                        cancelledCount,
                        totalSubscriptions: subscriptions.length,
                    },
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async createSubscription(req, res, next) {
        try {
            const userId = req.user.userId;
            const { name, provider, amount, billingCycle, nextBillingDate, reminderDaysBefore } = req.body;
            if (!name || !name.trim()) {
                return res.status(400).json({ success: false, error: 'Subscription name is required.' });
            }
            if (!provider || !provider.trim()) {
                return res.status(400).json({ success: false, error: 'Provider name cannot be blank.' });
            }
            const parsedAmount = parseFloat(amount);
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                return res.status(400).json({ success: false, error: 'Subscription amount must be greater than zero.' });
            }
            const parsedDate = new Date(nextBillingDate);
            if (isNaN(parsedDate.getTime())) {
                return res.status(400).json({ success: false, error: 'Valid next billing date is required.' });
            }
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (parsedDate < today) {
                return res.status(400).json({ success: false, error: 'Next billing date cannot be in the past.' });
            }
            // Resolve user's exact Subscriptions category
            const subCategory = await resolveSubscriptionsCategory(userId);
            const sub = await db_1.prisma.subscription.create({
                data: {
                    userId,
                    name: name.trim(),
                    provider: provider.trim(),
                    categoryId: subCategory.id,
                    amount: parsedAmount,
                    billingCycle: billingCycle || 'MONTHLY',
                    nextBillingDate: parsedDate,
                    reminderDaysBefore: reminderDaysBefore ? parseInt(reminderDaysBefore, 10) : 3,
                    status: 'ACTIVE',
                },
                include: { category: true },
            });
            await audit_service_1.AuditService.log(userId, 'CREATE_SUBSCRIPTION', 'Subscription', sub.id, { name: sub.name, amount: sub.amount }, req.ip, req.headers['user-agent']);
            res.status(201).json({ success: true, data: sub });
        }
        catch (error) {
            next(error);
        }
    }
    static async updateSubscription(req, res, next) {
        try {
            const userId = req.user.userId;
            const { id } = req.params;
            const { name, provider, amount, billingCycle, nextBillingDate, status, reminderDaysBefore } = req.body;
            const sub = await db_1.prisma.subscription.findFirst({ where: { id, userId } });
            if (!sub)
                return res.status(404).json({ success: false, error: 'Subscription not found.' });
            if (name !== undefined && !name.trim()) {
                return res.status(400).json({ success: false, error: 'Subscription name cannot be blank.' });
            }
            if (provider !== undefined && !provider.trim()) {
                return res.status(400).json({ success: false, error: 'Provider name cannot be blank.' });
            }
            let parsedAmount = sub.amount;
            if (amount !== undefined) {
                parsedAmount = parseFloat(amount);
                if (isNaN(parsedAmount) || parsedAmount <= 0) {
                    return res.status(400).json({ success: false, error: 'Subscription amount must be greater than zero.' });
                }
            }
            let parsedDate = sub.nextBillingDate;
            if (nextBillingDate) {
                parsedDate = new Date(nextBillingDate);
                if (isNaN(parsedDate.getTime())) {
                    return res.status(400).json({ success: false, error: 'Valid next billing date is required.' });
                }
            }
            // Resolve user's exact Subscriptions category
            const subCategory = await resolveSubscriptionsCategory(userId);
            const updated = await db_1.prisma.subscription.update({
                where: { id },
                data: {
                    ...(name && { name: name.trim() }),
                    ...(provider && { provider: provider.trim() }),
                    categoryId: subCategory.id,
                    amount: parsedAmount,
                    ...(billingCycle && { billingCycle }),
                    nextBillingDate: parsedDate,
                    ...(status && { status }),
                    ...(reminderDaysBefore !== undefined && { reminderDaysBefore: parseInt(reminderDaysBefore, 10) }),
                },
                include: { category: true },
            });
            res.json({ success: true, data: updated });
        }
        catch (error) {
            next(error);
        }
    }
    static async recordPayment(req, res, next) {
        try {
            const userId = req.user.userId;
            const { id } = req.params;
            const { accountId } = req.body;
            if (!accountId) {
                return res.status(400).json({ success: false, error: 'Account is required to record payment.' });
            }
            const sub = await db_1.prisma.subscription.findFirst({
                where: { id, userId },
                include: { category: true },
            });
            if (!sub)
                return res.status(404).json({ success: false, error: 'Subscription not found.' });
            // Always resolve user's exact "Subscriptions" category
            const subCategory = await resolveSubscriptionsCategory(userId);
            const paymentDate = new Date(); // Payment date is current execution date
            const result = await db_1.prisma.$transaction(async (tx) => {
                // 1. Create completed EXPENSE transaction with exact Subscriptions category ID
                const newTransaction = await tx.transaction.create({
                    data: {
                        userId,
                        accountId,
                        categoryId: subCategory.id,
                        amount: sub.amount,
                        type: 'EXPENSE',
                        description: `Subscription Payment: ${sub.name}`,
                        merchant: sub.provider,
                        date: paymentDate,
                        status: 'COMPLETED',
                    },
                    include: { account: true, category: true },
                });
                // 2. Decrement account balance
                await tx.account.update({
                    where: { id: accountId },
                    data: { balance: { decrement: sub.amount } },
                });
                // 3. Advance next billing date (+30 days for MONTHLY, +365 days for ANNUAL)
                const currentNextDate = new Date(sub.nextBillingDate);
                const daysToAdd = sub.billingCycle === 'ANNUAL' ? 365 : 30;
                currentNextDate.setDate(currentNextDate.getDate() + daysToAdd);
                const updatedSub = await tx.subscription.update({
                    where: { id },
                    data: {
                        categoryId: subCategory.id,
                        nextBillingDate: currentNextDate,
                        status: 'ACTIVE',
                    },
                    include: { category: true },
                });
                return { transaction: newTransaction, subscription: updatedSub };
            });
            await audit_service_1.AuditService.log(userId, 'RECORD_SUBSCRIPTION_PAYMENT', 'Subscription', id, { amount: sub.amount, accountId, categoryId: subCategory.id, transactionId: result.transaction.id }, req.ip, req.headers['user-agent']);
            res.json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    static async deleteSubscription(req, res, next) {
        try {
            const userId = req.user.userId;
            const { id } = req.params;
            const sub = await db_1.prisma.subscription.findFirst({ where: { id, userId } });
            if (!sub)
                return res.status(404).json({ success: false, error: 'Subscription not found.' });
            await db_1.prisma.subscription.delete({ where: { id } });
            res.json({ success: true, message: 'Subscription removed successfully.' });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.SubscriptionController = SubscriptionController;
