import { Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

export class AdminController {
  static async getUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          currency: true,
          createdAt: true,
          _count: {
            select: { transactions: true, accounts: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  }

  static async updateUserRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!['USER', 'ADMIN'].includes(role)) {
        return res.status(400).json({ success: false, error: 'Invalid role.' });
      }

      const updated = await prisma.user.update({
        where: { id },
        data: { role: role as Role },
        select: { id: true, email: true, name: true, role: true },
      });

      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  static async getSystemMetrics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const [totalUsers, totalTransactions, totalAccounts, totalVolume] = await Promise.all([
        prisma.user.count(),
        prisma.transaction.count(),
        prisma.account.count(),
        prisma.transaction.aggregate({ _sum: { amount: true } }),
      ]);

      res.json({
        success: true,
        data: {
          totalUsers,
          totalTransactions,
          totalAccounts,
          totalVolume: totalVolume._sum.amount || 0,
          serverUptimeSeconds: Math.round(process.uptime()),
          memoryUsageMB: Math.round(process.memoryUsage().rss / (1024 * 1024)),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAuditLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const logs = await prisma.activityLog.findMany({
        include: {
          user: { select: { id: true, email: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      res.json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  }
}
