"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authenticateJWT = void 0;
const jwt_utils_1 = require("../utils/jwt.utils");
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Unauthorized. Access token required.' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = (0, jwt_utils_1.verifyAccessToken)(token);
        req.user = payload;
        next();
    }
    catch (error) {
        return res.status(401).json({ success: false, error: 'Invalid or expired access token.' });
    }
};
exports.authenticateJWT = authenticateJWT;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'Unauthorized.' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, error: 'Forbidden. Insufficient permissions.' });
        }
        next();
    };
};
exports.requireRole = requireRole;
