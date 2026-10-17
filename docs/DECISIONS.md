# Goodwin Grow CRM — Architecture Decision Records (ADRs)

## ADR-001: Next.js App Router & TypeScript Strict as Unified Full-Stack Platform
- **Status:** Accepted
- **Context:** We need a modern, high-performance web platform supporting server-side rendering, streaming UI, API route handlers, and type safety across client and server boundaries.
- **Decision:** Adopt Next.js 15+ with React 19, TypeScript strict mode, and Tailwind CSS.
- **Consequences:** Eliminates API drift between client and backend; provides instant rendering for CRM dashboards and server components.

## ADR-002: Modular Monolith Architecture
- **Status:** Accepted
- **Context:** Complex CRM systems often get fragmented into microservices prematurely, leading to distributed transaction failures, deployment complexity, and network latency.
- **Decision:** Build Goodwin Grow CRM as a modular monolith with clear domain boundaries (`tenancy`, `auth`, `crm`, `sales`, `activities`, `automations`).
- **Consequences:** Simple continuous deployment, ACID transactions across CRM entities, straightforward local development.

## ADR-003: Logical Multi-Tenancy (Shared Database, Shared Schema)
- **Status:** Accepted
- **Context:** Need to support thousands of SMB tenants cost-effectively without provisioning individual database clusters for each tenant.
- **Decision:** Shared database and schema with mandatory `tenant_id` foreign key on all tenant-owned tables, reinforced with composite indexes and server-side context assertion.
- **Consequences:** Highly efficient resource utilization, zero operational overhead for new client provisioning. Requires rigorous automated tests against cross-tenant data leaks.

## ADR-004: Complete Decoupling from Goodwin Grow HRMS
- **Status:** Accepted
- **Context:** The prompt explicitly requires that Goodwin Grow CRM remain an independent SaaS platform with zero database or runtime dependencies on HRMS.
- **Decision:** Full independence. Zero shared tables, schemas, or foreign keys with HRMS.
- **Consequences:** Independent deployment lifecycle, standalone commercial pricing, no risk of HRMS breaking CRM.

## ADR-005: Secure HTTP-Only Sessions vs. LocalStorage JWT
- **Status:** Accepted
- **Context:** Storing authentication tokens in browser `localStorage` exposes users to XSS token exfiltration.
- **Decision:** Use cryptographically secure session identifiers stored in `httpOnly`, `Secure`, `SameSite=Lax` cookies, backed by a server-side session registry in PostgreSQL.
- **Consequences:** Mitigates XSS attack vectors; permits instant server-side revocation on logout or account compromise.

## ADR-006: Decimal Arithmetic for Monetary Values
- **Status:** Accepted
- **Context:** Standard IEEE 754 floating-point numbers in JavaScript cause rounding anomalies (e.g., `0.1 + 0.2 !== 0.3`) in quotation subtotals and tax calculations.
- **Decision:** Store money as `DECIMAL(14, 2)` in PostgreSQL and calculate line items with precision-safe decimal rounding in TypeScript.
- **Consequences:** 100% financial accuracy for invoices and quotations.
