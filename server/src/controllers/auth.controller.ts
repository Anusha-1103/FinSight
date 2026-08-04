import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/db';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.utils';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { AuditService } from '../services/audit.service';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name, currency } = req.body;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(400).json({ success: false, error: 'User with this email already exists.' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name,
          currency: currency || 'USD',
          role: 'USER',
        },
      });

      // Default system categories & sample account for immediate usability
      const checkingAcc = await prisma.account.create({
        data: {
          userId: user.id,
          name: 'Primary Checking',
          type: 'CHECKING',
          balance: 5000.0,
          color: '#6366f1',
          icon: 'Landmark',
        },
      });

      await prisma.category.createMany({
        data: [
          { userId: user.id, name: 'Salary', type: 'INCOME', icon: 'Briefcase', color: '#10b981', isSystem: true },
          { userId: user.id, name: 'Groceries', type: 'EXPENSE', icon: 'ShoppingBag', color: '#f59e0b', isSystem: true },
          { userId: user.id, name: 'Dining Out', type: 'EXPENSE', icon: 'Utensils', color: '#ef4444', isSystem: true },
          { userId: user.id, name: 'Utilities', type: 'EXPENSE', icon: 'Zap', color: '#3b82f6', isSystem: true },
          { userId: user.id, name: 'Subscriptions', type: 'EXPENSE', icon: 'Tv', color: '#8b5cf6', isSystem: true },
        ],
      });

      const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role });
      const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role });

      // Save refresh token
      await prisma.refreshToken.create({
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

      await AuditService.log(user.id, 'REGISTER', 'User', user.id, { email: user.email }, req.ip, req.headers['user-agent']);

      res.status(201).json({
        success: true,
        data: {
          user: { id: user.id, email: user.email, name: user.name, role: user.role, currency: user.currency, theme: user.theme },
          accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid email or password credentials.' });
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ success: false, error: 'Invalid email or password credentials.' });
      }

      const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role });
      const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role });

      // Revoke old tokens & store new refresh token
      await prisma.refreshToken.updateMany({
        where: { userId: user.id },
        data: { isRevoked: true },
      });

      await prisma.refreshToken.create({
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

      await AuditService.log(user.id, 'LOGIN', 'User', user.id, { email: user.email }, req.ip, req.headers['user-agent']);

      res.json({
        success: true,
        data: {
          user: { id: user.id, email: user.email, name: user.name, role: user.role, currency: user.currency, theme: user.theme, avatarUrl: user.avatarUrl },
          accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const tokenFromCookie = req.cookies.refreshToken || req.body.refreshToken;
      if (!tokenFromCookie) {
        return res.status(401).json({ success: false, error: 'Refresh token required.' });
      }

      const payload = verifyRefreshToken(tokenFromCookie);
      const storedToken = await prisma.refreshToken.findUnique({ where: { token: tokenFromCookie } });

      if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
        return res.status(401).json({ success: false, error: 'Invalid, revoked, or expired refresh token.' });
      }

      // Token rotation
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { isRevoked: true },
      });

      const newAccessToken = generateAccessToken({ userId: payload.userId, email: payload.email, role: payload.role });
      const newRefreshToken = generateRefreshToken({ userId: payload.userId, email: payload.email, role: payload.role });

      await prisma.refreshToken.create({
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
    } catch (error) {
      res.status(401).json({ success: false, error: 'Failed to refresh access token.' });
    }
  }

  static async logout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tokenFromCookie = req.cookies.refreshToken || req.body.refreshToken;
      if (tokenFromCookie) {
        await prisma.refreshToken.updateMany({
          where: { token: tokenFromCookie },
          data: { isRevoked: true },
        });
      }

      res.clearCookie('refreshToken');
      if (req.user) {
        await AuditService.log(req.user.userId, 'LOGOUT', 'User', req.user.userId, {}, req.ip, req.headers['user-agent']);
      }

      res.json({ success: true, message: 'Logged out successfully.' });
    } catch (error) {
      next(error);
    }
  }

  static async me(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized.' });

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { id: true, email: true, name: true, role: true, currency: true, theme: true, avatarUrl: true, createdAt: true },
      });

      if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }
}
