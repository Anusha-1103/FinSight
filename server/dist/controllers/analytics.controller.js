"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const db_1 = require("../config/db");
class AnalyticsController {
    static async getAnalytics(req, res, next) {
        try {
            const userId = req.user.userId;
            const { range = 'last_6_months', startDate, endDate } = req.query;
            const now = new Date();
            let filterStart = new Date(now.getFullYear(), now.getMonth(), 1); // default current month
            let filterEnd = new Date();
            if (range === 'last_3_months') {
                filterStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
            }
            else if (range === 'last_6_months') {
                filterStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
            }
            else if (range === 'last_12_months') {
                filterStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
            }
            else if (range === 'custom' && startDate && endDate) {
                filterStart = new Date(startDate);
                filterEnd = new Date(endDate);
            }
            filterStart.setHours(0, 0, 0, 0);
            filterEnd.setHours(23, 59, 59, 999);
            // Trend Start is either filterStart or at least 6 months ago for trends visibility
            const trendStart = new Date(filterStart);
            if (range !== 'custom' && range !== 'last_12_months' && range !== 'last_6_months') {
                trendStart.setMonth(now.getMonth() - 5);
                trendStart.setDate(1);
            }
            trendStart.setHours(0, 0, 0, 0);
            // 1. Generate month intervals for trends (inclusive of calendar months up to today)
            const months = [];
            let current = new Date(trendStart.getFullYear(), trendStart.getMonth(), 1);
            const endMonth = new Date(filterEnd.getFullYear(), filterEnd.getMonth(), 1);
            while (current <= endMonth) {
                const year = current.getFullYear();
                const month = current.getMonth();
                // X-axis label displays like "Mar 2026", never ambiguous "Mar 26"
                const label = current.toLocaleString('default', { month: 'short' }) + ' ' + year;
                const key = `${year}-${String(month + 1).padStart(2, '0')}`;
                const start = new Date(year, month, 1);
                const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
                months.push({ label, key, start, end });
                current.setMonth(current.getMonth() + 1);
            }
            // 2. Fetch all completed transactions in the trend timeline (trendStart to filterEnd)
            const transactions = await db_1.prisma.transaction.findMany({
                where: {
                    userId,
                    status: 'COMPLETED',
                    date: {
                        gte: trendStart,
                        lte: filterEnd,
                    },
                },
                include: {
                    category: true,
                },
            });
            // 3. Compute Spending, Income, and Cash Flow Trends
            const trendData = months.map((m) => {
                const startMs = m.start.getTime();
                const endMs = m.end.getTime();
                const monthTransactions = transactions.filter((t) => {
                    const tMs = new Date(t.date).getTime();
                    return tMs >= startMs && tMs <= endMs;
                });
                const income = monthTransactions
                    .filter((t) => t.type === 'INCOME')
                    .reduce((sum, t) => sum + t.amount, 0);
                const expenses = monthTransactions
                    .filter((t) => t.type === 'EXPENSE')
                    .reduce((sum, t) => sum + t.amount, 0);
                const cashFlow = income - expenses;
                return {
                    month: m.label,
                    key: m.key,
                    income: Math.round(income * 100) / 100,
                    expenses: Math.round(expenses * 100) / 100,
                    cashFlow: Math.round(cashFlow * 100) / 100,
                };
            });
            // 4. Compute Cumulative Savings Growth
            let runningSavings = 0;
            const savingsGrowth = trendData.map((d) => {
                runningSavings += d.cashFlow;
                return {
                    month: d.month,
                    savings: Math.round(runningSavings * 100) / 100,
                };
            });
            // 5. Compute Net Worth History using backwards-balance algorithm
            const accounts = await db_1.prisma.account.findMany({
                where: { userId },
            });
            const futureTransactions = await db_1.prisma.transaction.findMany({
                where: {
                    userId,
                    status: 'COMPLETED',
                    date: {
                        gt: trendStart,
                    },
                },
            });
            const netWorthHistory = months.map((m) => {
                const monthEnd = m.end;
                let totalAssets = 0;
                let totalLiabilities = 0;
                for (const a of accounts) {
                    const txsAfter = futureTransactions.filter((t) => {
                        return t.accountId === a.id && new Date(t.date).getTime() > monthEnd.getTime();
                    });
                    const incomeAfter = txsAfter
                        .filter((t) => t.type === 'INCOME')
                        .reduce((sum, t) => sum + t.amount, 0);
                    const expenseAfter = txsAfter
                        .filter((t) => t.type === 'EXPENSE')
                        .reduce((sum, t) => sum + t.amount, 0);
                    const historicalBalance = a.balance - incomeAfter + expenseAfter;
                    if (a.type === 'LOAN' || a.type === 'CREDIT_CARD') {
                        totalLiabilities += Math.abs(historicalBalance);
                    }
                    else {
                        totalAssets += historicalBalance;
                    }
                }
                const netWorth = totalAssets - totalLiabilities;
                return {
                    month: m.label,
                    key: m.key,
                    assets: Math.round(totalAssets * 100) / 100,
                    liabilities: Math.round(totalLiabilities * 100) / 100,
                    netWorth: Math.round(netWorth * 100) / 100,
                };
            });
            // 6. Restrict distribution metrics strictly to filterStart & filterEnd
            const filterStartMs = filterStart.getTime();
            const filterEndMs = filterEnd.getTime();
            const periodTransactions = transactions.filter((t) => {
                const tMs = new Date(t.date).getTime();
                return tMs >= filterStartMs && tMs <= filterEndMs;
            });
            // Spending by Category
            const categorySpentMap = new Map();
            for (const t of periodTransactions) {
                if (t.type === 'EXPENSE') {
                    const catName = t.category?.name || 'Other';
                    const catColor = t.category?.color || '#94a3b8';
                    const existing = categorySpentMap.get(catName) || { name: catName, color: catColor, amount: 0 };
                    existing.amount += t.amount;
                    categorySpentMap.set(catName, existing);
                }
            }
            const spendingByCategoryRaw = Array.from(categorySpentMap.values()).sort((a, b) => b.amount - a.amount);
            const totalExpenseInPeriod = spendingByCategoryRaw.reduce((sum, c) => sum + c.amount, 0);
            let spendingByCategory = spendingByCategoryRaw.slice(0, 5);
            if (spendingByCategoryRaw.length > 5) {
                const otherAmount = spendingByCategoryRaw
                    .slice(5)
                    .reduce((sum, c) => sum + c.amount, 0);
                spendingByCategory.push({
                    name: 'Other',
                    color: '#64748b',
                    amount: otherAmount,
                });
            }
            spendingByCategory = spendingByCategory.map((c) => ({
                ...c,
                amount: Math.round(c.amount * 100) / 100,
                percentage: totalExpenseInPeriod > 0 ? Math.round((c.amount / totalExpenseInPeriod) * 100) : 0,
            }));
            // Largest Expense Categories (Horizontal Bar Chart data)
            const largestExpenseCategories = spendingByCategoryRaw.map((c) => ({
                category: c.name,
                amount: Math.round(c.amount * 100) / 100,
                color: c.color,
            }));
            // Income Sources
            const incomeCategoryMap = new Map();
            for (const t of periodTransactions) {
                if (t.type === 'INCOME') {
                    const catName = t.category?.name || 'Other';
                    const catColor = t.category?.color || '#10b981';
                    const existing = incomeCategoryMap.get(catName) || { name: catName, color: catColor, amount: 0 };
                    existing.amount += t.amount;
                    incomeCategoryMap.set(catName, existing);
                }
            }
            const incomeSourcesRaw = Array.from(incomeCategoryMap.values()).sort((a, b) => b.amount - a.amount);
            const totalIncomeInPeriod = incomeSourcesRaw.reduce((sum, c) => sum + c.amount, 0);
            let incomeSources = incomeSourcesRaw.slice(0, 5);
            if (incomeSourcesRaw.length > 5) {
                const otherAmount = incomeSourcesRaw
                    .slice(5)
                    .reduce((sum, c) => sum + c.amount, 0);
                incomeSources.push({
                    name: 'Other',
                    color: '#64748b',
                    amount: otherAmount,
                });
            }
            incomeSources = incomeSources.map((c) => ({
                ...c,
                amount: Math.round(c.amount * 100) / 100,
                percentage: totalIncomeInPeriod > 0 ? Math.round((c.amount / totalIncomeInPeriod) * 100) : 0,
            }));
            // Budget Utilization in selected period
            const budgets = await db_1.prisma.budget.findMany({
                where: { userId },
                include: { category: true },
            });
            const budgetUtilization = budgets.map((b) => {
                const spent = periodTransactions
                    .filter((t) => t.categoryId === b.categoryId && t.type === 'EXPENSE')
                    .reduce((sum, t) => sum + t.amount, 0);
                const remaining = Math.max(0, b.amount - spent);
                const utilization = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
                return {
                    category: b.category?.name || 'Budget Category',
                    allocated: b.amount,
                    spent: Math.round(spent * 100) / 100,
                    remaining: Math.round(remaining * 100) / 100,
                    utilization,
                };
            });
            // 7. Health Metrics
            const activeMonthsCount = trendData.length || 1;
            const averageMonthlySpending = trendData.reduce((sum, d) => sum + d.expenses, 0) / activeMonthsCount;
            const averageMonthlyIncome = trendData.reduce((sum, d) => sum + d.income, 0) / activeMonthsCount;
            let highestSpendingMonth = { month: 'N/A', amount: 0 };
            let highestIncomeMonth = { month: 'N/A', amount: 0 };
            let totalSavingsRateSum = 0;
            let savingsRatesCount = 0;
            for (const d of trendData) {
                if (d.expenses > highestSpendingMonth.amount) {
                    highestSpendingMonth = { month: d.month, amount: d.expenses };
                }
                if (d.income > highestIncomeMonth.amount) {
                    highestIncomeMonth = { month: d.month, amount: d.income };
                }
                if (d.income > 0) {
                    const rate = ((d.income - d.expenses) / d.income) * 100;
                    totalSavingsRateSum += rate;
                    savingsRatesCount++;
                }
            }
            const averageSavingsRate = savingsRatesCount > 0 ? Math.round(totalSavingsRateSum / savingsRatesCount) : 0;
            const largestTransaction = periodTransactions.length > 0
                ? periodTransactions.reduce((max, t) => t.amount > max.amount ? t : max, periodTransactions[0])
                : null;
            const periodExpenses = periodTransactions.filter((t) => t.type === 'EXPENSE');
            const largestExpense = periodExpenses.length > 0
                ? periodExpenses.reduce((max, t) => max === null || t.amount > max.amount ? t : max, periodExpenses[0])
                : null;
            const periodIncomes = periodTransactions.filter((t) => t.type === 'INCOME');
            const largestIncome = periodIncomes.length > 0
                ? periodIncomes.reduce((max, t) => max === null || t.amount > max.amount ? t : max, periodIncomes[0])
                : null;
            const healthMetrics = {
                averageMonthlySpending: Math.round(averageMonthlySpending * 100) / 100,
                averageMonthlyIncome: Math.round(averageMonthlyIncome * 100) / 100,
                highestSpendingMonthName: highestSpendingMonth.month,
                highestSpendingMonthAmount: Math.round(highestSpendingMonth.amount * 100) / 100,
                highestIncomeMonthName: highestIncomeMonth.month,
                highestIncomeMonthAmount: Math.round(highestIncomeMonth.amount * 100) / 100,
                averageSavingsRate,
                largestTransaction: largestTransaction ? {
                    id: largestTransaction.id,
                    merchant: largestTransaction.merchant || largestTransaction.description,
                    amount: largestTransaction.amount,
                    type: largestTransaction.type,
                    date: new Date(largestTransaction.date).toISOString().split('T')[0],
                } : null,
                largestExpense: largestExpense ? {
                    id: largestExpense.id,
                    merchant: largestExpense.merchant || largestExpense.description,
                    amount: largestExpense.amount,
                    date: new Date(largestExpense.date).toISOString().split('T')[0],
                } : null,
                largestIncome: largestIncome ? {
                    id: largestIncome.id,
                    merchant: largestIncome.merchant || largestIncome.description,
                    amount: largestIncome.amount,
                    date: new Date(largestIncome.date).toISOString().split('T')[0],
                } : null,
            };
            res.json({
                success: true,
                data: {
                    trendData,
                    savingsGrowth,
                    netWorthHistory,
                    spendingByCategory,
                    largestExpenseCategories,
                    incomeSources,
                    budgetUtilization,
                    healthMetrics,
                    summary: {
                        totalIncome: Math.round(totalIncomeInPeriod * 100) / 100,
                        totalExpense: Math.round(totalExpenseInPeriod * 100) / 100,
                        netSavings: Math.round((totalIncomeInPeriod - totalExpenseInPeriod) * 100) / 100,
                    },
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AnalyticsController = AnalyticsController;
