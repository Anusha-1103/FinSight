# FinSight AI - Personal Financial Workspace

FinSight AI is a full-stack personal finance and wealth analytics platform built with React, TypeScript, Express, Prisma, PostgreSQL, Redis, and Gemini AI. It helps users track accounts, transactions, budgets, goals, subscriptions, financial health, and AI-assisted insights from one secure dashboard.

The application is designed as a modern client-server system with a Vite React frontend, an Express REST API, Prisma-managed relational data, token-based authentication, role-based access control, and optional AI-powered financial guidance.

## Features

- **Financial Dashboard**: Net worth, income, expenses, cash flow, savings rate, recent activity, spending heatmap, upcoming bills, and goal progress.
- **Accounts**: Manage checking, savings, cash, credit card, loan, and investment accounts.
- **Transactions**: Track income, expenses, transfers, merchants, categories, dates, and receipts.
- **Budgets and Goals**: Create category budgets and monitor savings goals with progress tracking.
- **Subscriptions**: Track recurring payments, renewal dates, monthly spend, and annual spend.
- **AI Advisor**: Generate contextual finance summaries, chat responses, recommendations, and spending insights with Gemini AI.
- **Receipt Scanning**: Upload receipts and extract merchant, amount, date, and category details.
- **Notifications**: Display budget, bill, anomaly, and system alerts.
- **Admin Panel**: Manage users, roles, metrics, and audit logs through admin-only routes.
- **Security**: JWT access tokens, refresh-token rotation, `HttpOnly` cookies, RBAC, rate limiting, CORS, Helmet, XSS protection, and request validation.

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, React Router |
| Data Fetching | Axios, React Query |
| UI and Charts | Recharts, Framer Motion, Lucide React |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL, Prisma ORM |
| Cache / Rate Limit Store | Redis |
| Authentication | JWT, refresh tokens, bcrypt |
| Validation and Security | Zod, Helmet, CORS, XSS Clean, Express Rate Limit |
| AI / OCR | Google Gemini AI, Multer, Cloudinary |
| Testing | Jest, Supertest, Playwright |
| Deployment | Docker, Docker Compose |

## Architecture

```text
FinSight/
├── docker-compose.yml
├── server/                      Express + TypeScript backend
│   ├── prisma/                  Prisma schema, migrations, and seed data
│   ├── src/
│   │   ├── config/              Environment, database, Redis, Swagger setup
│   │   ├── controllers/         Request handlers for each API module
│   │   ├── middleware/          Auth, validation, rate limiting, errors
│   │   ├── routes/              REST route definitions under /api/v1
│   │   ├── services/            AI, financial health, cache, audit, Cloudinary
│   │   └── utils/               JWT and logging helpers
│   └── tests/                   Jest + Supertest tests
└── client/                      React + Vite frontend
    ├── src/
    │   ├── components/          UI, layout, and AI components
    │   ├── context/             Auth, theme, and toast providers
    │   ├── lib/                 Axios client and utilities
    │   ├── pages/               App screens and protected routes
    │   └── types/               Frontend TypeScript models
    └── tests/                   Playwright end-to-end tests
```

For detailed system diagrams and implementation flow, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Documentation

- [Architecture](./ARCHITECTURE.md) - system diagrams, backend/frontend layers, auth flow, database design, dashboard flow, AI/OCR flow.
- [API Reference](./API_REFERENCE.md) - REST endpoint summary.
- [Product Overview](./PRODUCT_OVERVIEW.md) - product features and capabilities.
- [Deployment Guide](./DEPLOYMENT.md) - deployment and environment notes.
- [Contributing](./CONTRIBUTING.md) - contribution workflow.
- [Case Study](./CASE_STUDY.md) - project case study.
- [Changelog](./CHANGELOG.md) - release notes.

## Prerequisites

- Node.js 20+
- PostgreSQL 15+ or Docker Compose
- Redis 7+ or Docker Compose
- Gemini API key for AI features
- Cloudinary credentials for receipt image storage, if using upload workflows

## Quick Start

### Option A: Docker Compose

```bash
docker-compose up --build
```

Services:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- Swagger API docs: `http://localhost:5000/api-docs`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

### Option B: Local Development

Backend:

```bash
cd server
npm ci
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Frontend:

```bash
cd client
npm ci
npm run dev
```

## Environment Variables

The backend expects values such as:

```bash
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/finsight_db?schema=public
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

The frontend can point to the backend API with:

```bash
VITE_API_URL=http://localhost:5000/api/v1
```

## API Modules

All API endpoints are mounted under `/api/v1`.

| Module | Base Route | Purpose |
| --- | --- | --- |
| Auth | `/auth` | Register, login, refresh, logout, current user |
| Users | `/users` | Profile updates |
| Accounts | `/accounts` | Account CRUD |
| Categories | `/categories` | Category listing |
| Transactions | `/transactions` | Transaction CRUD and receipt scanning |
| Subscriptions | `/subscriptions` | Recurring payment tracking |
| Budgets | `/budgets` | Category budget tracking |
| Goals | `/goals` | Savings goal tracking |
| Dashboard | `/dashboard` | Combined financial KPIs and widgets |
| Analytics | `/analytics` | Spending and trend analytics |
| AI | `/ai` | Summary, chat, and insights |
| Notifications | `/notifications` | Alert listing and read status |
| Admin | `/admin` | Admin-only users, metrics, and audit logs |

## Testing

Backend tests:

```bash
cd server
npm test
```

Backend build:

```bash
cd server
npm run build
```

Frontend build:

```bash
cd client
npm run build
```

Frontend end-to-end tests:

```bash
cd client
npm run test:e2e
```

## Security

FinSight AI includes multiple security controls:

- Password hashing with bcrypt.
- Access tokens for API authorization.
- Refresh tokens with server-side revocation and rotation.
- `HttpOnly` refresh-token cookie support.
- Role-based access control for admin routes.
- Helmet security headers.
- CORS origin allow-list.
- XSS sanitization.
- API and auth rate limiting.
- Zod request validation on authentication routes.
- Audit logging for important auth and admin actions.

## License

This project is licensed under the terms in [LICENSE](./LICENSE).
