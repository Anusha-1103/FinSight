# FinSight AI - Architecture Documentation

FinSight AI is a full-stack personal finance and wealth management application. It uses a React + TypeScript frontend, an Express + TypeScript REST API, Prisma ORM, PostgreSQL, Redis, Gemini AI, and Cloudinary-backed receipt handling. The system is designed as a decoupled client-server application where the browser communicates with the backend through secured REST endpoints.

## 1. High-Level Architecture Diagram

```mermaid
flowchart TB
  user[User / Student / Finance Manager]

  subgraph client["Frontend - React 18, Vite, TypeScript, Tailwind"]
    pages[Pages: Dashboard, Transactions, Accounts, Analytics, AI Advisor, Admin]
    layout[MainLayout, Sidebar, Header, Notifications]
    state[Contexts: Auth, Theme, Toast]
    query[React Query cache]
    axios[Axios API client with token refresh interceptor]
  end

  subgraph api["Backend - Node.js, Express, TypeScript"]
    security[Security middleware: Helmet, CORS, XSS clean, Rate limit]
    routes["/api/v1 routes"]
    auth[JWT auth and RBAC middleware]
    controllers[Controllers]
    services[Services: AI, Financial Health, Cache, Audit, Cloudinary]
    swagger[Swagger API docs]
  end

  subgraph data["Data and External Services"]
    prisma[Prisma ORM]
    postgres[(PostgreSQL database)]
    redis[(Redis cache / rate limit store)]
    gemini[Google Gemini AI]
    cloudinary[Cloudinary receipt storage]
  end

  user --> pages
  pages --> layout
  pages --> state
  pages --> query
  query --> axios
  axios -->|HTTPS REST + Bearer access token + refresh cookie| security
  security --> routes
  routes --> auth
  auth --> controllers
  controllers --> services
  controllers --> prisma
  services --> prisma
  services --> redis
  services --> gemini
  services --> cloudinary
  prisma --> postgres
  api --> swagger
```

## 2. Deployment Architecture

```mermaid
flowchart LR
  browser[Browser]
  client[client container<br/>Vite React app<br/>port 5173]
  server[server container<br/>Express API<br/>port 5000]
  db[(postgres container<br/>PostgreSQL 15<br/>port 5432)]
  cache[(redis container<br/>Redis 7<br/>port 6379)]
  ai[Gemini API]
  media[Cloudinary]

  browser --> client
  client -->|VITE_API_URL=http://localhost:5000/api/v1| server
  server -->|DATABASE_URL| db
  server -->|REDIS_URL| cache
  server -->|GEMINI_API_KEY| ai
  server -->|receipt image upload| media
```

The local Docker setup is defined in `docker-compose.yml`. It starts four main services: PostgreSQL, Redis, the Express backend, and the React frontend. The Prisma schema targets PostgreSQL through the `DATABASE_URL` environment variable.

## 3. Source Code Organization

```text
FinSight/
├── client/                       React frontend
│   ├── src/
│   │   ├── pages/                Feature screens and route pages
│   │   ├── components/           Reusable UI, layout, and AI components
│   │   ├── context/              Auth, theme, and toast providers
│   │   ├── lib/                  Axios API client and shared utilities
│   │   └── types/                Shared frontend TypeScript models
│   └── tests/                    Playwright end-to-end tests
├── server/                       Express backend
│   ├── prisma/                   Prisma schema, migrations, seed script
│   ├── src/
│   │   ├── config/               Environment, DB, Redis, Swagger setup
│   │   ├── controllers/          Request handlers for each module
│   │   ├── middleware/           Auth, validation, rate limiting, errors
│   │   ├── routes/               REST route definitions
│   │   ├── services/             Business logic and integrations
│   │   └── utils/                JWT and logging helpers
│   └── tests/                    Jest + Supertest backend tests
├── README.md                     Project introduction and quick start
├── API_REFERENCE.md              REST API summary
├── PRODUCT_OVERVIEW.md           Feature overview
├── ARCHITECTURE.md               This architecture document
└── docker-compose.yml            Local container orchestration
```

## 4. Frontend Architecture

The frontend is a single-page application built with React 18, Vite, TypeScript, Tailwind CSS, React Router, React Query, Axios, Recharts, Framer Motion, and Lucide icons.

### Main Responsibilities

- Render protected finance pages such as Dashboard, Transactions, Budgets and Goals, Subscriptions, Analytics, Accounts, AI Advisor, Notifications, Settings, and Admin Panel.
- Manage login state through `AuthContext`.
- Use `ThemeContext` and `ToastContext` for application-wide UI behavior.
- Cache server data with React Query.
- Use lazy-loaded pages in `App.tsx` to split route bundles and reduce first-load cost.
- Call backend APIs through `client/src/lib/api.ts`.

### Frontend Request Flow

```mermaid
sequenceDiagram
  participant U as User
  participant P as React Page
  participant Q as React Query
  participant A as Axios Client
  participant B as Express API

  U->>P: Opens dashboard or feature page
  P->>Q: Request data
  Q->>A: Execute API call
  A->>B: Send Bearer access token
  B-->>A: Return JSON response
  A-->>Q: Resolve response
  Q-->>P: Update cached data
  P-->>U: Render charts, cards, tables, and alerts
```

If an API call returns `401`, the Axios response interceptor calls `/auth/refresh` using the refresh token cookie. When refresh succeeds, a new access token is stored and the original request is retried automatically.

## 5. Backend Architecture

The backend is an Express API written in TypeScript. The server entry point is `server/src/server.ts`. It configures security middleware, JSON parsing, cookie parsing, rate limiting, Swagger documentation, route mounting, a health check, and a global error handler.

### Backend Layers

```mermaid
flowchart TD
  request[HTTP request]
  middleware[Global middleware<br/>Helmet, CORS, XSS, JSON parser, cookie parser, rate limiter]
  route[Route module]
  auth[JWT authentication / role authorization]
  validate[Zod validation where required]
  controller[Controller]
  service[Service layer]
  prisma[Prisma client]
  database[(PostgreSQL)]
  response[JSON response]

  request --> middleware --> route --> auth --> validate --> controller
  controller --> service
  controller --> prisma
  service --> prisma
  prisma --> database
  controller --> response
```

### API Modules

| Module | Main Routes | Purpose |
| --- | --- | --- |
| Authentication | `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me` | User registration, login, session refresh, logout, profile lookup |
| Users | `/users/profile` | Update profile information |
| Accounts | `/accounts` | Manage bank, cash, credit card, loan, and investment accounts |
| Categories | `/categories` | List system and user categories |
| Transactions | `/transactions`, `/transactions/scan-receipt` | Track income, expenses, transfers, and receipt scanning |
| Subscriptions | `/subscriptions`, `/subscriptions/:id/record-payment` | Manage recurring bills and record subscription payments |
| Budgets | `/budgets` | Create and track category budgets |
| Goals | `/goals` | Track savings and financial goals |
| Dashboard | `/dashboard`, `/dashboard/summary` | Return combined financial KPIs and widgets |
| Analytics | `/analytics` | Return spending and financial analytics |
| AI | `/ai/summary`, `/ai/chat`, `/ai/insights` | Generate AI reports, chat responses, and insights |
| Notifications | `/notifications`, `/notifications/:id/read` | Display and mark notifications |
| Admin | `/admin/users`, `/admin/metrics`, `/admin/audit-logs` | Admin-only user, system, and audit views |

## 6. Database Architecture

Prisma models define the relational data structure. The main user-owned data model is:

```mermaid
erDiagram
  User ||--o{ Account : owns
  User ||--o{ Category : creates
  User ||--o{ Transaction : records
  User ||--o{ Subscription : tracks
  User ||--o{ Budget : defines
  User ||--o{ Goal : sets
  User ||--o{ Receipt : uploads
  User ||--o{ Notification : receives
  User ||--o{ ActivityLog : generates
  User ||--o{ AIConversation : has
  User ||--o{ AIInsight : receives
  User ||--o{ RefreshToken : owns

  Account ||--o{ Transaction : contains
  Category ||--o{ Transaction : classifies
  Category ||--o{ Subscription : classifies
  Category ||--o{ Budget : budgets
  Receipt ||--o| Transaction : attaches_to
```

### Important Entities

- `User`: Stores identity, role, currency, theme, and profile details.
- `RefreshToken`: Stores refresh tokens and revocation status for session rotation.
- `Account`: Stores financial account balances and account types.
- `Category`: Stores income and expense categories.
- `Transaction`: Stores income, expense, and transfer records.
- `Subscription`: Stores recurring bill information and next billing dates.
- `Budget`: Stores category budget limits.
- `Goal`: Stores target amounts and progress for savings goals.
- `Receipt`: Stores OCR output and Cloudinary metadata.
- `Notification`: Stores alerts such as budget alerts and bills due.
- `ActivityLog`: Stores audit trail events.
- `AIConversation` and `AIInsight`: Store AI assistant conversations and generated insights.

## 7. Authentication and Security Flow

```mermaid
sequenceDiagram
  participant U as User
  participant C as React Client
  participant API as Express API
  participant DB as PostgreSQL

  U->>C: Enter email and password
  C->>API: POST /api/v1/auth/login
  API->>DB: Find user and compare bcrypt password hash
  DB-->>API: User record
  API->>DB: Revoke old refresh tokens and store new refresh token
  API-->>C: Access token in JSON + refresh token in HttpOnly cookie
  C->>API: Future API calls with Authorization: Bearer access-token
  API-->>C: Protected finance data
  C->>API: If access token expires, POST /auth/refresh with cookie
  API->>DB: Validate and rotate refresh token
  API-->>C: New access token
```

Security controls implemented in the codebase include:

- Password hashing with `bcryptjs`.
- Access tokens and refresh tokens with JWT.
- Refresh token rotation and server-side revocation.
- `HttpOnly` refresh-token cookies using `SameSite=Lax`.
- Role-based access control for admin routes.
- Helmet security headers.
- CORS with a frontend origin allow-list.
- XSS sanitization.
- Rate limiting for API and authentication endpoints.
- Zod validation for authentication payloads.
- Audit logging for important auth events.

## 8. Financial Dashboard Working

The dashboard combines many data sources into one response. `DashboardController.getSummary` queries accounts, transactions, categories, subscriptions, budgets, goals, notifications, and the financial health service.

```mermaid
flowchart TD
  dashboard[GET /api/v1/dashboard/summary]
  parallel[Parallel database queries]
  accounts[Accounts]
  tx[Transactions]
  budgets[Budgets]
  goals[Goals]
  subscriptions[Subscriptions]
  notifications[Notifications]
  health[FinancialHealthService]
  response[Dashboard response]

  dashboard --> parallel
  parallel --> accounts
  parallel --> tx
  parallel --> budgets
  parallel --> goals
  parallel --> subscriptions
  parallel --> notifications
  parallel --> health
  accounts --> response
  tx --> response
  budgets --> response
  goals --> response
  subscriptions --> response
  notifications --> response
  health --> response
```

The dashboard response includes net worth, monthly income, monthly expenses, cash flow, savings rate, account count, top spending categories, largest transactions, subscription spend, upcoming bills, budget burn rate, savings goal progress, spending heatmap, net worth trend, recent activity, notifications, and a financial health score.

## 9. Financial Health Score Engine

`FinancialHealthService.calculateHealthScore` produces a composite score from five weighted factors:

| Factor | Weight | Calculation Meaning |
| --- | ---: | --- |
| Savings rate | 25% | Measures monthly income retained after expenses |
| Budget adherence | 25% | Measures whether budget categories are within limits |
| Debt ratio | 20% | Compares liabilities against total capital |
| Emergency fund | 15% | Estimates how many months expenses can be covered by liquid cash |
| Investment ratio | 15% | Measures investment allocation relative to net worth |

The service also assigns grades from `A+` to `F` and returns practical recommendations based on weak areas.

## 10. AI Advisor and Receipt OCR Working

```mermaid
flowchart TD
  userPrompt[User asks AI question]
  aiRoute[POST /api/v1/ai/chat]
  contextBuilder[Build financial context from accounts, budgets, goals, subscriptions, transactions]
  gemini[Gemini model]
  suggestions[Generate suggested actions]
  aiResponse[Return assistant response]

  userPrompt --> aiRoute --> contextBuilder --> gemini --> suggestions --> aiResponse
```

The AI service builds a structured financial context block containing the user's account balances, cash flow, budgets, goals, subscriptions, and recent transactions. Gemini uses that context to generate finance-specific answers. The service also generates suggested actions such as transferring savings, auditing subscriptions, or reviewing over-budget categories.

Receipt scanning is exposed through `POST /api/v1/transactions/scan-receipt`. The route accepts an uploaded file through Multer, sends the receipt image to Gemini Vision when configured, extracts merchant, amount, date, and category, and stores receipt-related metadata.

## 11. Caching and Performance

Redis is used for caching and rate-limiting support. The architecture supports an in-memory fallback when Redis is unavailable. Frontend performance is supported by React Query caching and lazy-loaded route components. Backend dashboard performance is improved through parallel Prisma queries.

## 12. Error Handling and Validation

- Global Express error handling is registered after all routes.
- Authentication routes use Zod validation for register and login payloads.
- Protected routes use `authenticateJWT`.
- Admin routes use both `authenticateJWT` and `requireRole(['ADMIN'])`.
- Axios interceptors handle expired access tokens and redirect to login when refresh fails.

## 13. Testing Strategy

- Backend tests use Jest and Supertest.
- Frontend end-to-end tests use Playwright.
- TypeScript build checks are available in both client and server packages.
- Swagger documentation is available at `http://localhost:5000/api-docs` when the backend is running.

## 14. Summary

FinSight AI follows a clean full-stack architecture with separate presentation, API, service, and data layers. It demonstrates modern web development practices including typed frontend development, REST APIs, ORM-based database access, secure token-based authentication, role-based authorization, AI integration, receipt OCR, financial analytics, containerized deployment, and project documentation suitable for academic demonstration and future enhancement.
