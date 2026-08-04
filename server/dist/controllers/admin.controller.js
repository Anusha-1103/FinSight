"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const db_1 = require("../config/db");
class AdminController {
    static async getUsers(req, res, next) {
        try {
            const users = await db_1.prisma.user.findMany({
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
        }
        catch (error) {
            next(error);
        }
    }
    static async updateUserRole(req, res, next) {
        try {
            const { id } = req.params;
            const { role } = req.body;
            if (!['USER', 'ADMIN'].includes(role)) {
                return res.status(400).json({ success: false, error: 'Invalid role.' });
            }
            const updated = await db_1.prisma.user.update({
                where: { id },
                data: { role: role },
                select: { id: true, email: true, name: true, role: true },
            });
            res.json({ success: true, data: updated });
        }
        catch (error) {
            next(error);
        }
    }
    static async getSystemMetrics(req, res, next) {
        try {
            const [totalUsers, totalTransactions, totalAccounts, totalVolume] = await Promise.all([
                db_1.prisma.user.count(),
                db_1.prisma.transaction.count(),
                db_1.prisma.account.count(),
                db_1.prisma.transaction.aggregate({ _sum: { amount: true } }),
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
        }
        catch (error) {
            next(error);
        }
    }
    static async getAuditLogs(req, res, next) {
        try {
            const logs = await db_1.prisma.activityLog.findMany({
                include: {
                    user: { select: { id: true, email: true, name: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: 50,
            });
            res.json({ success: true, data: logs });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AdminController = AdminController;
