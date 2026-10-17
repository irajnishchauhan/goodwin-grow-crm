# Goodwin Grow CRM — Security & Compliance Architecture

## 1. Authentication & Session Security

1. **Password Security:**
   - Passwords hashed using bcrypt with an adaptive salt cost factor (12 rounds).
   - Plaintext passwords are never logged, cached, transmitted unencrypted, or stored in any database field.
   - Enforced password policy: minimum 8 characters, requiring uppercase, lowercase, numbers, and special characters.

2. **Session Architecture:**
   - Cryptographically random session tokens (32-byte / 256-bit entropy).
   - Delivered exclusively via `httpOnly`, `Secure` (in production), `SameSite=Lax` cookies to mitigate XSS cookie theft.
   - Session revocation: users can trigger "Logout from all devices", invalidating all active sessions across devices.

3. **Invitation & Activation:**
   - Tenant administrators invite users via secure single-use tokens with a 72-hour time-to-live (TTL).
   - Activation requires establishing a personal password before membership is transitioned from `INVITED` to `ACTIVE`.

---

## 2. Role-Based Access Control (RBAC) Matrix

| Module / Operation | Platform Super Admin | Company Owner / Admin | Sales Manager | Sales Executive | Viewer |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Platform Management** (`/platform`) | FULL | NO | NO | NO | NO |
| **Tenant Settings & Billing** | READ/WRITE | FULL | NO | NO | NO |
| **User & Role Management** | READ (Audit) | FULL | VIEW TEAM | NO | NO |
| **Leads: Create / Edit** | NO (Without Grant)| FULL | FULL | OWN / ASSIGNED | NO |
| **Leads: Delete / Export** | NO | FULL | FULL | NO | NO |
| **Deals: Move Stages / Edit** | NO | FULL | FULL | OWN / ASSIGNED | NO |
| **Quotations: Approve** | NO | FULL | FULL | DRAFT ONLY | NO |
| **Automation Rules** | NO | FULL | VIEW ONLY | NO | NO |
| **Reports & Analytics** | PLATFORM ONLY | FULL | TEAM ONLY | PERSONAL | VIEW ONLY |

---

## 3. OWASP Top 10 Defense Strategies

- **A01: Broken Access Control:** Enforced server-side in API routes and server actions. Tenant ownership checks and permission guards run before any database operation.
- **A02: Cryptographic Failures:** TLS 1.3 in transit, AES-256 for database encryption at rest, secure hashing for credentials and reset tokens.
- **A03: Injection:** Prisma ORM parameterized queries eliminate SQL injection risks. Client input sanitized through strict Zod schemas.
- **A04: Insecure Design:** Defense-in-depth tenant scoping (`tenant_id` on all entities) built into foundational types.
- **A05: Security Misconfiguration:** Strict Content-Security-Policy (CSP), disabled `X-Powered-By`, enforced CORS headers.
- **A06: Vulnerable Components:** Regular `npm audit` scans, automated dependency maintenance.
- **A07: Identification and Authentication Failures:** Rate limiting on `/api/auth/login` (maximum 5 attempts per minute per IP), exponential backoff on repeated failures.
- **A08: Software and Data Integrity Failures:** Signed webhooks, validated payload schemas.
- **A09: Security Logging and Monitoring:** Immutable `audit_logs` record all sensitive administrative actions (role changes, tenant creation, bulk exports). Sensitive fields (passwords, tokens) automatically redacted.
- **A10: Server-Side Request Forgery (SSRF):** URL validation with protocol and domain whitelists for custom webhooks and integrations.

---

## 4. Indian DPDP Act Compliance Readiness

In alignment with the Digital Personal Data Protection (DPDP) Act:
1. **Notice & Consent:** Leads and contacts capture consent metadata, source of acquisition, and opt-out statuses.
2. **Data Minimization:** CRM fields are restricted to relevant business identifiers and sales metadata.
3. **Right to Correction & Erasure:** Tenant administrators can export or purge personal records upon data principal request.
4. **Auditability:** Modifications to personal contact details are recorded with timestamp and acting user identity.
