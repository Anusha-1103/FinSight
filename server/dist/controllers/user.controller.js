"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const db_1 = require("../config/db");
const audit_service_1 = require("../services/audit.service");
class UserController {
    static async updateProfile(req, res, next) {
        try {
            const userId = req.user.userId;
            const { name, currency, theme, avatarUrl } = req.body;
            const updated = await db_1.prisma.user.update({
                where: { id: userId },
                data: {
                    ...(name && { name }),
                    ...(currency && { currency }),
                    ...(theme && { theme }),
                    ...(avatarUrl !== undefined && { avatarUrl }),
                },
                select: { id: true, email: true, name: true, role: true, currency: true, theme: true, avatarUrl: true },
            });
            await audit_service_1.AuditService.log(userId, 'UPDATE_PROFILE', 'User', userId, { name, currency, theme }, req.ip, req.headers['user-agent']);
            res.json({ success: true, data: updated });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.UserController = UserController;
