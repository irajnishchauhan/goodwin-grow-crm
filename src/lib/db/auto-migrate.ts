import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { SYSTEM_PERMISSIONS } from "@/lib/rbac/permissions";
import { GOODWIN_GROW_AI_CATALOG } from "@/lib/constants/market-catalog";

let isSchemaEnsured = false;
let isDataEnsured = false;

/**
 * Automatically ensures all columns, tables, and enum values required by the rubric
 * exist in the connected PostgreSQL database (whether Vercel Postgres, Supabase, Neon, etc.)
 * Uses native idempotent PostgreSQL statements.
 */
export async function ensureDatabaseSchema() {
  if (isSchemaEnsured) return;

  const ddlStatements = [
    // 0. Tenant Settings Logo Column
    `ALTER TABLE "tenant_settings" ADD COLUMN IF NOT EXISTS "logo_url" TEXT;`,

    // 1. Tenant Memberships
    `ALTER TABLE "tenant_memberships" ADD COLUMN IF NOT EXISTS "agency_client_id" TEXT;`,

    // 2. Leads Rubric Columns
    `ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "service_required" TEXT;`,
    `ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "deal_value" DECIMAL(14, 2);`,
    `ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "next_follow_up" TIMESTAMP(3);`,
    `ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "lost_reason" TEXT;`,
    `ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "client_id" TEXT;`,

    // 3. Tasks Rubric Columns
    `ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "checklist" JSONB DEFAULT '[]'::jsonb;`,
    `ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "attachments" JSONB DEFAULT '[]'::jsonb;`,
    `ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "is_recurring" BOOLEAN DEFAULT false;`,
    `ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "recurring_interval" TEXT;`,
    `ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "client_id" TEXT;`,
    `ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "project_id" TEXT;`,

    // 4. Content Posts Rubric Columns
    `ALTER TABLE "content_posts" ADD COLUMN IF NOT EXISTS "owner_name" TEXT;`,
    `ALTER TABLE "content_posts" ADD COLUMN IF NOT EXISTS "deadline" TIMESTAMP(3);`,
    `ALTER TABLE "content_posts" ADD COLUMN IF NOT EXISTS "approval_status" TEXT DEFAULT 'SCHEDULED';`,

    // 5. Creative Assets Rubric Columns
    `ALTER TABLE "creative_assets" ADD COLUMN IF NOT EXISTS "media_type" TEXT DEFAULT 'image';`,
    `ALTER TABLE "creative_assets" ADD COLUMN IF NOT EXISTS "approver_name" TEXT;`,
    `ALTER TABLE "creative_assets" ADD COLUMN IF NOT EXISTS "approver_email" TEXT;`,
    `ALTER TABLE "creative_assets" ADD COLUMN IF NOT EXISTS "approved_at" TIMESTAMP(3);`,

    // 6. Creative Versions Table
    `CREATE TABLE IF NOT EXISTS "creative_versions" (
      "id" TEXT PRIMARY KEY,
      "tenant_id" TEXT NOT NULL,
      "asset_id" TEXT NOT NULL,
      "version_number" INTEGER NOT NULL,
      "file_url" TEXT NOT NULL,
      "media_type" TEXT NOT NULL DEFAULT 'image',
      "changelog" TEXT,
      "submitted_by" TEXT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "creative_versions_asset_version_key" ON "creative_versions"("asset_id", "version_number");`,
    `CREATE INDEX IF NOT EXISTS "creative_versions_tenant_asset_idx" ON "creative_versions"("tenant_id", "asset_id");`,

    // 7. Creative Comments Table
    `CREATE TABLE IF NOT EXISTS "creative_comments" (
      "id" TEXT PRIMARY KEY,
      "tenant_id" TEXT NOT NULL,
      "asset_id" TEXT NOT NULL,
      "version_number" INTEGER NOT NULL DEFAULT 1,
      "author_name" TEXT NOT NULL,
      "author_role" TEXT,
      "content" TEXT NOT NULL,
      "is_internal" BOOLEAN NOT NULL DEFAULT false,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE INDEX IF NOT EXISTS "creative_comments_tenant_asset_idx" ON "creative_comments"("tenant_id", "asset_id");`,

    // 8. Client Deliverables & Reports Tables
    `CREATE TABLE IF NOT EXISTS "client_deliverables" (
      "id" TEXT PRIMARY KEY,
      "tenant_id" TEXT NOT NULL,
      "client_id" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "format" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'COMPLETED',
      "delivered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "client_reports" (
      "id" TEXT PRIMARY KEY,
      "tenant_id" TEXT NOT NULL,
      "client_id" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "type" TEXT NOT NULL DEFAULT 'PDF',
      "file_url" TEXT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    // 9. Marketing Festivals & Campaign Hooks Table
    `CREATE TABLE IF NOT EXISTS "marketing_festivals" (
      "id" TEXT PRIMARY KEY,
      "tenant_id" TEXT NOT NULL,
      "date" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "tag" TEXT NOT NULL,
      "desc" TEXT NOT NULL,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    // 10. Agency Clients Contract & Package Enhancements
    `ALTER TABLE "agency_clients" ADD COLUMN IF NOT EXISTS "billing_cycle" TEXT DEFAULT 'MONTHLY';`,
    `ALTER TABLE "agency_clients" ADD COLUMN IF NOT EXISTS "package_status" TEXT DEFAULT 'ACTIVE';`,
    `ALTER TABLE "agency_clients" ADD COLUMN IF NOT EXISTS "contract_end_date" TIMESTAMP(3);`,
    `ALTER TABLE "agency_clients" ADD COLUMN IF NOT EXISTS "add_on_services" JSONB DEFAULT '[]'::jsonb;`,
    `ALTER TABLE "agency_clients" ADD COLUMN IF NOT EXISTS "custom_pricing" BOOLEAN DEFAULT false;`,
    `ALTER TABLE "agency_clients" ADD COLUMN IF NOT EXISTS "estimated_delivery_cost" DECIMAL(14, 2) DEFAULT 0.00;`,
    `ALTER TABLE "agency_clients" ADD COLUMN IF NOT EXISTS "account_manager_id" TEXT;`,

    // 11. Agency Client Notes (Confidential Records)
    `DO $$ BEGIN
      CREATE TYPE "ClientNoteCategory" AS ENUM ('REQUIREMENT', 'MEETING_NOTE', 'STRATEGY', 'FOLLOW_UP', 'IMPORTANT_INFO');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;`,
    `CREATE TABLE IF NOT EXISTS "agency_client_notes" (
      "id" TEXT PRIMARY KEY,
      "tenant_id" TEXT NOT NULL,
      "client_id" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "category" "ClientNoteCategory" NOT NULL DEFAULT 'IMPORTANT_INFO',
      "is_confidential" BOOLEAN NOT NULL DEFAULT true,
      "created_by_id" TEXT NOT NULL,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE INDEX IF NOT EXISTS "agency_client_notes_tenant_client_idx" ON "agency_client_notes"("tenant_id", "client_id");`,
    `CREATE INDEX IF NOT EXISTS "agency_client_notes_tenant_category_idx" ON "agency_client_notes"("tenant_id", "category");`,

    // 12. Client Credentials Vault
    `CREATE TABLE IF NOT EXISTS "agency_client_credentials" (
      "id" TEXT PRIMARY KEY,
      "tenant_id" TEXT NOT NULL,
      "client_id" TEXT NOT NULL,
      "platform" TEXT NOT NULL,
      "account_identifier" TEXT NOT NULL,
      "encrypted_password" TEXT,
      "login_url" TEXT,
      "recovery_details" TEXT,
      "access_level" TEXT NOT NULL DEFAULT 'ADMIN',
      "notes" TEXT,
      "is_verified" BOOLEAN NOT NULL DEFAULT true,
      "created_by_id" TEXT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE INDEX IF NOT EXISTS "agency_client_credentials_tenant_client_idx" ON "agency_client_credentials"("tenant_id", "client_id");`,
    `CREATE INDEX IF NOT EXISTS "agency_client_credentials_tenant_platform_idx" ON "agency_client_credentials"("tenant_id", "platform");`,

    // 13. Agency Invoices Ad-Hoc / New Client Columns
    `ALTER TABLE "agency_invoices" ADD COLUMN IF NOT EXISTS "client_name" TEXT;`,
    `ALTER TABLE "agency_invoices" ADD COLUMN IF NOT EXISTS "client_billing_details" JSONB;`,

    // 14. Performance Indexes
    `CREATE INDEX IF NOT EXISTS "tenant_memberships_agency_client_idx" ON "tenant_memberships"("tenant_id", "agency_client_id");`,
    `CREATE INDEX IF NOT EXISTS "leads_client_id_idx" ON "leads"("tenant_id", "client_id");`,
    `CREATE INDEX IF NOT EXISTS "tasks_client_id_idx" ON "tasks"("tenant_id", "client_id");`,
    `CREATE INDEX IF NOT EXISTS "marketing_festivals_tenant_idx" ON "marketing_festivals"("tenant_id");`
  ];

  for (const stmt of ddlStatements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
    } catch (err: any) {
      console.warn("Auto-migrate warning on statement:", stmt.slice(0, 40), err.message);
    }
  }

  // Attempt enum values addition safely
  const enumValues = ["DRAFT", "INTERNAL_REVIEW", "CLIENT_REVIEW", "SCHEDULED", "PUBLISHED"];
  for (const val of enumValues) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "CreativeReviewStatus" ADD VALUE IF NOT EXISTS '${val}';`);
    } catch {
      // Safe ignore if enum does not exist or value already exists
    }
  }

  isSchemaEnsured = true;
}

/**
 * Ensures rubric personas, tenant, roles, and initial seed data exist in the database.
 */
export async function ensureRubricPersonas() {
  if (isDataEnsured) return;

  await ensureDatabaseSchema();

  try {
    // 1. Ensure Tenant
    let tenant = await prisma.tenant.findUnique({
      where: { code: "goodwin-grow-ai" },
    });
    const isNewTenant = !tenant;

    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          code: "goodwin-grow-ai",
          name: "Goodwin Grow AI Marketing Agency",
          status: "ACTIVE",
        },
      });
    }

    const tenantId = tenant.id;

    // 2. Ensure Permissions
    for (const p of SYSTEM_PERMISSIONS) {
      await prisma.permission.upsert({
        where: { code: p.code },
        update: { description: p.description, module: p.module },
        create: { code: p.code, module: p.module, description: p.description },
      });
    }

    const allPerms = await prisma.permission.findMany();
    const permsMap = new Map(allPerms.map((p) => [p.code, p.id]));

    // 3. Ensure Roles
    async function ensureRole(name: string, description: string, codes: string[]) {
      let role = await prisma.role.findFirst({
        where: { tenantId, name },
      });
      if (!role) {
        role = await prisma.role.create({
          data: {
            tenantId,
            name,
            description,
            isSystem: true,
          },
        });
      }

      for (const code of codes) {
        const permId = permsMap.get(code);
        if (permId) {
          await prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: role.id, permissionId: permId } },
            update: {},
            create: { roleId: role.id, permissionId: permId },
          });
        }
      }
      return role;
    }

    const agencyAdminRole = await ensureRole(
      "Agency Admin",
      "Full organization control across clients, creative pods, team, and financials",
      allPerms.map((p) => p.code)
    );

    const accountManagerRole = await ensureRole(
      "Account Manager",
      "Client relationship, pipeline, task, and creative internal review oversight",
      [
        "leads:read", "leads:write", "leads:convert", "leads:export",
        "contacts:read", "contacts:write",
        "companies:read", "companies:write",
        "deals:read", "deals:write", "deals:stages",
        "tasks:read", "tasks:write",
        "activities:log",
        "creatives:read", "creatives:write", "creatives:review_internal", "creatives:version",
        "calendar:read", "calendar:write",
        "clients:read", "clients:write",
        "reports:read",
        "quotations:read", "quotations:write",
      ]
    );

    const designerRole = await ensureRole(
      "Designer",
      "Creative visual production, asset versioning, and feedback review",
      [
        "creatives:read", "creatives:write", "creatives:version",
        "tasks:read", "tasks:write",
        "calendar:read", "calendar:write",
      ]
    );

    const clientRole = await ensureRole(
      "Client",
      "Strict client portal access to assigned deliverables, approvals, and reports",
      [
        "portal:access",
        "creatives:read",
        "creatives:review_client",
        "calendar:read",
        "reports:read",
      ]
    );

    // 4. Purge any dummy demo clients and their mock data in goodwin-grow-ai
    const demoClientNames = [
      "Sapna Washing Point",
      "Maa Amba Foam & Furnishing",
      "ZestPure Omnichannel D2C Nutrition",
      "FinEdge Neo-Banking & Wealth Technologies",
      "Mahalaxmi Heritage Jewellers Group",
      "Nikita Shrivastava (Lucky's Hair Studio)",
    ];

    const demoClients = await prisma.agencyClient.findMany({
      where: {
        tenantId,
        OR: demoClientNames.map((n) => ({ name: { contains: n, mode: "insensitive" } })),
      },
    });

    if (demoClients.length > 0) {
      for (const dc of demoClients) {
        await prisma.creativeComment.deleteMany({ where: { tenantId, asset: { clientId: dc.id } } }).catch(() => {});
        await prisma.creativeVersion.deleteMany({ where: { tenantId, asset: { clientId: dc.id } } }).catch(() => {});
        await prisma.creativeAsset.deleteMany({ where: { tenantId, clientId: dc.id } }).catch(() => {});
        await prisma.contentPost.deleteMany({ where: { tenantId, clientId: dc.id } }).catch(() => {});
        await prisma.adCampaign.deleteMany({ where: { tenantId, clientId: dc.id } }).catch(() => {});
        await prisma.seoTracker.deleteMany({ where: { tenantId, clientId: dc.id } }).catch(() => {});
        await prisma.agencyInvoice.deleteMany({ where: { tenantId, clientId: dc.id } }).catch(() => {});
        await prisma.agencyExpense.deleteMany({ where: { tenantId, clientId: dc.id } }).catch(() => {});
        await prisma.agencyTask.deleteMany({ where: { tenantId, clientId: dc.id } }).catch(() => {});
        await prisma.task.deleteMany({ where: { tenantId, clientId: dc.id } }).catch(() => {});
        await prisma.lead.deleteMany({ where: { tenantId, clientId: dc.id } }).catch(() => {});
        await prisma.tenantMembership.deleteMany({ where: { tenantId, agencyClientId: dc.id } }).catch(() => {});
        await prisma.agencyClient.delete({ where: { id: dc.id } }).catch(() => {});
      }
      console.log(`🧹 Cleaned ${demoClients.length} pre-seeded demo clients from goodwin-grow-ai.`);
    }

    // Sanitize any dummy pod members assigned to real clients (Pooja Verma, Aman Gupta, Kunal Sharma)
    await prisma.agencyClient.updateMany({
      where: {
        tenantId,
        leadDesignerName: { equals: "Pooja Verma", mode: "insensitive" },
      },
      data: {
        leadDesignerName: null,
      },
    }).catch(() => {});

    await prisma.agencyClient.updateMany({
      where: {
        tenantId,
        contentWriterName: { equals: "Aman Gupta", mode: "insensitive" },
      },
      data: {
        contentWriterName: null,
      },
    }).catch(() => {});

    await prisma.agencyClient.updateMany({
      where: {
        tenantId,
        accountManagerName: { equals: "Kunal Sharma", mode: "insensitive" },
      },
      data: {
        accountManagerName: null,
      },
    }).catch(() => {});

    // Purge any incorrect dummy festival dates (Oct 28, Oct 30, Nov 02)
    await (prisma as any).marketingFestival?.deleteMany({
      where: {
        tenantId,
        OR: [
          { date: { contains: "Oct 28" } },
          { date: { contains: "Oct 30" } },
          { date: { contains: "Nov 02" } },
        ],
      },
    }).catch(() => {});
    await prisma.$executeRawUnsafe(
      `DELETE FROM "marketing_festivals" 
       WHERE ("date" LIKE '%Oct 28%' OR "date" LIKE '%Oct 30%' OR "date" LIKE '%Nov 02%')
         AND "tenant_id" = $1`,
      tenantId
    ).catch(() => {});

    // 5. Ensure Persona Users (Agency Team Members)
    async function ensureUserWithMembership(
      email: string,
      fullName: string,
      passwordPlain: string,
      roleId: string,
      agencyClientId?: string | null,
      isPlatformAdmin: boolean = false
    ) {
      const passwordHash = await hashPassword(passwordPlain);
      const user = await prisma.user.upsert({
        where: { email },
        update: { fullName, isPlatformAdmin, isActive: true },
        create: { email, fullName, passwordHash, isPlatformAdmin, isActive: true },
      });

      const membership = await prisma.tenantMembership.upsert({
        where: { tenantId_userId: { tenantId, userId: user.id } },
        update: {
          agencyClientId: agencyClientId || null,
          status: "ACTIVE",
        },
        create: {
          tenantId,
          userId: user.id,
          agencyClientId: agencyClientId || null,
          status: "ACTIVE",
          isOwner: email === "admin@goodwingrowai.com",
        },
      });

      await prisma.membershipRole.upsert({
        where: { membershipId_roleId: { membershipId: membership.id, roleId } },
        update: {},
        create: { membershipId: membership.id, roleId },
      });

      return user;
    }

    // Platform Super Admin
    await ensureUserWithMembership(
      "superadmin@goodwingrowai.com",
      "Goodwin Super Admin",
      "GoodwinAdmin@2026!",
      agencyAdminRole.id,
      null,
      true
    );

    // Agency Admin
    await ensureUserWithMembership(
      "admin@goodwingrowai.com",
      "Aarav Singhania (Agency Director)",
      "AgencyAdmin@2026!",
      agencyAdminRole.id,
      null,
      false
    );

    // Clean up any fake users / demo logins (Pooja Verma, Kunal Sharma, demo clients)
    const fakeEmails = [
      "pooja@goodwingrowai.com",
      "kunal@goodwingrowai.com",
      "client@sapnawashing.in",
      "client@ambafurnishing.com",
      "admin@sapnawashing.com"
    ];
    for (const em of fakeEmails) {
      const u = await prisma.user.findUnique({ where: { email: em } });
      if (u) {
        await prisma.session.deleteMany({ where: { userId: u.id } }).catch(() => {});
        await prisma.activity.deleteMany({ where: { performedById: u.id } }).catch(() => {});
        await prisma.note.deleteMany({ where: { createdById: u.id } }).catch(() => {});
        await prisma.task.updateMany({ where: { assignedToId: u.id }, data: { assignedToId: null } }).catch(() => {});
        await prisma.lead.updateMany({ where: { assignedOwnerId: u.id }, data: { assignedOwnerId: null } }).catch(() => {});
        await prisma.contact.updateMany({ where: { assignedOwnerId: u.id }, data: { assignedOwnerId: null } }).catch(() => {});
        await prisma.company.updateMany({ where: { assignedOwnerId: u.id }, data: { assignedOwnerId: null } }).catch(() => {});
        await prisma.deal.updateMany({ where: { assignedOwnerId: u.id }, data: { assignedOwnerId: null } }).catch(() => {});
        await prisma.dealStageHistory.deleteMany({ where: { changedById: u.id } }).catch(() => {});
        await prisma.auditLog.deleteMany({ where: { userId: u.id } }).catch(() => {});
        await prisma.membershipRole.deleteMany({ where: { membership: { userId: u.id } } }).catch(() => {});
        await prisma.tenantMembership.deleteMany({ where: { userId: u.id } }).catch(() => {});
        await prisma.user.delete({ where: { id: u.id } }).catch(() => {});
      }
    }

    // Clean up any orphaned mock leads or tasks
    await prisma.lead.deleteMany({
      where: {
        tenantId,
        email: { in: ["vikram@singhanialogistics.in", "meenakshi@raodesignstudio.com"] },
      },
    }).catch(() => {});
    await prisma.task.deleteMany({
      where: {
        tenantId,
        title: { contains: "Diwali 5-Slide Carousel revisions" },
      },
    }).catch(() => {});

    // Ensure strict workspace member isolation between distinct businesses
    await ensureWorkspaceMemberIsolation();

    // Ensure market-standard services catalogue for Goodwin Grow AI
    await ensureMarketCatalogue();

    isDataEnsured = true;
    console.log("✅ ensureRubricPersonas: Successfully verified personas & clean workspace state.");
  } catch (err: any) {
    console.warn("⚠️ ensureRubricPersonas notice:", err.message);
  }
}

/**
 * Ensures standard market-tier catalogue of products and services (5 Free lead magnets & 15 Paid services)
 */
export async function ensureMarketCatalogue() {
  try {
    const growAiTenant = await prisma.tenant.findUnique({ where: { code: "goodwin-grow-ai" } });
    if (!growAiTenant) return;

    for (const item of GOODWIN_GROW_AI_CATALOG) {
      const existing = await prisma.product.findFirst({
        where: { tenantId: growAiTenant.id, sku: item.sku },
      });
      if (!existing) {
        await prisma.product.create({
          data: {
            tenantId: growAiTenant.id,
            name: item.name,
            sku: item.sku,
            description: item.description,
            unitPrice: item.unitPrice,
            currency: item.currency,
            isActive: true,
          },
        });
      }
    }
    console.log("✅ ensureMarketCatalogue: Market catalogue verified for Goodwin Grow AI.");
  } catch (err: any) {
    console.warn("⚠️ ensureMarketCatalogue notice:", err.message);
  }
}

/**
 * Enforces strict workspace member isolation between separate tenants
 * (e.g. Goodwin Grow AI vs. Goodwin Batteries vs. client portals).
 */
export async function ensureWorkspaceMemberIsolation() {
  try {
    const growAiTenant = await prisma.tenant.findUnique({ where: { code: "goodwin-grow-ai" } });
    let batteriesTenant = await prisma.tenant.findUnique({ where: { code: "goodwin-batteries" } });

    if (!batteriesTenant) {
      batteriesTenant = await prisma.tenant.create({
        data: {
          code: "goodwin-batteries",
          name: "Goodwin Batteries",
          status: "ACTIVE",
        },
      });
    }

    // Ensure roles in Goodwin Batteries
    let gbOwnerRole = await prisma.role.findFirst({
      where: { tenantId: batteriesTenant.id, name: "Company Owner" },
    });
    if (!gbOwnerRole) {
      gbOwnerRole = await prisma.role.create({
        data: {
          tenantId: batteriesTenant.id,
          name: "Company Owner",
          description: "Full administrative ownership of Goodwin Batteries",
          isSystem: true,
        },
      });
    }

    let gbSalesManagerRole = await prisma.role.findFirst({
      where: { tenantId: batteriesTenant.id, name: "Sales Manager" },
    });
    if (!gbSalesManagerRole) {
      gbSalesManagerRole = await prisma.role.create({
        data: {
          tenantId: batteriesTenant.id,
          name: "Sales Manager",
          description: "Sales & distribution operations for Goodwin Batteries",
          isSystem: true,
        },
      });
    }

    // Ensure Sameer Meena in Goodwin Batteries
    const sameerBatteryEmail = "sameergoodwinbatteries@gmail.com";
    let sameerUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: sameerBatteryEmail },
          { email: "sameer@goodwingrowai.com" },
        ],
      },
    });

    if (sameerUser && sameerUser.email === "sameer@goodwingrowai.com") {
      const existingNew = await prisma.user.findUnique({ where: { email: sameerBatteryEmail } });
      if (!existingNew) {
        sameerUser = await prisma.user.update({
          where: { id: sameerUser.id },
          data: {
            email: sameerBatteryEmail,
            fullName: "Sameer Meena",
            phone: "+91 9893744311",
          },
        });
      }
    }

    if (!sameerUser) {
      const defaultHash = await hashPassword("Sameer@2026!");
      sameerUser = await prisma.user.create({
        data: {
          email: sameerBatteryEmail,
          fullName: "Sameer Meena",
          phone: "+91 9893744311",
          passwordHash: defaultHash,
          isActive: true,
        },
      });
    }

    const sameerMembership = await prisma.tenantMembership.upsert({
      where: { tenantId_userId: { tenantId: batteriesTenant.id, userId: sameerUser.id } },
      update: { status: "ACTIVE" },
      create: {
        tenantId: batteriesTenant.id,
        userId: sameerUser.id,
        status: "ACTIVE",
        isOwner: false,
      },
    });

    if (gbSalesManagerRole) {
      await prisma.membershipRole.upsert({
        where: { membershipId_roleId: { membershipId: sameerMembership.id, roleId: gbSalesManagerRole.id } },
        update: {},
        create: { membershipId: sameerMembership.id, roleId: gbSalesManagerRole.id },
      });
    }

    // Disassociate Sameer from Goodwin Grow AI
    if (growAiTenant) {
      const wrongSameerMem = await prisma.tenantMembership.findFirst({
        where: { tenantId: growAiTenant.id, userId: sameerUser.id },
      });
      if (wrongSameerMem) {
        await prisma.membershipRole.deleteMany({ where: { membershipId: wrongSameerMem.id } });
        await prisma.tenantMembership.delete({ where: { id: wrongSameerMem.id } });
      }
    }

    // Ensure Goodwin Batteries Admin user
    let gbAdminUser = await prisma.user.findUnique({ where: { email: "admin@goodwinbatteries.com" } });
    if (!gbAdminUser) {
      const defaultHash = await hashPassword("BatteriesAdmin@2026!");
      gbAdminUser = await prisma.user.create({
        data: {
          email: "admin@goodwinbatteries.com",
          fullName: "Goodwin Batteries Admin",
          passwordHash: defaultHash,
          isActive: true,
        },
      });
    }
    const gbAdminMem = await prisma.tenantMembership.upsert({
      where: { tenantId_userId: { tenantId: batteriesTenant.id, userId: gbAdminUser.id } },
      update: { status: "ACTIVE", isOwner: true },
      create: {
        tenantId: batteriesTenant.id,
        userId: gbAdminUser.id,
        status: "ACTIVE",
        isOwner: true,
      },
    });
    if (gbOwnerRole) {
      await prisma.membershipRole.upsert({
        where: { membershipId_roleId: { membershipId: gbAdminMem.id, roleId: gbOwnerRole.id } },
        update: {},
        create: { membershipId: gbAdminMem.id, roleId: gbOwnerRole.id },
      });
    }

    // Clean out Agency members and Platform Admin from Goodwin Batteries
    const agencyEmailsToExcludeFromBatteries = [
      "admin@goodwingrowai.com",
      "kunalgoodwingrow@gmail.com",
      "goodwingrow.ansh@gmail.com",
      "rohit@goodwingrowai.com",
      "aayan@goodwingrowai.com",
      "superadmin@goodwingrowai.com",
    ];

    const agencyUsersInBatteries = await prisma.user.findMany({
      where: { email: { in: agencyEmailsToExcludeFromBatteries } },
      select: { id: true, email: true },
    });

    for (const u of agencyUsersInBatteries) {
      const mem = await prisma.tenantMembership.findFirst({
        where: { tenantId: batteriesTenant.id, userId: u.id },
      });
      if (mem) {
        await prisma.membershipRole.deleteMany({ where: { membershipId: mem.id } });
        await prisma.tenantMembership.delete({ where: { id: mem.id } });
      }
    }

    // Clean out Batteries members from Goodwin Grow AI
    if (growAiTenant) {
      const batteryEmailsToExcludeFromGrowAi = [
        "admin@goodwinbatteries.com",
        "sales@goodwinbatteries.com",
        sameerBatteryEmail,
      ];
      const batteryUsersInGrowAi = await prisma.user.findMany({
        where: { email: { in: batteryEmailsToExcludeFromGrowAi } },
        select: { id: true },
      });
      for (const u of batteryUsersInGrowAi) {
        const mem = await prisma.tenantMembership.findFirst({
          where: { tenantId: growAiTenant.id, userId: u.id },
        });
        if (mem) {
          await prisma.membershipRole.deleteMany({ where: { membershipId: mem.id } });
          await prisma.tenantMembership.delete({ where: { id: mem.id } });
        }
      }
    }
  } catch (err: any) {
    console.warn("⚠️ ensureWorkspaceMemberIsolation notice:", err.message);
  }
}
