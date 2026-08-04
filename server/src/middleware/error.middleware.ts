import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.utils';
import { env } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error(`[Error] ${req.method} ${req.originalUrl}: ${message}`, {
    stack: err.stack,
    ip: req.ip,
  });

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
};
