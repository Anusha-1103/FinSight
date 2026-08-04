"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimiter_middleware_1 = require("../middleware/rateLimiter.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(6),
        name: zod_1.z.string().min(2),
        currency: zod_1.z.string().optional(),
    }),
});
const loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(1),
    }),
});
router.post('/register', rateLimiter_middleware_1.authRateLimiter, (0, validate_middleware_1.validateRequest)(registerSchema), auth_controller_1.AuthController.register);
router.post('/login', rateLimiter_middleware_1.authRateLimiter, (0, validate_middleware_1.validateRequest)(loginSchema), auth_controller_1.AuthController.login);
router.post('/refresh', auth_controller_1.AuthController.refreshToken);
router.post('/logout', auth_middleware_1.authenticateJWT, auth_controller_1.AuthController.logout);
router.get('/me', auth_middleware_1.authenticateJWT, auth_controller_1.AuthController.me);
exports.default = router;
