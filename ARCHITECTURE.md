# FinSight AI — Technical Architecture Specification

## Architecture Pattern
FinSight AI follows a decoupled, full-stack client-server architecture with strict clean separation of concerns.

```
Client (Vite + React + TS) ──[HTTP REST + Dual JWT]──> Express API (Node.js + TS)
                                                              │
                    ┌───────────────────┬─────────────────────┼─────────────────────┐
                    ▼                   ▼                     ▼                     ▼
           PostgreSQL 15 (Prisma)    Redis 7 Caching    Gemini AI Engine     Cloudinary OCR
```

## Security Stack
- **Dual JWT Auth**: Short-lived Access Tokens (15 min) + Refresh Tokens (7 days) with rotation in `HttpOnly` `SameSite=Lax` cookies.
- **RBAC**: Middleware level permission guards (`requireRole(['ADMIN'])`).
- **Security Headers & Validation**: Helmet headers, CORS origin whitelist, Express Rate Limiter, XSS sanitization, Zod schema validation.

## Caching Strategy
- Redis key hierarchy: `ai:chat:<hash>`, `user:session:<id>`, `rate:<ip>`.
- In-memory fallback provided when external Redis instance is disconnected.
