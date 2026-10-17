# Goodwin Grow CRM — Architecture Specification

## 1. Architectural Philosophy

Goodwin Grow CRM is designed as a **Modular Monolith** optimized for developer velocity, operational simplicity, and strict multi-tenant isolation. Microservices are intentionally avoided in early phases to eliminate distributed transaction failures, network latency, and unnecessary orchestration overhead.

```
┌────────────────────────────────────────────────────────────────────────┐
│                     Client Tier (Browser / PWA)                       │
│ Next.js App Router (React 19 / TS Strict) + Tailwind CSS + shadcn/ui   │
│ TanStack Query + dnd-kit (Kanban) + Recharts + Lucide Icons           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS (JSON / Server Actions)
┌───────────────────────────────────▼────────────────────────────────────┐
│                  Application Tier (Next.js Node Runtime)               │
│                                                                        │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │             Tenant Resolution & Security Interceptor              │ │
│ │  - Session & JWT Auth Validation                                   │ │
│ │  - Tenant Membership & Active Context Verification                 │ │
│ │  - Role & Permission Matrix Enforcement (RBAC)                     │ │
│ └──────────────────────────────────┬─────────────────────────────────┘ │
│                                    │ Scoped Tenant Context              │
│ ┌──────────────────────────────────▼─────────────────────────────────┐ │
│ │                      Domain Service Modules                        │ │
│ │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐           │ │
│ │  │ Tenancy & Auth│  │ Leads & Deals │  │ Contacts/Co.  │           │ │
│ │  └───────────────┘  └───────────────┘  └───────────────┘           │ │
│ │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐           │ │
│ │  │ Tasks/Activity│  │ Quotations    │  │ Automations   │           │ │
│ │  └───────────────┘  └───────────────┘  └───────────────┘           │ │
│ └──────────────────────────────────┬─────────────────────────────────┘ │
│                                    │                                   │
│ ┌──────────────────────────────────▼─────────────────────────────────┐ │
│ │         Tenant-Aware Repository & Prisma ORM Layer                 │ │
│ │  - Auto-injection of tenant_id in WHERE clauses                    │ │
│ │  - Composite Foreign Key & Constraint validation                   │ │
│ └──────────────────────────────────┬─────────────────────────────────┘ │
└────────────────────────────────────┼───────────────────────────────────┘
                                     │ TCP Pool
┌────────────────────────────────────▼───────────────────────────────────┐
│                    Data Tier (PostgreSQL Engine)                       │
│  - Normalized schema with tenant_id on all tenant-owned tables         │
│  - Composite indexes on (tenant_id, id), (tenant_id, status), etc.     │
│  - Row Level Security (RLS) compatible policies                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure Conventions

The repository follows a clean, modular structure:

```
CRM/
├── docs/                      # PRD, Architecture, Database, Security, Progress
├── prisma/
│   ├── schema.prisma          # Complete Normalized PostgreSQL Schema
│   └── seed.ts                # Fictional Demo Data (Goodwin Grow AI, Batteries, Sapna)
├── src/
│   ├── app/                   # Next.js App Router Pages & API Routes
│   │   ├── (auth)/            # Auth routes (/login, /activate, /forgot-password)
│   │   ├── (platform)/        # Super Admin routes (/platform, /platform/clients)
│   │   ├── (workspace)/       # Company CRM routes (/app/dashboard, /app/leads, ...)
│   │   ├── api/               # REST API endpoints (v1)
│   │   └── layout.tsx
│   ├── components/            # Reusable UI components & Design System
│   │   ├── ui/                # Buttons, Inputs, Modals, Tables, Badges, Tabs
│   │   ├── layout/            # Sidebar, Header, CompanySwitcher, UserMenu
│   │   ├── crm/               # KanbanBoard, DealCard, ActivityTimeline, LeadTable
│   │   └── platform/          # ClientTable, PlanEditor, AuditLogViewer
│   ├── lib/                   # Shared Infrastructure
│   │   ├── prisma.ts          # Prisma Singleton Client
│   │   ├── auth/              # Password hashing, JWT/Session tokens, Cookies
│   │   ├── tenant/            # Tenant context resolution & assertion helpers
│   │   ├── rbac/              # Roles, Permissions, Permission checks
│   │   ├── automation/        # Workflow evaluation engine
│   │   └── utils.ts           # Formatting, decimal currency, date helpers
│   └── types/                 # Shared TypeScript interfaces & Zod schemas
├── tests/
│   ├── tenant-isolation.test.ts # Cross-tenant penetration & data leak tests
│   ├── auth.test.ts           # Login, invitation, & session tests
│   └── rbac.test.ts           # Role permission enforcement tests
├── docker-compose.yml         # Local development services (Postgres)
├── Dockerfile                 # Container build definition
├── tailwind.config.ts         # Enterprise color system with Goodwin Green
└── package.json
```

---

## 3. Request Lifecycle & Tenant Scoping

1. **Incoming Request:** Every API call or page request arrives with an HTTP-only session cookie containing the user's authenticated identity and active `tenant_id`.
2. **Context Resolution:** The `getTenantContext()` server helper reads the session, queries `TenantMembership` for the authenticated user and specified tenant, and asserts:
   - Does this user exist and are they active?
   - Is the target tenant active and not suspended?
   - Is the user an active member of this tenant?
   - What roles and permissions does the user hold in this tenant?
3. **Defense-in-Depth Assertion:**
   - Any attempt to query by ID (e.g., `dealId`) executes:
     `prisma.deal.findFirst({ where: { id: dealId, tenant_id: activeTenantId } })`
   - If the record belongs to another tenant, the query returns `null`, and the endpoint responds with `404 Not Found` (preventing ID enumeration) or `403 Forbidden`.
4. **Mutations:** In mutations (create/update/delete), `tenant_id` is always derived strictly from the server-verified session context, never accepted blindly from client JSON bodies.

---

## 4. Multi-Company Switching Workflow

Users with multiple memberships (e.g., an executive serving across Goodwin Grow AI and Goodwin Batteries) can switch workspaces instantaneously:
1. User clicks the **Company Switcher** in the top navigation.
2. Endpoint `/api/auth/switch-tenant` validates that the user is an active member of the target tenant.
3. The session cookie is re-signed with the new `activeTenantId`.
4. TanStack Query cache is purged client-side to prevent stale data display.
5. The browser navigates to `/app/dashboard`, rendering the target tenant's isolated data.
