# Goodwin Grow CRM — Deployment & Operations Guide

## 1. Production Architecture Overview

Goodwin Grow CRM is packaged as a standard containerized Node.js application that can be deployed on Vercel, AWS ECS, Google Cloud Run, Railway, or dedicated Linux servers with Docker Compose.

```
                    Internet (HTTPS)
                           │
                     [Cloudflare / CDN]
                           │
                     [Load Balancer]
                           │
            ┌──────────────┴──────────────┐
            ▼                             ▼
   [App Instance 1]               [App Instance 2]
    Next.js / Node                 Next.js / Node
            │                             │
            └──────────────┬──────────────┘
                           ▼
          [Managed PostgreSQL 16+ Database]
```

---

## 2. Environment Variables Checklist

Refer to `.env.example`:
- `DATABASE_URL`: PostgreSQL connection string (e.g. `postgresql://user:pass@host:5432/goodwin_crm?schema=public`)
- `SESSION_SECRET`: 64-character random cryptographic secret for session signing.
- `NEXT_PUBLIC_APP_URL`: Canonical URL (e.g. `https://crm.goodwingrowai.com`).
- `NODE_ENV`: `production` or `development`.
- `PORT`: Server port (default 3000).

---

## 3. Docker Deployment Instructions

### 3.1 Build and Run via Docker Compose

```bash
# 1. Clone repository & configure environment
cp .env.example .env

# 2. Build and start services (App + PostgreSQL)
docker compose up -d --build

# 3. Run database migrations
docker compose exec app npx prisma migrate deploy

# 4. Optional: Seed demo records
docker compose exec app npx prisma db seed
```

---

## 4. Zero-Downtime Migration Policy

1. Always write additive schema migrations (new columns nullable or with safe defaults).
2. Run `prisma migrate deploy` prior to routing traffic to new container versions.
3. Keep health check endpoint `/api/health` active to verify database connectivity.
