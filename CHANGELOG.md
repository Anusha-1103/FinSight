# FinSight AI — Release Changelog

## [1.0.0] - 2026-08-04
### Added
- Initial public release of FinSight AI Personal Finance Platform.
- Full-stack TypeScript architecture with Express backend and Vite React frontend.
- PostgreSQL Prisma database schema with 13 data models and seed generator.
- Dual-token JWT authentication flow with silent refresh rotation in HttpOnly cookies.
- Documented 5-factor Financial Health Score algorithm (0-100 score).
- Gemini API (`@google/generative-ai`) integration for financial chat advisor and receipt OCR image parsing.
- Executive Dashboard with 8 widgets: Net Worth Trajectory Area Chart, Financial Health Gauge, Upcoming Bills, Budget Burn Rate, Savings Goal Progress, Day-of-Week Heatmap, and Recent Ledger.
- Warm Editorial Luxury Design System Tokens (`#FBF9F5` warm sand, `#F3EFEA` honed stone, `#4A7C59` muted sage, `#C5A059` champagne gold).
- Global Command Palette (`Cmd/Ctrl + K`) and keyboard shortcuts (`?`, `g d`, `g t`, `g s`, `g a`).
- Linear/Notion-inspired 9-tab Settings workspace preferences.
- Progressive Web App (PWA) manifest and Service Worker offline caching.
- Docker Compose and GitHub Actions CI workflow setup.
