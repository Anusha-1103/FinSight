"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const db_1 = require("../config/db");
const logger_utils_1 = require("../utils/logger.utils");
class AuditService {
    static async log(userId, action, entity, entityId, details, reqIp, userAgent) {
        try {
            await db_1.prisma.activityLog.create({
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
        }
        catch (error) {
            logger_utils_1.logger.error('Failed to write activity log:', error);
        }
    }
}
exports.AuditService = AuditService;
