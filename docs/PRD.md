# Goodwin Grow CRM — Product Requirements Document (PRD)

**Product Name:** Goodwin Grow CRM  
**Parent Company:** Goodwin Grow AI  
**Document Version:** 1.0.0  
**Status:** Approved for Implementation  
**Product Type:** Multi-Tenant Commercial Customer Relationship Management (CRM) SaaS  

---

## 1. Executive Summary & Vision

Goodwin Grow CRM is an enterprise-grade, standalone multi-tenant CRM SaaS designed to empower digital marketing agencies, manufacturers, distributors, service providers, startups, and growing enterprises with modern lead, deal, pipeline, customer 360, quotation, and automation workflows.

The system is architected from the ground up for strict multi-tenancy, extreme data isolation, role-based access control (RBAC), and high productivity, synthesizing best-in-class concepts from Salesforce, HubSpot, Zoho CRM, Pipedrive, monday CRM, and Close CRM without copying proprietary code or assets.

### Independence Notice
Goodwin Grow CRM is fully autonomous and decoupled from Goodwin Grow HRMS. There are no shared database schemas, foreign keys, or runtime dependencies on HRMS modules.

---

## 2. Target Personas & Use Cases

1. **Platform Owner / Super Admin (Goodwin Grow AI):**
   - Manages client companies (tenants), subscriptions, seat limits, plan entitlements, system health, and cross-platform audit logs.
   - Strict rule: Super Admin cannot silently inspect tenant customer records without an explicit, time-limited, audited Support Access Grant.

2. **Company Owner / Company Admin (Tenant Leadership):**
   - Sets up corporate settings, custom pipelines, custom fields, company-wide tags, invites employees, assigns roles, and configures automation rules.

3. **Sales Manager:**
   - Monitors team performance, pipeline conversions, expected revenue, assigns leads, reallocates deals, and approves sales quotations.

4. **Sales Executive / Representative:**
   - Captures and qualifies leads, works active deals via visual drag-and-drop Kanban pipelines, schedules follow-ups, logs calls/emails/meetings, and issues quotations.

5. **Customer Support / Account Manager:**
   - Retains 360-degree visibility over customer contacts, past interactions, companies, and renewal activities.

---

## 3. High-Level Feature Modules

### Module 1: Tenancy & Platform Administration (`/platform`)
- Client company creation wizard (Name, code, industry, contact, timezone, currency, seat limit, initial plan).
- Automatic tenant provisioning (database workspace, default pipeline stages, default roles, admin activation token).
- Subscription plan manager & feature entitlement toggles.
- Platform-wide audit logs & system metrics.

### Module 2: Authentication & Multi-Company Switcher
- Universal login (`crm.goodwingrowai.com/login`).
- Session management with secure HTTP-only cookies and bcrypt-hashed credentials.
- Invitation-based onboarding (`/activate?token=...`).
- Multi-membership resolution: users belonging to multiple companies select their active workspace (`/select-company`).
- Zero context-leakage during company switching.

### Module 3: CRM Dashboard (`/app/dashboard`)
- Real-time tenant-scoped metrics:
  - Total Leads, New Leads, Qualified Leads.
  - Open Deals, Won Deals, Lost Deals.
  - Total Pipeline Value & Weighted Expected Revenue.
  - Conversion rates, today's pending follow-ups, overdue activities.
  - Sales team leaderboard & lead source breakdown.

### Module 4: Lead Management (`/app/leads`)
- Full lead lifecycle: New → Contacted → Qualified → Proposal → Converted / Lost.
- Lead scoring, sources, priority, assigned owner, custom tags.
- Direct 1-click conversion to Contact + Company + Deal.
- CSV bulk import/export with schema validation.

### Module 5: Contacts & Customer Companies (`/app/contacts`, `/app/companies`)
- 360-degree customer profile with unified timeline.
- Contact-Company many-to-one / many-to-many associations.
- Communication history, related deals, pending tasks, notes, and documents.

### Module 6: Sales Pipelines & Visual Kanban (`/app/deals`, `/app/pipelines`)
- Multi-pipeline support (e.g., Direct Sales, Inbound Partner, Enterprise).
- Pipedrive-style drag-and-drop Kanban board with immediate persistence.
- Deal stage history tracking, win probability, expected close date, and lost reason tracking.

### Module 7: Tasks, Calendar & Activities (`/app/tasks`, `/app/activities`)
- Task management (My Tasks, Team Tasks, status, due dates, priority).
- Unified activity feed: Calls, Emails, Meetings, WhatsApp logs, Follow-ups, and Notes.
- Overdue reminders and calendar agenda.

### Module 8: Quotations & Sales Catalog (`/app/quotations`)
- Product and service catalog with price books.
- Line items, quantity, tiered discounts, decimal-safe monetary calculations.
- Configurable tax rules (non-hardcoded statutory rates).
- Quotation statuses (Draft, Sent, Approved, Accepted, Rejected, Expired) and PDF export.

### Module 9: Workflow Automation Engine (`/app/automations`)
- Trigger-Condition-Action model (e.g., "When Lead status becomes Qualified -> Create follow-up task and notify owner").
- Execution logs, loop prevention, idempotency safeguards, and tenant isolation.

### Module 10: SaaS Subscriptions & Entitlements (`/platform/plans`, `/app/settings/billing`)
- Plans: Trial, Starter, Growth, Professional, Enterprise.
- Enforced seat limits and module gating (e.g., Quotations, Automations, Advanced Reporting).
- Non-destructive subscription lifecycle (grace periods without automated data destruction).

---

## 4. Non-Functional Requirements

- **Tenant Isolation:** Absolute data isolation enforced at application middleware, service layer, and database constraints. Cross-tenant leakage is treated as Severity 0.
- **Security & Privacy:** OWASP Top 10 compliance, input validation with Zod, encrypted credentials, rate limiting, and alignment with Indian DPDP Act guidelines.
- **Performance:** Sub-200ms API response time for typical queries, fast client-side rendering with TanStack Query and Next.js App Router.
- **Accessibility & UX:** WCAG 2.2 AA compliance, keyboard navigation, clean enterprise light/dark theme with Goodwin Grow AI emerald/green accents.
