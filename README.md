# FinSight AI — Personal Financial Workspace & Wealth Platform

> **A calm, intelligent personal finance workspace engineered for absolute visual and quantitative clarity.**

FinSight AI combines modern full-stack enterprise architecture with a warm editorial luxury design system inspired by Apple, Notion, Mercury Bank, and Kinfolk Magazine.

---

## 🏛️ Architecture Overview

```
FinSight/
├── .github/workflows/ci.yml     # Automated CI build & test pipeline
├── docker-compose.yml           # PostgreSQL 15, Redis 7, Express API, Vite Client
├── server/                      # Express + TypeScript + PostgreSQL + Prisma + Redis Backend
│   ├── prisma/                  # PostgreSQL schema and seed scripts
│   ├── src/
│   │   ├── config/              # Env, DB, Redis, Cloudinary, Gemini, Swagger
│   │   ├── controllers/         # Auth, Accounts, Transactions, Subscriptions, Budgets, Goals, AI, Admin
│   │   ├── middleware/          # JWT, RBAC, Helmet, Rate Limiter, Error Handler, Zod Validator
│   │   ├── routes/              # OpenAPI REST endpoints (/api/v1)
│   │   ├── services/            # Financial Health Engine, Gemini AI, Cloudinary OCR, Cache
│   │   └── server.ts            # Server entry point
│   └── tests/                   # Jest + Supertest integration tests
└── client/                      # React 18 + Vite + TypeScript + Tailwind CSS Frontend
    ├── src/
    │   ├── components/
    │   │   ├── ui/              # Button, Card, Input, Modal, Table, Badge, Progress, Toast, ErrorBoundary
    │   │   ├── layout/          # Sidebar, Header, MainLayout, NotificationsPopover
    │   │   └── ai/              # AIChatDrawer assistant
    │   ├── context/             # AuthContext (Dual-Token), ThemeContext, ToastContext
    │   ├── lib/                 # Axios with refresh token interceptor, Formatters, Design Tokens
    │   ├── pages/               # Dashboard, Transactions, Subscriptions, AIAdvisor, BudgetsGoals, Analytics, Accounts, AdminPanel, Notifications, Settings, Login, Register
    │   └── types/               # TypeScript data models
    └── tests/                   # Playwright E2E browser tests
```

---

## 🎨 Master Design System Tokens

The visual identity is defined as **Warm Editorial Minimalism**:
- **Canvas Base**: Soft Warm Sand (`#FBF9F5` Light) / Warm Charcoal (`#121212` Dark).
- **Surface Cards**: Honed Travertine Stone (`#F3EFEA` / `#1C1C1E`) with hairline borders (`rgba(0,0,0,0.06)`).
- **Accents**: Muted Champagne Gold (`#C5A059`), Muted Sage Green (`#4A7C59`), Terracotta (`#C86D51`), Amber Ochre (`#D99B26`).
- **Typography**: Editorial Display Serif (*Newsreader*), Humane UI Sans (*Inter*), Tabular Monospace (*Geist Mono*).

---

## ⚡ Quick Start Guide

### Prerequisites
- Node.js 20+
- PostgreSQL 15+ (or Docker Compose)
- Redis 7+

### Option A: Local Development

1. **Backend Initialization**:
   ```bash
   cd server
   npm ci
   npm run prisma:generate
   npm run build
   npm run dev
   ```
   - OpenAPI Docs: `http://localhost:5000/api-docs`

2. **Frontend Initialization**:
   ```bash
   cd client
   npm ci
   npm run build
   npm run dev
   ```
   - Web App: `http://localhost:5173`

### Option B: Docker Compose

```bash
docker-compose up --build
```

---

## 🧪 Testing

- **Backend Integration Tests**:
  ```bash
  cd server && npm test
  ```

- **Frontend E2E Tests**:
  ```bash
  cd client && npm run test:e2e
  ```

---

## 🔒 Security Infrastructure
- Dual-Token JWT Auth with silent Refresh Token rotation in `HttpOnly` `SameSite=Lax` cookies.
- Role-Based Access Control (`USER` / `ADMIN`).
- Helmet HTTP security headers, CORS protection, Redis rate limiting, XSS protection, and Zod input validation.
