import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { logger } from './utils/logger.utils';
import { apiRateLimiter } from './middleware/rateLimiter.middleware';
import { errorHandler } from './middleware/error.middleware';
import { swaggerSpec } from './config/swagger';
import routes from './routes';
const xss = require('xss-clean');

const app = express();

// Security Headers & Policy
app.use(helmet());
app.use(xss());

// CORS configuration for React client
app.use(
  cors({
    origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body Parsers & Cookies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate Limiting
app.use('/api/', apiRateLimiter);

// OpenAPI Swagger UI Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes
app.use('/api/v1', routes);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'FinSight AI Backend' });
});

// Global Error Handler
app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 FinSight AI Server running on port ${env.PORT} in ${env.NODE_ENV} mode.`);
  logger.info(`📖 Swagger Documentation available at http://localhost:${env.PORT}/api-docs`);
});

export default app;
