# FinSight AI — Production Deployment Guide

## Target Environments
FinSight AI is containerized for seamless zero-downtime deployment to cloud platforms like Vercel, Render, Railway, Neon, AWS, or DigitalOcean.

## Option 1: Render / Railway Deployment

### 1. PostgreSQL Database (Neon / Render Postgres)
Set `DATABASE_URL` environment variable:
```bash
DATABASE_URL="postgresql://user:password@ep-host.neon.tech/finsight_db?sslmode=require"
```

### 2. Express Backend Deployment
- **Build Command**: `cd server && npm ci && npm run prisma:generate && npm run build`
- **Start Command**: `cd server && npm start`
- Environment Variables required: `PORT`, `NODE_ENV=production`, `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `GEMINI_API_KEY`, `CLIENT_URL`.

### 3. React Client Deployment (Vercel / Netlify / Nginx)
- **Build Command**: `cd client && npm ci && npm run build`
- **Output Directory**: `client/dist`
- Environment Variable required: `VITE_API_URL=https://api.yourdomain.com/api/v1`

## Option 2: Docker Compose (Self-Hosted VPS)
```bash
docker-compose up -d --build
```
