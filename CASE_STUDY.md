# Case Study: Building FinSight AI — Engineering & Design Journey

> **An architectural and visual case study on building a commercial-grade, AI-powered personal wealth workspace.**

---

## 1. The Problem
Most personal finance applications suffer from two major flaws:
1. **High-Anxiety Visual Clutter**: Interfaces look like noisy trading terminals, neon crypto dashboards, or punitive checkbook loggers that induce anxiety rather than peace of mind.
2. **Surface-Level Analytics**: Apps list static transactions without synthesizing deep predictive insights or contextual advisory capabilities.

---

## 2. Research & Inspiration
We drew inspiration from world-class design systems and products:
- **Apple & Mercury Bank**: Pristine layout hierarchy and hardware-software spatial harmony.
- **Notion & Linear**: Distraction-free canvas, keyboard-first productivity (`Cmd+K`), and micro-interactions.
- **Kinfolk Magazine & Aesop**: Warm neutral stone tones, editorial typography, and spatial serenity.

---

## 3. Visual & Technical Architecture
- **Design System**: *Warm Editorial Luxury* — Warm Linen canvas (`#FBF9F5` / `#121212`), Honed Travertine stone cards (`#F3EFEA` / `#1C1C1E`), Muted Sage (`#4A7C59`), Champagne Gold (`#C5A059`), Newsreader Serif display headers, Inter body text, and Geist Monospace tabular numbers.
- **Backend Infrastructure**: Express + Node.js + TypeScript, PostgreSQL 15 via Prisma ORM, Redis 7 caching with in-memory fallback, Zod schema validation, Helmet security headers, and Express rate limiting.
- **Security**: Dual-Token JWT (15-min Access Token + 7-day Refresh Token rotation in `HttpOnly` `SameSite=Lax` cookies) and Role-Based Access Control (`requireRole(['ADMIN'])`).
- **AI Engine**: Gemini API (`@google/generative-ai`) for financial chat advice, automated spending anomaly detection, and receipt OCR image scanning with Cloudinary storage.

---

## 4. Key Engineering Challenges & Solutions

### Challenge A: Monolithic JS Bundle Size
- *Issue*: Initial production build output a single 868 kB JavaScript bundle due to bundled Recharts and Framer Motion libraries.
- *Solution*: Implemented dynamic Rollup `manualChunks` code-splitting in `client/vite.config.ts` paired with `React.lazy()` route splitting. Reduced initial JS download by **88.4%** down to 100.9 kB with isolated page chunks under 15 kB.

### Challenge B: Offline Capability & Fast Retries
- *Issue*: Web apps fail when connectivity fluctuates during mobile use.
- *Solution*: Configured Progressive Web App (PWA) manifest and Service Worker script (`sw.js`) for offline asset caching and smooth background retries.

---

## 5. Future Roadmap
- Live WebSocket SSE real-time transaction streaming.
- Multi-currency real-time exchange rate conversions.
- One-click downloadable PDF executive financial health reports.

---

## 6. Lessons Learned
- **Decouple Architecture Early**: Clean separation of Express API routes, Zod validators, controllers, and services allowed rapid iterations without regression.
- **Strict Design Tokens**: Enforcing CSS variables for warm stone neutrals and monospaced tabular numbers ensured absolute visual elegance across all viewports.
