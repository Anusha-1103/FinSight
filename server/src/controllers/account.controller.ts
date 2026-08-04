import { Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { AuditService } from '../services/audit.service';

function getAccountColor(type: string): string {
  switch (type) {
    case 'CHECKING': return '#3b82f6';
    case 'SAVINGS': return '#10b981';
    case 'CREDIT_CARD': return '#ef4444';
    case 'INVESTMENT': return '#8b5cf6';
    case 'CASH': return '#eab308';
    case 'LOAN': return '#f97316';
    default: return '#3b82f6';
  }
}

export class AccountController {
  static async getAccounts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const accounts = await prisma.account.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      });
      res.json({ success: true, data: accounts });
    } catch (error) {
      next(error);
    }
  }

  static async createAccount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { name, type, balance, currency, color, icon, accountNumber } = req.body;
      const resolvedColor = color || getAccountColor(type || 'CHECKING');

      const account = await prisma.account.create({
        data: {
          userId,
          name,
          type,
          balance: parseFloat(balance) || 0.0,
          currency: currency || 'USD',
          color: resolvedColor,
          icon: icon || 'Wallet',
          accountNumber: accountNumber || null,
        },
      });

      await AuditService.log(userId, 'CREATE_ACCOUNT', 'Account', account.id, { name, type, balance }, req.ip, req.headers['user-agent']);

      res.status(201).json({ success: true, data: account });
    } catch (error) {
      next(error);
    }
  }

  static async updateAccount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const { name, type, balance, currency, color, icon, accountNumber } = req.body;

      const account = await prisma.account.findFirst({ where: { id, userId } });
      if (!account) return res.status(404).json({ success: false, error: 'Account not found.' });

      const resolvedType = type || account.type;
      const resolvedColor = color || getAccountColor(resolvedType);

      const updated = await prisma.account.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(type !== undefined && { type }),
          ...(balance !== undefined && { balance: parseFloat(balance) }),
          ...(currency !== undefined && { currency }),
          color: resolvedColor,
          ...(icon !== undefined && { icon }),
          ...(accountNumber !== undefined && { accountNumber }),
        },
      });

      await AuditService.log(userId, 'UPDATE_ACCOUNT', 'Account', id, { name: updated.name, type: updated.type, balance: updated.balance }, req.ip, req.headers['user-agent']);

      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  static async deleteAccount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      const account = await prisma.account.findFirst({ where: { id, userId } });
      if (!account) return res.status(404).json({ success: false, error: 'Account not found.' });

      await prisma.account.delete({ where: { id } });

      await AuditService.log(userId, 'DELETE_ACCOUNT', 'Account', id, { name: account.name }, req.ip, req.headers['user-agent']);

      res.json({ success: true, message: 'Account deleted successfully.' });
    } catch (error) {
      next(error);
    }
  }
}
