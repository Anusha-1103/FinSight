import { Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { AuditService } from '../services/audit.service';

export class UserController {
  static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { name, currency, theme, avatarUrl } = req.body;

      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(name && { name }),
          ...(currency && { currency }),
          ...(theme && { theme }),
          ...(avatarUrl !== undefined && { avatarUrl }),
        },
        select: { id: true, email: true, name: true, role: true, currency: true, theme: true, avatarUrl: true },
      });

      await AuditService.log(userId, 'UPDATE_PROFILE', 'User', userId, { name, currency, theme }, req.ip, req.headers['user-agent']);

      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }
}
