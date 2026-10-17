# Goodwin Grow CRM — Quality Assurance & Test Plan

## 1. Testing Philosophy

To guarantee commercial SaaS reliability, every feature is accompanied by automated tests. In multi-tenant systems, **Data Isolation Testing is Severity 0**: any failure in tenant segregation halts release pipelines immediately.

---

## 2. Test Suites & Strategy

### 2.1 Multi-Tenant Isolation Suite (`tests/tenant-isolation.test.ts`)
1. **Direct Object ID Tampering (IDOR):**
   - User from Tenant A attempts `GET /api/leads/:tenantB_LeadId` -> Expect HTTP 404 / 403.
   - User from Tenant A attempts `PATCH /api/deals/:tenantB_DealId` -> Expect HTTP 404 / 403.
   - User from Tenant A attempts `DELETE /api/contacts/:tenantB_ContactId` -> Expect HTTP 404 / 403.
2. **Payload Injection Defense:**
   - User submits POST `/api/leads` with explicit `{ "tenant_id": "tenant-b-uuid" }` -> Assert created record is bound to Tenant A (attacker's authenticated context), never Tenant B.
3. **Cross-Tenant Entity Association:**
   - User in Tenant A attempts to create a Deal linking a Contact owned by Tenant B -> Expect HTTP 400 Bad Request.
4. **Data Aggregation Leakage:**
   - Populate 10 leads in Tenant A and 25 leads in Tenant B. Query `/api/reports/dashboard` as Tenant A -> Assert `totalLeads == 10`.

### 2.2 Authentication & Multi-Membership Suite (`tests/auth.test.ts`)
1. **Password Security:**
   - Verify bcrypt hash verification and rejection of incorrect passwords.
2. **Session Token Expiry & Invalidation:**
   - Test session revocation upon logout.
3. **Multi-Company Context Switching:**
   - User with memberships in Company 1 and Company 2 switches to Company 2. Verify active session context and headers reflect Company 2.
4. **Invitation Flow:**
   - Generate invitation token for new employee. Activate token with new password. Verify membership changes from `INVITED` to `ACTIVE`.

### 2.3 RBAC & Permission Enforcement (`tests/rbac.test.ts`)
1. **Sales Executive Restriction:**
   - Attempt to access `/platform` routes -> Expect HTTP 403.
   - Attempt to access `/app/settings/billing` -> Expect HTTP 403.
   - Attempt to delete a pipeline stage -> Expect HTTP 403.
2. **Platform Super Admin Boundaries:**
   - Verify platform admin cannot query tenant leads without a valid `support_access_grants` entry.

### 2.4 Domain Logic & Financial Integrity
1. **Quotation Math:**
   - Decimal precision tests: line items with discounts and fractional tax rates calculate exact totals without JavaScript floating-point errors.
2. **Lead-to-Deal Conversion:**
   - Verifies 1-click atomic transaction creating Contact, Company, and Deal with correct stage assignment.
