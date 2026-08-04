"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const env_1 = require("./config/env");
const logger_utils_1 = require("./utils/logger.utils");
const rateLimiter_middleware_1 = require("./middleware/rateLimiter.middleware");
const error_middleware_1 = require("./middleware/error.middleware");
const swagger_1 = require("./config/swagger");
const routes_1 = __importDefault(require("./routes"));
const xss = require('xss-clean');
const app = (0, express_1.default)();
// Security Headers & Policy
app.use((0, helmet_1.default)());
app.use(xss());
// CORS configuration for React client
app.use((0, cors_1.default)({
    origin: [env_1.env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Body Parsers & Cookies
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, cookie_parser_1.default)());
// Rate Limiting
app.use('/api/', rateLimiter_middleware_1.apiRateLimiter);
// OpenAPI Swagger UI Documentation
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec));
// API Routes
app.use('/api/v1', routes_1.default);
// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'FinSight AI Backend' });
});
// Global Error Handler
app.use(error_middleware_1.errorHandler);
const server = app.listen(env_1.env.PORT, () => {
    logger_utils_1.logger.info(`🚀 FinSight AI Server running on port ${env_1.env.PORT} in ${env_1.env.NODE_ENV} mode.`);
    logger_utils_1.logger.info(`📖 Swagger Documentation available at http://localhost:${env_1.env.PORT}/api-docs`);
});
exports.default = app;
