import { prisma } from '../config/db';
import { logger } from '../utils/logger.utils';

export class AuditService {
  static async log(userId: string, action: string, entity: string, entityId?: string, details?: any, reqIp?: string, userAgent?: string) {
    try {
      await prisma.activityLog.create({
        data: {
          userId,
          action,
          entity,
          entityId,
          details: details ? JSON.stringify(details) : null,
          ipAddress: reqIp || null,
          userAgent: userAgent || null,
        },
      });
    } catch (error) {
      logger.error('Failed to write activity log:', error);
    }
  }
}
