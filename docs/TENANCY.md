# Goodwin Grow CRM — Multi-Tenancy Architecture & Isolation Specification

## 1. Tenancy Model Overview

Goodwin Grow CRM implements a **Shared Database, Shared Schema with Logical Multi-Tenancy**. This pattern delivers optimal operational scalability, resource efficiency, and simplified backup/restore workflows while enforcing enterprise-grade data isolation.

### Core Guarantees
1. **Universal Tenant Keying:** Every tenant-bound table contains a mandatory, non-nullable `tenant_id UUID` column with a foreign key constraint to `tenants(id)`.
2. **Server-Side Tenant Derivation:** The client UI NEVER dictates the `tenant_id` for queries or mutations. The `tenant_id` is extracted strictly from the cryptographically verified session token after validating active membership in `tenant_memberships`.
3. **Compound Foreign Keys & Scoping:** Queries querying an entity by primary key ALWAYS bind `WHERE id = $id AND tenant_id = $tenantId`.
4. **Context Switching Isolation:** When a user switches companies, the session cookie is updated, and client-side application state (TanStack Query cache) is systematically cleared.
5. **Platform Super Admin Boundaries:** Platform administrators manage billing, seat limits, and tenant status from `/platform`. They DO NOT have unfettered, unlogged access to customer records. Support access requires an explicit, time-limited, audited `support_access_grants` record.

---

## 2. Multi-Company Membership & Resolution Flow

```
+-------------------------------------------------------------+
|                     User Logs In (/login)                   |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|    Verify Credentials (bcrypt hash) -> Query Memberships    |
+------------------------------+------------------------------+
                               |
              +----------------+----------------+
              |                                 |
              v (Single Membership)             v (Multiple Memberships)
+-------------------------------+ +-------------------------------+
| Set Session with              | | Redirect to /select-company   |
| active_tenant_id = org.id     | | User selects desired workspace|
| Redirect to /app/dashboard    | | Re-issue session with chosen  |
|                               | | active_tenant_id              |
+-------------------------------+ +-------------------------------+
```

---

## 3. Defense-in-Depth Isolation Checklist

| Vulnerability Vector | Preventive Measure | Verification Test |
| :--- | :--- | :--- |
| **Direct Object ID Tampering (IDOR)** | All queries append `WHERE tenant_id = :activeTenant` | Automated test attempts to fetch Tenant B Lead ID using Tenant A session token -> Returns `404 Not Found` |
| **Payload Injection** | All mutations strip/ignore `tenant_id` from body, injecting `ctx.tenantId` | Attempt to POST `{ tenant_id: victim_id, title: "Hacked" }` -> Record created under attacker's `tenant_id` only |
| **Foreign Key Cross-Linking** | When associating Lead, Contact, or Deal, server validates both belong to same `tenant_id` | Attempt to link Tenant A Deal to Tenant B Contact -> Fails validation with `400 Invalid Association` |
| **Company Switcher Leak** | Cache invalidation + fresh session generation on tenant swap | Verify subsequent fetch returns only new tenant's items; zero cache bleed |
| **Search & Aggregations** | Dashboard stats and full-text search strictly scoped by `tenant_id` | Test aggregate counts: total leads in Tenant A cannot reflect leads in Tenant B |

---

## 4. Super Admin Support Access Protocol

In compliance with enterprise privacy standards:
1. Platform Super Admin can view tenant metadata (Tenant Name, Code, Plan, Seat Count, Created Date).
2. If troubleshooting requires viewing CRM data:
   - Super Admin must submit an audit request with rationale.
   - An entry in `support_access_grants` is created with a strict TTL (e.g., 2 hours).
   - Every read and write performed during the support session is permanently recorded in `audit_logs` with `is_impersonation: true`.
