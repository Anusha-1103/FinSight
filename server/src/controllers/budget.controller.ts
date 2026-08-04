import { Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class BudgetController {
  static async getBudgets(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

      const [budgets, expenseAggregates] = await Promise.all([
        prisma.budget.findMany({
          where: { userId },
          include: { category: true },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.transaction.groupBy({
          by: ['categoryId'],
          where: {
            userId,
            type: 'EXPENSE',
            status: 'COMPLETED',
            date: { gte: firstDayOfMonth },
          },
          _sum: { amount: true },
        }),
      ]);

      const expenseMap = new Map<string, number>();
      for (const e of expenseAggregates) {
        if (e.categoryId) {
          expenseMap.set(e.categoryId, e._sum.amount || 0);
        }
      }

      let healthyCount = 0;
      let nearLimitCount = 0;
      let overBudgetCount = 0;
      let totalAllocated = 0;
      let totalSpent = 0;

      const budgetsWithProgress = budgets.map((b) => {
        const spent = expenseMap.get(b.categoryId) || 0;
        const remaining = Math.max(0, b.amount - spent);
        const percentageUsed = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;

        let status: 'HEALTHY' | 'NEAR_LIMIT' | 'OVER_BUDGET' = 'HEALTHY';
        if (percentageUsed > 100) {
          status = 'OVER_BUDGET';
          overBudgetCount++;
        } else if (percentageUsed >= 80) {
          status = 'NEAR_LIMIT';
          nearLimitCount++;
        } else {
          status = 'HEALTHY';
          healthyCount++;
        }

        totalAllocated += b.amount;
        totalSpent += spent;

        return {
          ...b,
          spent,
          remaining,
          percentageUsed,
          status,
          isExceeded: status === 'OVER_BUDGET',
        };
      });

      res.json({
        success: true,
        data: {
          budgets: budgetsWithProgress,
          summary: {
            totalAllocated,
            totalSpent,
            totalRemaining: Math.max(0, totalAllocated - totalSpent),
            healthyCount,
            nearLimitCount,
            overBudgetCount,
            totalBudgets: budgets.length,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async createBudget(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { categoryId, amount, period } = req.body;

      if (!categoryId || !amount) {
        return res.status(400).json({ success: false, error: 'Category and amount are required.' });
      }

      const existing = await prisma.budget.findFirst({ where: { userId, categoryId } });
      if (existing) {
        const updated = await prisma.budget.update({
          where: { id: existing.id },
          data: { amount: parseFloat(amount), period: period || 'MONTHLY' },
          include: { category: true },
        });
        return res.json({ success: true, data: updated });
      }

      const budget = await prisma.budget.create({
        data: {
          userId,
          categoryId,
          amount: parseFloat(amount),
          period: period || 'MONTHLY',
        },
        include: { category: true },
      });

      res.status(201).json({ success: true, data: budget });
    } catch (error) {
      next(error);
    }
  }

  static async updateBudget(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const { categoryId, amount, period } = req.body;

      const existing = await prisma.budget.findFirst({ where: { id, userId } });
      if (!existing) return res.status(404).json({ success: false, error: 'Budget not found.' });

      const updated = await prisma.budget.update({
        where: { id },
        data: {
          ...(categoryId && { categoryId }),
          ...(amount !== undefined && { amount: parseFloat(amount) }),
          ...(period && { period }),
        },
        include: { category: true },
      });

      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  static async deleteBudget(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      const existing = await prisma.budget.findFirst({ where: { id, userId } });
      if (!existing) return res.status(404).json({ success: false, error: 'Budget not found.' });

      await prisma.budget.delete({ where: { id } });
      res.json({ success: true, message: 'Budget deleted successfully.' });
    } catch (error) {
      next(error);
    }
  }
}
