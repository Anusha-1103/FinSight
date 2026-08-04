"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const logger_utils_1 = require("../utils/logger.utils");
const env_1 = require("../config/env");
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    logger_utils_1.logger.error(`[Error] ${req.method} ${req.originalUrl}: ${message}`, {
        stack: err.stack,
        ip: req.ip,
    });
    res.status(statusCode).json({
        success: false,
        error: message,
        ...(env_1.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
    });
};
exports.errorHandler = errorHandler;
