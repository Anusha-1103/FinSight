"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const db_1 = require("../config/db");
class NotificationController {
    static async getNotifications(req, res, next) {
        try {
            const userId = req.user.userId;
            const notifications = await db_1.prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 30,
            });
            res.json({ success: true, data: notifications });
        }
        catch (error) {
            next(error);
        }
    }
    static async markAsRead(req, res, next) {
        try {
            const userId = req.user.userId;
            const { id } = req.params;
            if (id === 'all') {
                await db_1.prisma.notification.updateMany({
                    where: { userId, isRead: false },
                    data: { isRead: true },
                });
            }
            else {
                await db_1.prisma.notification.update({
                    where: { id },
                    data: { isRead: true },
                });
            }
            res.json({ success: true, message: 'Notifications marked as read.' });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.NotificationController = NotificationController;
