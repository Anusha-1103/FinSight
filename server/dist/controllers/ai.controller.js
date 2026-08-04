"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIController = void 0;
const crypto_1 = require("crypto");
const db_1 = require("../config/db");
const ai_service_1 = require("../services/ai.service");
const audit_service_1 = require("../services/audit.service");
const logger_utils_1 = require("../utils/logger.utils");
class AIController {
    static async getSummary(req, res, next) {
        try {
            const userId = req.user.userId;
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            // Execute parallel PostgreSQL database queries
            const [user, accounts, incomeAgg, expenseAgg, budgets, goals, subscriptions, recentTransactions, budgetTransactionAggs,] = await Promise.all([
                db_1.prisma.user.findUnique({ where: { id: userId } }),
                db_1.prisma.account.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
                db_1.prisma.transaction.aggregate({
                    where: { userId, type: 'INCOME', status: 'COMPLETED', date: { gte: thirtyDaysAgo } },
                    _sum: { amount: true },
                }),
                db_1.prisma.transaction.aggregate({
                    where: { userId, type: 'EXPENSE', status: 'COMPLETED', date: { gte: thirtyDaysAgo } },
                    _sum: { amount: true },
                }),
                db_1.prisma.budget.findMany({ where: { userId }, include: { category: true } }),
                db_1.prisma.goal.findMany({ where: { userId }, orderBy: { targetDate: 'asc' } }),
                db_1.prisma.subscription.findMany({ where: { userId }, include: { category: true }, orderBy: { nextBillingDate: 'asc' } }),
                db_1.prisma.transaction.findMany({
                    where: { userId },
                    include: { category: true, account: true },
                    orderBy: { date: 'desc' },
                    take: 20,
                }),
                db_1.prisma.transaction.groupBy({
                    by: ['categoryId'],
                    where: { userId, type: 'EXPENSE', status: 'COMPLETED', date: { gte: firstDayOfMonth } },
                    _sum: { amount: true },
                }),
            ]);
            // Calculate Net Worth & Cash Flow metrics from real PostgreSQL accounts and transactions
            let totalAssets = 0;
            let totalLiabilities = 0;
            for (const a of accounts) {
                if (a.type === 'LOAN' || a.type === 'CREDIT_CARD') {
                    totalLiabilities += Math.abs(a.balance);
                }
                else {
                    totalAssets += a.balance;
                }
            }
            const netWorth = totalAssets - totalLiabilities;
            const monthlyIncome = incomeAgg._sum.amount || 0;
            const monthlyExpenses = expenseAgg._sum.amount || 0;
            const cashFlow = monthlyIncome - monthlyExpenses;
            const savingsRate = monthlyIncome > 0 ? Math.round((cashFlow / monthlyIncome) * 100) : 0;
            // Format Accounts with masked account numbers
            const formattedAccounts = accounts.map((a) => {
                let maskedNumber = '••••1234';
                if (a.accountNumber && a.accountNumber.length >= 4) {
                    maskedNumber = `••••${a.accountNumber.slice(-4)}`;
                }
                return {
                    name: a.name,
                    type: a.type,
                    balance: a.balance,
                    maskedNumber,
                };
            });
            // Format Budgets with spending calculated from current month transactions
            const budgetMap = new Map();
            for (const bAgg of budgetTransactionAggs) {
                if (bAgg.categoryId)
                    budgetMap.set(bAgg.categoryId, bAgg._sum.amount || 0);
            }
            const formattedBudgets = budgets.map((b) => {
                const spent = budgetMap.get(b.categoryId) || 0;
                const utilization = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
                let status = 'HEALTHY';
                if (utilization > 100)
                    status = 'OVER_BUDGET';
                else if (utilization >= 80)
                    status = 'NEAR_LIMIT';
                return {
                    category: b.category?.name || 'Uncategorized',
                    allocated: b.amount,
                    spent,
                    utilization,
                    status,
                };
            });
            // Format Goals with dynamic projection metrics
            const formattedGoals = goals.map((g) => {
                const remaining = Math.max(0, g.targetAmount - g.currentAmount);
                const targetDateObj = new Date(g.targetDate);
                const remainingMonths = Math.max(1, Math.ceil((targetDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
                const monthlyNeeded = remaining / remainingMonths;
                let status = 'On Track';
                if (g.currentAmount >= g.targetAmount)
                    status = 'Completed';
                else if (monthlyNeeded > (cashFlow > 0 ? cashFlow * 0.5 : 500))
                    status = 'Behind Schedule';
                return {
                    name: g.name,
                    target: g.targetAmount,
                    current: g.currentAmount,
                    monthlyNeeded: Math.round(monthlyNeeded * 100) / 100,
                    status,
                };
            });
            // Format Subscriptions
            const formattedSubscriptions = subscriptions.map((s) => ({
                name: s.name,
                provider: s.provider,
                amount: s.amount,
                cycle: s.billingCycle,
                nextDate: s.nextBillingDate ? new Date(s.nextBillingDate).toISOString().split('T')[0] : '',
                status: s.status,
            }));
            // Format Recent 20 Transactions
            const formattedTransactions = recentTransactions.map((t) => ({
                date: new Date(t.date).toISOString().split('T')[0],
                merchant: t.merchant || t.description,
                category: t.category?.name || 'General',
                amount: t.amount,
                type: t.type,
            }));
            // Construct structured FinancialContext
            const financialContext = {
                clientName: user?.name || 'Client',
                currency: user?.currency || 'USD',
                netWorth,
                totalAssets,
                totalLiabilities,
                monthlyIncome,
                monthlyExpenses,
                cashFlow,
                savingsRate,
                accounts: formattedAccounts,
                budgets: formattedBudgets,
                goals: formattedGoals,
                subscriptions: formattedSubscriptions,
                recentTransactions: formattedTransactions,
            };
            // Generate AI Summary report using Gemini
            const summaryMarkdown = await ai_service_1.AIService.generateSummaryReport(financialContext);
            res.json({
                success: true,
                data: {
                    summaryMarkdown,
                    context: financialContext,
                },
            });
        }
        catch (error) {
            logger_utils_1.logger.error('AI summary generation failed:', error);
            res.status(500).json({ success: false, error: error.message || 'AI summary generation failed.' });
        }
    }
    static async chat(req, res, next) {
        try {
            const userId = req.user.userId;
            const { message, conversationId } = req.body;
            if (!message || typeof message !== 'string' || !message.trim()) {
                return res.status(400).json({ success: false, error: 'A valid non-empty message is required.' });
            }
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            // Execute parallel PostgreSQL database queries
            const [user, accounts, incomeAgg, expenseAgg, budgets, goals, subscriptions, recentTransactions, budgetTransactionAggs,] = await Promise.all([
                db_1.prisma.user.findUnique({ where: { id: userId } }),
                db_1.prisma.account.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
                db_1.prisma.transaction.aggregate({
                    where: { userId, type: 'INCOME', status: 'COMPLETED', date: { gte: thirtyDaysAgo } },
                    _sum: { amount: true },
                }),
                db_1.prisma.transaction.aggregate({
                    where: { userId, type: 'EXPENSE', status: 'COMPLETED', date: { gte: thirtyDaysAgo } },
                    _sum: { amount: true },
                }),
                db_1.prisma.budget.findMany({ where: { userId }, include: { category: true } }),
                db_1.prisma.goal.findMany({ where: { userId }, orderBy: { targetDate: 'asc' } }),
                db_1.prisma.subscription.findMany({ where: { userId }, include: { category: true }, orderBy: { nextBillingDate: 'asc' } }),
                db_1.prisma.transaction.findMany({
                    where: { userId },
                    include: { category: true, account: true },
                    orderBy: { date: 'desc' },
                    take: 20,
                }),
                db_1.prisma.transaction.groupBy({
                    by: ['categoryId'],
                    where: { userId, type: 'EXPENSE', status: 'COMPLETED', date: { gte: firstDayOfMonth } },
                    _sum: { amount: true },
                }),
            ]);
            // Calculate Net Worth & Cash Flow metrics from real PostgreSQL accounts and transactions
            let totalAssets = 0;
            let totalLiabilities = 0;
            for (const a of accounts) {
                if (a.type === 'LOAN' || a.type === 'CREDIT_CARD') {
                    totalLiabilities += Math.abs(a.balance);
                }
                else {
                    totalAssets += a.balance;
                }
            }
            const netWorth = totalAssets - totalLiabilities;
            const monthlyIncome = incomeAgg._sum.amount || 0;
            const monthlyExpenses = expenseAgg._sum.amount || 0;
            const cashFlow = monthlyIncome - monthlyExpenses;
            const savingsRate = monthlyIncome > 0 ? Math.round((cashFlow / monthlyIncome) * 100) : 0;
            // Format Accounts with masked account numbers
            const formattedAccounts = accounts.map((a) => {
                let maskedNumber = '••••1234';
                if (a.accountNumber && a.accountNumber.length >= 4) {
                    maskedNumber = `••••${a.accountNumber.slice(-4)}`;
                }
                return {
                    name: a.name,
                    type: a.type,
                    balance: a.balance,
                    maskedNumber,
                };
            });
            // Format Budgets with spending calculated from current month transactions
            const budgetMap = new Map();
            for (const bAgg of budgetTransactionAggs) {
                if (bAgg.categoryId)
                    budgetMap.set(bAgg.categoryId, bAgg._sum.amount || 0);
            }
            const formattedBudgets = budgets.map((b) => {
                const spent = budgetMap.get(b.categoryId) || 0;
                const utilization = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
                let status = 'HEALTHY';
                if (utilization > 100)
                    status = 'OVER_BUDGET';
                else if (utilization >= 80)
                    status = 'NEAR_LIMIT';
                return {
                    category: b.category?.name || 'Uncategorized',
                    allocated: b.amount,
                    spent,
                    utilization,
                    status,
                };
            });
            // Format Goals with dynamic projection metrics
            const formattedGoals = goals.map((g) => {
                const remaining = Math.max(0, g.targetAmount - g.currentAmount);
                const targetDateObj = new Date(g.targetDate);
                const remainingMonths = Math.max(1, Math.ceil((targetDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
                const monthlyNeeded = remaining / remainingMonths;
                let status = 'On Track';
                if (g.currentAmount >= g.targetAmount)
                    status = 'Completed';
                else if (monthlyNeeded > (cashFlow > 0 ? cashFlow * 0.5 : 500))
                    status = 'Behind Schedule';
                return {
                    name: g.name,
                    target: g.targetAmount,
                    current: g.currentAmount,
                    monthlyNeeded: Math.round(monthlyNeeded * 100) / 100,
                    status,
                };
            });
            // Format Subscriptions
            const formattedSubscriptions = subscriptions.map((s) => ({
                name: s.name,
                provider: s.provider,
                amount: s.amount,
                cycle: s.billingCycle,
                nextDate: s.nextBillingDate ? new Date(s.nextBillingDate).toISOString().split('T')[0] : '',
                status: s.status,
            }));
            // Format Recent 20 Transactions
            const formattedTransactions = recentTransactions.map((t) => ({
                date: new Date(t.date).toISOString().split('T')[0],
                merchant: t.merchant || t.description,
                category: t.category?.name || 'General',
                amount: t.amount,
                type: t.type,
            }));
            // Construct structured FinancialContext
            const financialContext = {
                clientName: user?.name || 'Client',
                currency: user?.currency || 'USD',
                netWorth,
                totalAssets,
                totalLiabilities,
                monthlyIncome,
                monthlyExpenses,
                cashFlow,
                savingsRate,
                accounts: formattedAccounts,
                budgets: formattedBudgets,
                goals: formattedGoals,
                subscriptions: formattedSubscriptions,
                recentTransactions: formattedTransactions,
            };
            // Retrieve or create AIConversation
            let conversation;
            let history = [];
            if (conversationId) {
                conversation = await db_1.prisma.aIConversation.findFirst({
                    where: { id: conversationId, userId },
                });
                if (conversation && conversation.messages) {
                    try {
                        history = typeof conversation.messages === 'string' ? JSON.parse(conversation.messages) : conversation.messages;
                    }
                    catch (e) {
                        history = [];
                    }
                }
            }
            // Append User message to history
            const userMessageId = (0, crypto_1.randomUUID)();
            const userTimestamp = new Date().toISOString();
            history.push({
                id: userMessageId,
                sender: 'user',
                text: message.trim(),
                timestamp: userTimestamp,
            });
            // Generate AI Advisory response using Gemini
            const aiResponse = await ai_service_1.AIService.generateChatResponse(history, financialContext);
            // Append Assistant message to history
            const assistantMessageId = (0, crypto_1.randomUUID)();
            const assistantTimestamp = new Date().toISOString();
            history.push({
                id: assistantMessageId,
                sender: 'assistant',
                text: aiResponse.text,
                timestamp: assistantTimestamp,
            });
            // Persist conversation in PostgreSQL database via Prisma
            const messagesJsonString = JSON.stringify(history);
            if (conversation) {
                conversation = await db_1.prisma.aIConversation.update({
                    where: { id: conversation.id },
                    data: {
                        messages: messagesJsonString,
                        updatedAt: new Date(),
                    },
                });
            }
            else {
                const titleSnippet = message.trim().substring(0, 40);
                conversation = await db_1.prisma.aIConversation.create({
                    data: {
                        userId,
                        title: titleSnippet + (message.length > 40 ? '...' : ''),
                        messages: messagesJsonString,
                    },
                });
            }
            await audit_service_1.AuditService.log(userId, 'AI_CHAT', 'AIConversation', conversation.id, { promptLength: message.length, responseLength: aiResponse.text.length }, req.ip, req.headers['user-agent']);
            // Return clean, structured response ready for frontend UI
            res.json({
                success: true,
                data: {
                    conversationId: conversation.id,
                    message: {
                        id: assistantMessageId,
                        role: 'assistant',
                        content: aiResponse.text,
                        createdAt: assistantTimestamp,
                    },
                    suggestedActions: aiResponse.suggestedActions,
                    financialContextSummary: {
                        netWorth: financialContext.netWorth,
                        monthlyIncome: financialContext.monthlyIncome,
                        monthlyExpenses: financialContext.monthlyExpenses,
                        cashFlow: financialContext.cashFlow,
                        savingsRate: financialContext.savingsRate,
                        activeAccountsCount: accounts.length,
                    },
                },
            });
        }
        catch (error) {
            logger_utils_1.logger.error('AI chat endpoint failed:', error);
            res.status(500).json({ success: false, error: error.message || 'AI chat generation failed.' });
        }
    }
    static async getInsights(req, res, next) {
        try {
            const userId = req.user.userId;
            let insights = await db_1.prisma.aIInsight.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            });
            if (insights.length === 0) {
                const transactions = await db_1.prisma.transaction.findMany({ where: { userId }, take: 20 });
                const generated = await ai_service_1.AIService.generateAnomalies(userId, transactions);
                for (const item of generated) {
                    await db_1.prisma.aIInsight.create({
                        data: {
                            userId,
                            title: item.title,
                            description: item.description,
                            scoreImpact: item.scoreImpact,
                            category: item.category,
                        },
                    });
                }
                insights = await db_1.prisma.aIInsight.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
            }
            res.json({ success: true, data: insights });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AIController = AIController;
