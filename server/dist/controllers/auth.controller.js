"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../config/db");
const jwt_utils_1 = require("../utils/jwt.utils");
const audit_service_1 = require("../services/audit.service");
class AuthController {
    static async register(req, res, next) {
        try {
            const { email, password, name, currency } = req.body;
            const existing = await db_1.prisma.user.findUnique({ where: { email } });
            if (existing) {
                return res.status(400).json({ success: false, error: 'User with this email already exists.' });
            }
            const passwordHash = await bcryptjs_1.default.hash(password, 10);
            const user = await db_1.prisma.user.create({
                data: {
                    email,
                    passwordHash,
                    name,
                    currency: currency || 'USD',
                    role: 'USER',
                },
            });
            // Default system categories & sample account for immediate usability
            const checkingAcc = await db_1.prisma.account.create({
                data: {
                    userId: user.id,
                    name: 'Primary Checking',
                    type: 'CHECKING',
                    balance: 5000.0,
                    color: '#6366f1',
                    icon: 'Landmark',
                },
            });
            await db_1.prisma.category.createMany({
                data: [
                    { userId: user.id, name: 'Salary', type: 'INCOME', icon: 'Briefcase', color: '#10b981', isSystem: true },
                    { userId: user.id, name: 'Groceries', type: 'EXPENSE', icon: 'ShoppingBag', color: '#f59e0b', isSystem: true },
                    { userId: user.id, name: 'Dining Out', type: 'EXPENSE', icon: 'Utensils', color: '#ef4444', isSystem: true },
                    { userId: user.id, name: 'Utilities', type: 'EXPENSE', icon: 'Zap', color: '#3b82f6', isSystem: true },
                    { userId: user.id, name: 'Subscriptions', type: 'EXPENSE', icon: 'Tv', color: '#8b5cf6', isSystem: true },
                ],
            });
            const accessToken = (0, jwt_utils_1.generateAccessToken)({ userId: user.id, email: user.email, role: user.role });
            const refreshToken = (0, jwt_utils_1.generateRefreshToken)({ userId: user.id, email: user.email, role: user.role });
            // Save refresh token
            await db_1.prisma.refreshToken.create({
                data: {
                    userId: user.id,
                    token: refreshToken,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
            });
            // Set Refresh Token in Secure HttpOnly Cookie
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            await audit_service_1.AuditService.log(user.id, 'REGISTER', 'User', user.id, { email: user.email }, req.ip, req.headers['user-agent']);
            res.status(201).json({
                success: true,
                data: {
                    user: { id: user.id, email: user.email, name: user.name, role: user.role, currency: user.currency, theme: user.theme },
                    accessToken,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const user = await db_1.prisma.user.findUnique({ where: { email } });
            if (!user) {
                return res.status(401).json({ success: false, error: 'Invalid email or password credentials.' });
            }
            const isValidPassword = await bcryptjs_1.default.compare(password, user.passwordHash);
            if (!isValidPassword) {
                return res.status(401).json({ success: false, error: 'Invalid email or password credentials.' });
            }
            const accessToken = (0, jwt_utils_1.generateAccessToken)({ userId: user.id, email: user.email, role: user.role });
            const refreshToken = (0, jwt_utils_1.generateRefreshToken)({ userId: user.id, email: user.email, role: user.role });
            // Revoke old tokens & store new refresh token
            await db_1.prisma.refreshToken.updateMany({
                where: { userId: user.id },
                data: { isRevoked: true },
            });
            await db_1.prisma.refreshToken.create({
                data: {
                    userId: user.id,
                    token: refreshToken,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
            });
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            await audit_service_1.AuditService.log(user.id, 'LOGIN', 'User', user.id, { email: user.email }, req.ip, req.headers['user-agent']);
            res.json({
                success: true,
                data: {
                    user: { id: user.id, email: user.email, name: user.name, role: user.role, currency: user.currency, theme: user.theme, avatarUrl: user.avatarUrl },
                    accessToken,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async refreshToken(req, res, next) {
        try {
            const tokenFromCookie = req.cookies.refreshToken || req.body.refreshToken;
            if (!tokenFromCookie) {
                return res.status(401).json({ success: false, error: 'Refresh token required.' });
            }
            const payload = (0, jwt_utils_1.verifyRefreshToken)(tokenFromCookie);
            const storedToken = await db_1.prisma.refreshToken.findUnique({ where: { token: tokenFromCookie } });
            if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
                return res.status(401).json({ success: false, error: 'Invalid, revoked, or expired refresh token.' });
            }
            // Token rotation
            await db_1.prisma.refreshToken.update({
                where: { id: storedToken.id },
                data: { isRevoked: true },
            });
            const newAccessToken = (0, jwt_utils_1.generateAccessToken)({ userId: payload.userId, email: payload.email, role: payload.role });
            const newRefreshToken = (0, jwt_utils_1.generateRefreshToken)({ userId: payload.userId, email: payload.email, role: payload.role });
            await db_1.prisma.refreshToken.create({
                data: {
                    userId: payload.userId,
                    token: newRefreshToken,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
            });
            res.cookie('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            res.json({
                success: true,
                data: {
                    accessToken: newAccessToken,
                },
            });
        }
        catch (error) {
            res.status(401).json({ success: false, error: 'Failed to refresh access token.' });
        }
    }
    static async logout(req, res, next) {
        try {
            const tokenFromCookie = req.cookies.refreshToken || req.body.refreshToken;
            if (tokenFromCookie) {
                await db_1.prisma.refreshToken.updateMany({
                    where: { token: tokenFromCookie },
                    data: { isRevoked: true },
                });
            }
            res.clearCookie('refreshToken');
            if (req.user) {
                await audit_service_1.AuditService.log(req.user.userId, 'LOGOUT', 'User', req.user.userId, {}, req.ip, req.headers['user-agent']);
            }
            res.json({ success: true, message: 'Logged out successfully.' });
        }
        catch (error) {
            next(error);
        }
    }
    static async me(req, res, next) {
        try {
            if (!req.user)
                return res.status(401).json({ success: false, error: 'Unauthorized.' });
            const user = await db_1.prisma.user.findUnique({
                where: { id: req.user.userId },
                select: { id: true, email: true, name: true, role: true, currency: true, theme: true, avatarUrl: true, createdAt: true },
            });
            if (!user)
                return res.status(404).json({ success: false, error: 'User not found.' });
            res.json({ success: true, data: user });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
