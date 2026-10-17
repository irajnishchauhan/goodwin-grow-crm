# Goodwin Grow CRM — API Architecture & Contracts Specification

## 1. API Standards & Conventions

1. **Protocol & Versioning:** RESTful endpoints located under `/api/v1/` and standard `/api/` Next.js route handlers.
2. **Response Envelope:**
   ```json
   {
     "success": true,
     "data": { ... },
     "meta": { "total": 120, "page": 1, "pageSize": 25 },
     "error": null
   }
   ```
   Or on error:
   ```json
   {
     "success": false,
     "data": null,
     "error": {
       "code": "VALIDATION_ERROR",
       "message": "Invalid email address format",
       "details": [ ... ]
     }
   }
   ```
3. **Tenant Context Assertion:** Every authenticated request verifies session membership. Query parameters attempting to supply `tenant_id` are ignored; `tenant_id` is bound exclusively from the verified session.

---

## 2. API Endpoints Catalog

### 2.1 Authentication & Session
- `POST /api/auth/login` — Authenticate email/password, return user & active tenant session.
- `POST /api/auth/logout` — Revoke active session cookie.
- `GET /api/auth/session` — Retrieve current user profile and tenant memberships.
- `POST /api/auth/switch-tenant` — Body: `{ "tenantId": "UUID" }`. Validates membership and re-scopes session.
- `POST /api/auth/activate` — Body: `{ "token": "...", "password": "...", "fullName": "..." }`. Activates invited membership.

### 2.2 Platform Administration (`/api/platform/*`)
- `GET /api/platform/clients` — List all onboarded tenants with status, plan, and seat count.
- `POST /api/platform/clients` — Provision new client company:
  - Body: `{ name, code, industry, businessEmail, phone, seatLimit, planId, adminName, adminEmail }`
- `GET /api/platform/clients/:id` — Detailed client profile and subscription information.
- `PATCH /api/platform/clients/:id` — Update status (Active/Suspended), plan, or seat limits.
- `GET /api/platform/metrics` — Aggregate platform statistics (Total tenants, active users, plan distribution).

### 2.3 CRM Core Modules (`/api/*`)
- **Dashboard:**
  - `GET /api/reports/dashboard` — Filtered aggregated metrics (leads, deals, pipeline value, conversions).
- **Leads:**
  - `GET /api/leads` — List leads with search, filter (status, source, owner), pagination.
  - `POST /api/leads` — Create new lead record.
  - `GET /api/leads/:id` — Get lead details with activity timeline.
  - `PUT /api/leads/:id` — Update lead details.
  - `POST /api/leads/:id/convert` — Convert lead to Contact, Company, and optional Deal.
  - `DELETE /api/leads/:id` — Delete or archive lead.
- **Deals & Pipelines:**
  - `GET /api/pipelines` — Fetch all pipelines with ordered stages and aggregated values.
  - `GET /api/deals` — List deals (with pipelineId filter).
  - `POST /api/deals` — Create deal.
  - `PATCH /api/deals/:id/stage` — Body: `{ "stageId": "UUID", "lostReason": "..." }`. Updates deal stage and logs history.
- **Contacts & Companies:**
  - `GET /api/contacts` / `POST /api/contacts` / `GET /api/contacts/:id`
  - `GET /api/companies` / `POST /api/companies` / `GET /api/companies/:id`
- **Tasks & Activities:**
  - `GET /api/tasks` — List tasks (My Tasks, status, due date filter).
  - `POST /api/tasks` — Create task.
  - `PATCH /api/tasks/:id` — Update task status (Completed, Pending).
  - `POST /api/activities` — Log manual Call, Meeting, Email, WhatsApp, Note.
- **Quotations:**
  - `GET /api/quotations` — List quotations.
  - `POST /api/quotations` — Create quotation with line items, tax, discount calculations.
- **Team & Invitations:**
  - `GET /api/team` — List members of current tenant with roles.
  - `POST /api/team/invite` — Send invitation email with assigned role.
