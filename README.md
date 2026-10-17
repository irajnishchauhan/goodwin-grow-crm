# Goodwin Grow CRM

> **Enterprise Multi-Tenant Customer Relationship Management SaaS Platform**  
> Developed for **Goodwin Grow AI**

[![License](https://img.shields.io/badge/license-Commercial-blue.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-green.svg)]()
[![Next.js](https://img.shields.io/badge/Next.js-App%20Router-black.svg)]()
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Multi--Tenant-blue.svg)]()

---

## 1. Product Overview

**Goodwin Grow CRM** is a multi-tenant commercial SaaS solution engineered for agencies, manufacturers, distributors, service organizations, and growing enterprises. Built with uncompromising tenant isolation, it synthesizes the best operational features from Salesforce, HubSpot, Zoho CRM, Pipedrive, monday CRM, and Close CRM.

### Core Capabilities
- **Multi-Tenant SaaS Architecture:** Complete data isolation per client organization with independent users, pipelines, leads, quotations, and settings.
- **Platform Super Admin Portal (`/platform`):** Onboard client companies, configure subscription tiers, manage seat allocations, and inspect system audit trails.
- **Universal Authentication & Multi-Company Switcher:** Seamless login with instant switching between multiple organization memberships without data bleed.
- **Visual Drag-and-Drop Pipeline:** Pipedrive-inspired Kanban board with stage transition tracking, win probabilities, and weighted deal forecasting.
- **HubSpot 360-Degree Customer Profile:** Unified activity timelines (calls, emails, meetings, WhatsApp logs, notes), deal associations, and quick activity logging.
- **Commercial Quotations:** Decimal-safe financial engine supporting products, price books, multi-tier discounts, and statutory taxes.
- **Workflow Automation:** Event-driven rule engine for automated lead assignment, status transitions, and follow-up task generation.

---

## 2. Technology Stack

- **Frontend:** Next.js App Router (React 19), TypeScript (Strict), Tailwind CSS, Lucide Icons, dnd-kit (Kanban), Recharts, TanStack Query.
- **Backend:** Next.js Route Handlers & Server Services, Modular Monolith Domain Architecture.
- **Database:** PostgreSQL 16+, Prisma ORM with tenant-aware composite constraints and indexes.
- **Security:** HTTP-only secure session cookies, bcrypt password hashing (12 rounds), server-side RBAC, Zod schema validation.
- **Testing:** Vitest automated test suite with cross-tenant penetration tests and RBAC verification.

---

## 3. Quick Start (Local Development)

### Prerequisites
- Node.js 18+ (tested on Node v20/v24)
- PostgreSQL running locally or via Docker

### Setup Instructions

1. **Clone and Install Dependencies:**
   ```bash
   cd CRM
   npm install
   ```

2. **Configure Environment:**
   ```bash
   cp .env.example .env
   # Update DATABASE_URL with your PostgreSQL credentials
   ```

3. **Initialize Database Schema & Run Migrations:**
   ```bash
   npx prisma db push
   ```

4. **Seed Demonstration Data:**
   ```bash
   npm run db:seed
   ```

5. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 4. Default Demonstration Credentials

The seed script provisions fictional demonstration tenants and users:

| Portal | Role | Email | Password | Organization |
| :--- | :--- | :--- | :--- | :--- |
| `/platform` | **Platform Super Admin** | `superadmin@goodwingrowai.com` | `GoodwinAdmin@2026!` | Goodwin Grow AI (Platform) |
| `/app` | **Company Admin** | `admin@goodwinbatteries.com` | `CompanyAdmin@2026!` | Goodwin Batteries |
| `/app` | **Sales Manager** | `sales@goodwinbatteries.com` | `SalesManager@2026!` | Goodwin Batteries |
| `/app` | **Company Admin** | `admin@sapnawashing.com` | `SapnaAdmin@2026!` | Sapna Washing Point |

---

## 5. Automated Testing

Run the automated test suite, including cross-tenant security and RBAC validation:

```bash
npm run test
```

---

## 6. Project Documentation Index

- [Product Requirements Document (PRD)](./docs/PRD.md)
- [System Architecture](./docs/ARCHITECTURE.md)
- [Database Schema & ER Specification](./docs/DATABASE.md)
- [Multi-Tenancy & Isolation Model](./docs/TENANCY.md)
- [Security & Compliance Architecture](./docs/SECURITY.md)
- [UI/UX Design System](./docs/UI-DESIGN.md)
- [API Contracts Catalog](./docs/API.md)
- [Implementation Plan & Backlog](./docs/IMPLEMENTATION-PLAN.md)
- [Test Plan & Isolation Verification](./docs/TEST-PLAN.md)
- [Deployment & Operations Guide](./docs/DEPLOYMENT.md)
- [Implementation Progress Tracker](./docs/PROGRESS.md)
- [Architecture Decision Records (ADRs)](./docs/DECISIONS.md)
