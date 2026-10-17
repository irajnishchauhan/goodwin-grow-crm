# Goodwin Grow CRM — Database Architecture & Entity Relationship Specification

## 1. Relational Principles & Multi-Tenant Design

1. **UUID Primary Keys:** All tables utilize UUID v4 primary keys (`id UUID PRIMARY KEY DEFAULT gen_random_uuid()`) to prevent predictable ID scanning attacks.
2. **Tenant Scoping:** Every tenant-owned table features a non-nullable `tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE`.
3. **Composite Foreign Keys & Indexes:** Relationships between tenant-owned entities (e.g., `deal` referencing `contact`) are guarded by composite unique constraints or compound indexes `(tenant_id, id)` to prevent cross-tenant association.
4. **Soft Deletion & Audit Fields:** All business tables include `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`, and optional `deleted_at TIMESTAMPTZ`.
5. **Decimal Financials:** All monetary amounts (`value`, `price`, `tax_rate`, `discount`, `subtotal`, `total`) use `DECIMAL(14, 2)` or `DECIMAL(12, 4)` to guarantee exact accounting without floating-point inaccuracies.

---

## 2. Entity Groups & Schema Definitions

### 2.1 Tenancy & Platform System

#### `tenants`
- `id` (UUID, PK)
- `name` (VARCHAR 255)
- `code` (VARCHAR 64, UNIQUE) — e.g., `goodwin-grow-ai`, `goodwin-batteries`, `sapna-wash`
- `status` (ENUM: `ACTIVE`, `SUSPENDED`, `TRIAL`, `CANCELLED`)
- `created_at`, `updated_at`

#### `tenant_settings`
- `id` (UUID, PK)
- `tenant_id` (UUID, UNIQUE, FK -> tenants)
- `business_email` (VARCHAR 255)
- `phone` (VARCHAR 50)
- `website` (VARCHAR 255)
- `address` (TEXT)
- `country` (VARCHAR 100)
- `currency` (VARCHAR 10, DEFAULT 'INR')
- `timezone` (VARCHAR 100, DEFAULT 'Asia/Kolkata')
- `logo_url` (TEXT)
- `seat_limit` (INT, DEFAULT 10)
- `created_at`, `updated_at`

#### `tenant_memberships`
- `id` (UUID, PK)
- `tenant_id` (UUID, FK -> tenants)
- `user_id` (UUID, FK -> users)
- `status` (ENUM: `ACTIVE`, `INVITED`, `SUSPENDED`)
- `is_owner` (BOOLEAN, DEFAULT false)
- `created_at`, `updated_at`
- UNIQUE `(tenant_id, user_id)`

---

### 2.2 Authentication & Authorization (RBAC)

#### `users`
- `id` (UUID, PK)
- `email` (VARCHAR 255, UNIQUE)
- `password_hash` (VARCHAR 255)
- `full_name` (VARCHAR 255)
- `phone` (VARCHAR 50)
- `avatar_url` (TEXT)
- `is_platform_admin` (BOOLEAN, DEFAULT false)
- `is_active` (BOOLEAN, DEFAULT true)
- `created_at`, `updated_at`

#### `sessions`
- `id` (UUID, PK)
- `user_id` (UUID, FK -> users)
- `active_tenant_id` (UUID, FK -> tenants, NULLABLE)
- `token` (VARCHAR 512, UNIQUE)
- `expires_at` (TIMESTAMPTZ)
- `user_agent` (TEXT)
- `ip_address` (VARCHAR 45)
- `created_at`

#### `invitations`
- `id` (UUID, PK)
- `tenant_id` (UUID, FK -> tenants)
- `email` (VARCHAR 255)
- `role_id` (UUID, FK -> roles)
- `token` (VARCHAR 255, UNIQUE)
- `invited_by_id` (UUID, FK -> users)
- `expires_at` (TIMESTAMPTZ)
- `accepted_at` (TIMESTAMPTZ, NULLABLE)
- `created_at`

#### `roles`
- `id` (UUID, PK)
- `tenant_id` (UUID, NULLABLE, FK -> tenants) — `NULL` denotes platform system default roles
- `name` (VARCHAR 100) — `Platform Owner`, `Company Admin`, `Sales Manager`, `Sales Executive`, `Viewer`
- `description` (TEXT)
- `is_system` (BOOLEAN, DEFAULT false)
- `created_at`, `updated_at`

#### `permissions`
- `id` (UUID, PK)
- `code` (VARCHAR 100, UNIQUE) — e.g., `leads:read`, `leads:write`, `deals:delete`, `settings:manage`
- `module` (VARCHAR 50)
- `description` (TEXT)

#### `membership_roles`
- `id` (UUID, PK)
- `membership_id` (UUID, FK -> tenant_memberships)
- `role_id` (UUID, FK -> roles)
- UNIQUE `(membership_id, role_id)`

#### `role_permissions`
- `id` (UUID, PK)
- `role_id` (UUID, FK -> roles)
- `permission_id` (UUID, FK -> permissions)
- UNIQUE `(role_id, permission_id)`

---

### 2.3 CRM Core Entities

#### `companies` (Client's Accounts/Organizations)
- `id` (UUID, PK)
- `tenant_id` (UUID, FK -> tenants)
- `name` (VARCHAR 255)
- `industry` (VARCHAR 100)
- `website` (VARCHAR 255)
- `phone` (VARCHAR 50)
- `email` (VARCHAR 255)
- `address` (TEXT)
- `city`, `state`, `country`, `postal_code`
- `assigned_owner_id` (UUID, NULLABLE, FK -> users)
- `created_at`, `updated_at`
- INDEX `(tenant_id, name)`

#### `contacts`
- `id` (UUID, PK)
- `tenant_id` (UUID, FK -> tenants)
- `company_id` (UUID, NULLABLE, FK -> companies)
- `first_name` (VARCHAR 100)
- `last_name` (VARCHAR 100)
- `email` (VARCHAR 255)
- `phone` (VARCHAR 50)
- `job_title` (VARCHAR 100)
- `source` (VARCHAR 100)
- `assigned_owner_id` (UUID, NULLABLE, FK -> users)
- `tags` (TEXT[] DEFAULT '{}')
- `created_at`, `updated_at`
- INDEX `(tenant_id, email)`

#### `leads`
- `id` (UUID, PK)
- `tenant_id` (UUID, FK -> tenants)
- `first_name` (VARCHAR 100)
- `last_name` (VARCHAR 100)
- `company_name` (VARCHAR 255)
- `email` (VARCHAR 255)
- `phone` (VARCHAR 50)
- `status` (ENUM: `NEW`, `CONTACTED`, `QUALIFIED`, `PROPOSAL`, `CONVERTED`, `LOST`)
- `source` (VARCHAR 100)
- `priority` (ENUM: `LOW`, `MEDIUM`, `HIGH`, `URGENT`)
- `score` (INT, DEFAULT 0)
- `assigned_owner_id` (UUID, NULLABLE, FK -> users)
- `tags` (TEXT[] DEFAULT '{}')
- `converted_at` (TIMESTAMPTZ, NULLABLE)
- `converted_contact_id` (UUID, NULLABLE, FK -> contacts)
- `converted_deal_id` (UUID, NULLABLE)
- `created_at`, `updated_at`
- INDEX `(tenant_id, status)`
- INDEX `(tenant_id, assigned_owner_id)`

#### `pipelines`
- `id` (UUID, PK)
- `tenant_id` (UUID, FK -> tenants)
- `name` (VARCHAR 100)
- `is_default` (BOOLEAN, DEFAULT false)
- `created_at`, `updated_at`

#### `pipeline_stages`
- `id` (UUID, PK)
- `tenant_id` (UUID, FK -> tenants)
- `pipeline_id` (UUID, FK -> pipelines)
- `name` (VARCHAR 100)
- `order_index` (INT)
- `win_probability` (INT, DEFAULT 50)
- `created_at`, `updated_at`
- UNIQUE `(pipeline_id, order_index)`

#### `deals`
- `id` (UUID, PK)
- `tenant_id` (UUID, FK -> tenants)
- `pipeline_id` (UUID, FK -> pipelines)
- `stage_id` (UUID, FK -> pipeline_stages)
- `company_id` (UUID, NULLABLE, FK -> companies)
- `contact_id` (UUID, NULLABLE, FK -> contacts)
- `title` (VARCHAR 255)
- `value` (DECIMAL(14,2), DEFAULT 0.00)
- `currency` (VARCHAR 10, DEFAULT 'INR')
- `expected_close_date` (DATE, NULLABLE)
- `probability` (INT, DEFAULT 50)
- `status` (ENUM: `OPEN`, `WON`, `LOST`)
- `lost_reason` (TEXT, NULLABLE)
- `assigned_owner_id` (UUID, NULLABLE, FK -> users)
- `created_at`, `updated_at`
- INDEX `(tenant_id, stage_id)`
- INDEX `(tenant_id, status)`

#### `deal_stage_history`
- `id` (UUID, PK)
- `tenant_id` (UUID, FK -> tenants)
- `deal_id` (UUID, FK -> deals)
- `from_stage_id` (UUID, NULLABLE, FK -> pipeline_stages)
- `to_stage_id` (UUID, FK -> pipeline_stages)
- `changed_by_id` (UUID, FK -> users)
- `created_at` (TIMESTAMPTZ)

---

### 2.4 Tasks, Activities & Communication

#### `tasks`
- `id` (UUID, PK)
- `tenant_id` (UUID, FK -> tenants)
- `title` (VARCHAR 255)
- `description` (TEXT)
- `due_date` (TIMESTAMPTZ, NULLABLE)
- `priority` (ENUM: `LOW`, `MEDIUM`, `HIGH`, `URGENT`)
- `status` (ENUM: `PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`)
- `assigned_to_id` (UUID, NULLABLE, FK -> users)
- `lead_id` (UUID, NULLABLE, FK -> leads)
- `contact_id` (UUID, NULLABLE, FK -> contacts)
- `deal_id` (UUID, NULLABLE, FK -> deals)
- `created_at`, `updated_at`

#### `activities`
- `id` (UUID, PK)
- `tenant_id` (UUID, FK -> tenants)
- `type` (ENUM: `CALL`, `EMAIL`, `MEETING`, `WHATSAPP`, `NOTE`, `TASK`)
- `title` (VARCHAR 255)
- `description` (TEXT)
- `performed_by_id` (UUID, FK -> users)
- `lead_id` (UUID, NULLABLE, FK -> leads)
- `contact_id` (UUID, NULLABLE, FK -> contacts)
- `deal_id` (UUID, NULLABLE, FK -> deals)
- `occurred_at` (TIMESTAMPTZ)
- `created_at`

---

### 2.5 Products, Price Books & Quotations

#### `products`
- `id` (UUID, PK)
- `tenant_id` (UUID, FK -> tenants)
- `name` (VARCHAR 255)
- `sku` (VARCHAR 100)
- `description` (TEXT)
- `unit_price` (DECIMAL(14,2))
- `currency` (VARCHAR 10, DEFAULT 'INR')
- `is_active` (BOOLEAN, DEFAULT true)
- `created_at`, `updated_at`

#### `quotations`
- `id` (UUID, PK)
- `tenant_id` (UUID, FK -> tenants)
- `quotation_number` (VARCHAR 64) — e.g. `QT-2026-0001`
- `deal_id` (UUID, NULLABLE, FK -> deals)
- `contact_id` (UUID, NULLABLE, FK -> contacts)
- `company_id` (UUID, NULLABLE, FK -> companies)
- `status` (ENUM: `DRAFT`, `SENT`, `APPROVED`, `ACCEPTED`, `REJECTED`, `EXPIRED`)
- `subtotal` (DECIMAL(14,2))
- `discount_amount` (DECIMAL(14,2), DEFAULT 0.00)
- `tax_amount` (DECIMAL(14,2), DEFAULT 0.00)
- `total_amount` (DECIMAL(14,2))
- `valid_until` (DATE)
- `terms` (TEXT)
- `created_by_id` (UUID, FK -> users)
- `created_at`, `updated_at`

#### `quotation_items`
- `id` (UUID, PK)
- `quotation_id` (UUID, FK -> quotations)
- `product_id` (UUID, NULLABLE, FK -> products)
- `description` (VARCHAR 255)
- `quantity` (DECIMAL(12,2))
- `unit_price` (DECIMAL(14,2))
- `discount` (DECIMAL(14,2), DEFAULT 0.00)
- `tax_rate` (DECIMAL(6,2), DEFAULT 0.00)
- `line_total` (DECIMAL(14,2))

---

### 2.6 Automation Rules & SaaS Subscriptions

#### `automation_rules`
- `id` (UUID, PK)
- `tenant_id` (UUID, FK -> tenants)
- `name` (VARCHAR 255)
- `trigger_event` (VARCHAR 100) — e.g., `lead.created`, `lead.qualified`, `deal.stage_changed`
- `conditions` (JSONB)
- `actions` (JSONB)
- `is_active` (BOOLEAN, DEFAULT true)
- `created_at`, `updated_at`

#### `automation_executions`
- `id` (UUID, PK)
- `tenant_id` (UUID, FK -> tenants)
- `rule_id` (UUID, FK -> automation_rules)
- `entity_type` (VARCHAR 50)
- `entity_id` (UUID)
- `status` (ENUM: `SUCCESS`, `FAILED`, `SKIPPED`)
- `details` (JSONB)
- `executed_at` (TIMESTAMPTZ)

#### `subscription_plans`
- `id` (UUID, PK)
- `name` (VARCHAR 100) — `Starter`, `Growth`, `Professional`, `Enterprise`
- `code` (VARCHAR 50, UNIQUE)
- `monthly_price` (DECIMAL(10,2))
- `annual_price` (DECIMAL(10,2))
- `seat_limit` (INT)
- `features` (JSONB) — `{ "quotations": true, "automations": true, "custom_fields": true }`
- `is_active` (BOOLEAN, DEFAULT true)

#### `subscriptions`
- `id` (UUID, PK)
- `tenant_id` (UUID, UNIQUE, FK -> tenants)
- `plan_id` (UUID, FK -> subscription_plans)
- `status` (ENUM: `ACTIVE`, `TRIALING`, `PAST_DUE`, `CANCELLED`)
- `current_period_start` (TIMESTAMPTZ)
- `current_period_end` (TIMESTAMPTZ)
- `cancel_at_period_end` (BOOLEAN, DEFAULT false)
- `created_at`, `updated_at`

#### `audit_logs`
- `id` (UUID, PK)
- `tenant_id` (UUID, NULLABLE, FK -> tenants)
- `user_id` (UUID, NULLABLE, FK -> users)
- `action` (VARCHAR 100)
- `entity_type` (VARCHAR 100)
- `entity_id` (UUID, NULLABLE)
- `ip_address` (VARCHAR 45)
- `user_agent` (TEXT)
- `metadata` (JSONB)
- `created_at` (TIMESTAMPTZ DEFAULT NOW())
