# FinSight AI — API Reference Documentation

All endpoints are mounted under `/api/v1`. Interactive Swagger UI docs available at `http://localhost:5000/api-docs`.

## Authentication
- `POST /api/v1/auth/register` — Register new user account.
- `POST /api/v1/auth/login` — Login with email/password.
- `POST /api/v1/auth/refresh` — Refresh access token using cookie.
- `POST /api/v1/auth/logout` — Revoke session refresh tokens.
- `GET /api/v1/auth/me` — Fetch current user profile.

## Transactions
- `GET /api/v1/transactions` — Query transactions (search, filter, pagination).
- `POST /api/v1/transactions` — Create transaction entry.
- `PUT /api/v1/transactions/:id` — Update transaction.
- `DELETE /api/v1/transactions/:id` — Delete transaction.
- `POST /api/v1/transactions/scan-receipt` — OCR scan receipt file via Gemini Vision.

## Dashboard & AI
- `GET /api/v1/dashboard/summary` — Fetch executive dashboard metrics & 8 widgets.
- `POST /api/v1/ai/chat` — Send prompt to Gemini AI advisor.
- `GET /api/v1/ai/insights` — Fetch spending anomalies & insights.

## Administration (Admin Only)
- `GET /api/v1/admin/users` — List platform users.
- `PUT /api/v1/admin/users/:id/role` — Update user RBAC role.
- `GET /api/v1/admin/metrics` — View system memory and uptime metrics.
- `GET /api/v1/admin/audit-logs` — Fetch security audit trail logs.
