import { Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Food', icon: 'Utensils', color: '#ef4444' },
  { name: 'Shopping', icon: 'ShoppingBag', color: '#f59e0b' },
  { name: 'Transport', icon: 'Car', color: '#06b6d4' },
  { name: 'Bills', icon: 'Home', color: '#3b82f6' },
  { name: 'Entertainment', icon: 'Tv', color: '#8b5cf6' },
  { name: 'Healthcare', icon: 'HeartPulse', color: '#ec4899' },
  { name: 'Travel', icon: 'Plane', color: '#14b8a6' },
  { name: 'Education', icon: 'GraduationCap', color: '#6366f1' },
  { name: 'Investment', icon: 'TrendingUp', color: '#10b981' },
  { name: 'Other', icon: 'Tag', color: '#94a3b8' },
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salary', icon: 'Briefcase', color: '#10b981' },
  { name: 'Freelance', icon: 'Laptop', color: '#06b6d4' },
  { name: 'Interest', icon: 'Percent', color: '#3b82f6' },
  { name: 'Dividend', icon: 'Coins', color: '#8b5cf6' },
  { name: 'Refund', icon: 'RefreshCw', color: '#f59e0b' },
  { name: 'Gift', icon: 'Gift', color: '#ec4899' },
  { name: 'Other', icon: 'Tag', color: '#94a3b8' },
];

export class CategoryController {
  static async getCategories(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      let categories = await prisma.category.findMany({
        where: {
          OR: [{ userId }, { userId: null }, { isSystem: true }],
        },
        orderBy: { name: 'asc' },
      });

      // Auto-seed default categories if empty
      if (categories.length === 0) {
        for (const cat of DEFAULT_EXPENSE_CATEGORIES) {
          await prisma.category.create({
            data: { userId, name: cat.name, type: 'EXPENSE', icon: cat.icon, color: cat.color, isSystem: true },
          });
        }
        for (const cat of DEFAULT_INCOME_CATEGORIES) {
          await prisma.category.create({
            data: { userId, name: cat.name, type: 'INCOME', icon: cat.icon, color: cat.color, isSystem: true },
          });
        }
        categories = await prisma.category.findMany({
          where: { OR: [{ userId }, { userId: null }, { isSystem: true }] },
          orderBy: { name: 'asc' },
        });
      }

      res.json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  }
}
