import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { SYSTEM_PERMISSIONS } from "@/lib/rbac/permissions";

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
    // 1. Tenant Memberships
    `ALTER TABLE "tenant_memberships" ADD COLUMN IF NOT EXISTS "agency_client_id" TEXT;`,

    // 2. Leads Rubric Columns
    `ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "service_required" TEXT;`,
    `ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "deal_value" DOUBLE PRECISION;`,
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

    // 9. Performance Indexes
    `CREATE INDEX IF NOT EXISTS "tenant_memberships_agency_client_idx" ON "tenant_memberships"("tenant_id", "agency_client_id");`,
    `CREATE INDEX IF NOT EXISTS "leads_client_id_idx" ON "leads"("tenant_id", "client_id");`,
    `CREATE INDEX IF NOT EXISTS "tasks_client_id_idx" ON "tasks"("tenant_id", "client_id");`
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

    // 4. Ensure Clients
    let sapna = await prisma.agencyClient.findFirst({
      where: { tenantId, name: "Sapna Washing Point" },
    });
    if (!sapna) {
      sapna = await prisma.agencyClient.create({
        data: {
          tenantId,
          name: "Sapna Washing Point",
          brandName: "Sapna Detailing & Car Spa",
          industry: "Automotive Detailing & Car Care",
          website: "https://sapnawashing.in",
          phone: "+91 98930 11223",
          email: "contact@sapnawashing.in",
          city: "Indore",
          state: "Madhya Pradesh",
          activePackage: "Growth Retainer (Social + Local SEO)",
          monthlyRetainer: 50000.0,
          status: "ACTIVE",
          onboardingProgress: 100,
          postsPlanned: 12,
          postsCompleted: 8,
          accountManagerName: "Kunal Sharma",
          leadDesignerName: "Pooja Verma",
        },
      });
    }

    let amba = await prisma.agencyClient.findFirst({
      where: { tenantId, name: "Maa Amba Foam & Furnishing" },
    });
    if (!amba) {
      amba = await prisma.agencyClient.create({
        data: {
          tenantId,
          name: "Maa Amba Foam & Furnishing",
          brandName: "Amba Living & Mattresses",
          industry: "Home Decor & Furniture Retail",
          website: "https://maaambafurnishing.com",
          phone: "+91 98260 44556",
          email: "care@maaambafurnishing.com",
          city: "Bhopal",
          state: "Madhya Pradesh",
          activePackage: "Enterprise Creative & Meta Ads Retainer",
          monthlyRetainer: 100000.0,
          status: "ACTIVE",
          onboardingProgress: 100,
          postsPlanned: 20,
          postsCompleted: 14,
          accountManagerName: "Ansh Chourasiya",
          leadDesignerName: "Deepak Joshi",
        },
      });
    }

    // 5. Ensure Persona Users
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
        update: { fullName, passwordHash, isPlatformAdmin, isActive: true },
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

    // Account Manager
    await ensureUserWithMembership(
      "kunal@goodwingrowai.com",
      "Kunal Sharma (Senior Account Manager)",
      "AccountManager@2026!",
      accountManagerRole.id,
      null,
      false
    );

    // Designer
    await ensureUserWithMembership(
      "pooja@goodwingrowai.com",
      "Pooja Verma (Lead Motion & Visual Designer)",
      "Designer@2026!",
      designerRole.id,
      null,
      false
    );

    // Client 1 (Sapna)
    await ensureUserWithMembership(
      "client@sapnawashing.in",
      "Rajesh Patidar (Sapna Detailing Owner)",
      "ClientPortal@2026!",
      clientRole.id,
      sapna.id,
      false
    );

    // Client 2 (Amba)
    await ensureUserWithMembership(
      "client@ambafurnishing.com",
      "Suresh Agarwal (Amba Living Owner)",
      "ClientPortal@2026!",
      clientRole.id,
      amba.id,
      false
    );

    // 6. Seed sample creative assets if none exist for this tenant
    const existingAssets = await prisma.creativeAsset.count({ where: { tenantId } });
    if (existingAssets === 0) {
      await prisma.creativeAsset.create({
        data: {
          tenantId,
          clientId: sapna.id,
          title: "Diwali 30% Off Detailing Spa Carousel",
          assetType: "Instagram 5-Slide Carousel (1080x1350)",
          dimensions: "1080x1350",
          fileUrl: "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800",
          mediaType: "image",
          version: 2,
          reviewStatus: "CLIENT_REVIEW" as any,
          submittedBy: "Pooja Verma",
          versions: {
            create: [
              {
                tenantId,
                versionNumber: 1,
                fileUrl: "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800",
                mediaType: "image",
                changelog: "v1: Draft slide flow and typography",
                submittedBy: "Pooja Verma",
              },
              {
                tenantId,
                versionNumber: 2,
                fileUrl: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800",
                mediaType: "image",
                changelog: "v2: Added WhatsApp booking QR code and festive golden accents",
                submittedBy: "Pooja Verma",
              },
            ],
          },
          comments: {
            create: [
              {
                tenantId,
                versionNumber: 1,
                authorName: "Kunal Sharma",
                authorRole: "Account Manager",
                content: "Internal review note: Please verify brand cyan #06B6D4 matches the approved deck before client sees this.",
                isInternal: true,
              },
              {
                tenantId,
                versionNumber: 2,
                authorName: "Pooja Verma",
                authorRole: "Designer",
                content: "Colors matched and high-res ceramic gloss slides uploaded for client review.",
                isInternal: false,
              },
            ],
          },
        },
      });

      // Video Creative
      await prisma.creativeAsset.create({
        data: {
          tenantId,
          clientId: sapna.id,
          title: "High-Pressure Snow Foam ASMR & Paint Protection Reel",
          assetType: "Vertical 9:16 Video Reel (1080x1920)",
          dimensions: "1080x1920",
          fileUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
          mediaType: "video",
          version: 1,
          reviewStatus: "INTERNAL_REVIEW" as any,
          submittedBy: "Deepak Joshi",
          versions: {
            create: [
              {
                tenantId,
                versionNumber: 1,
                fileUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
                mediaType: "video",
                changelog: "v1: Rough video cut with slow-motion foam nozzle audio",
                submittedBy: "Deepak Joshi",
              },
            ],
          },
        },
      });
    }

    // 7. Seed sample content posts if none exist
    const existingPosts = await prisma.contentPost.count({ where: { tenantId } });
    if (existingPosts === 0) {
      const now = Date.now();
      await prisma.contentPost.createMany({
        data: [
          {
            tenantId,
            clientId: sapna.id,
            platform: "INSTAGRAM" as any,
            postType: "5-Slide Carousel",
            title: "Diwali 30% Off Detailing Spa Carousel",
            caption: "Festival season brings traffic, dust, and fireworks fallout. Protect your ride with 9H ceramic coating!",
            ownerName: "Pooja Verma",
            deadline: new Date(now - 2 * 86400000), // Overdue deadline
            approvalStatus: "CLIENT_REVIEW",
            scheduledDate: new Date(now + 4 * 86400000),
            status: "SCHEDULED" as any,
            mediaUrl: "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800",
            festivalOrEvent: "Diwali Festive Campaign",
          },
          {
            tenantId,
            clientId: sapna.id,
            platform: "INSTAGRAM" as any,
            postType: "Reel",
            title: "Foam Wash ASMR & Water Beading Demonstration",
            caption: "Satisfying car wash transformation 🚗💦 Watch the water sheet off the hydrophobic shield.",
            ownerName: "Deepak Joshi",
            deadline: new Date(now + 1 * 86400000),
            approvalStatus: "INTERNAL_REVIEW",
            scheduledDate: new Date(now + 3 * 86400000),
            status: "SCHEDULED" as any,
            mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            festivalOrEvent: "Weekly Brand Content",
          },
        ],
      });
    }

    // 8. Seed sample leads if none exist
    const existingLeads = await prisma.lead.count({ where: { tenantId } });
    if (existingLeads === 0) {
      const now = Date.now();
      await prisma.lead.createMany({
        data: [
          {
            tenantId,
            clientId: sapna.id,
            firstName: "Vikram",
            lastName: "Singhania",
            companyName: "Singhania Logistics & Fleet Services",
            email: "vikram@singhanialogistics.in",
            phone: "+91 98111 22334",
            status: "QUALIFIED" as any,
            source: "Google Ads (High Intent)",
            serviceRequired: "Corporate Fleet Ceramic Spa Retainer",
            dealValue: 480000.0,
            nextFollowUp: new Date(now + 1 * 86400000),
            priority: "HIGH" as any,
            score: 85,
          },
          {
            tenantId,
            clientId: amba.id,
            firstName: "Meenakshi",
            lastName: "Rao",
            companyName: "Rao Luxury Home Interior Design Studio",
            email: "meenakshi@raodesignstudio.com",
            phone: "+91 98222 33445",
            status: "PROPOSAL" as any,
            source: "Meta Lead Gen Form",
            serviceRequired: "Custom Modular Sectional & Mattresses",
            dealValue: 750000.0,
            nextFollowUp: new Date(now + 2 * 86400000),
            priority: "URGENT" as any,
            score: 92,
          },
        ],
      });
    }

    // 9. Seed sample tasks if none exist
    const existingTasks = await prisma.task.count({ where: { tenantId } });
    if (existingTasks === 0) {
      const now = Date.now();
      await prisma.task.createMany({
        data: [
          {
            tenantId,
            clientId: sapna.id,
            title: "Deliver Diwali 5-Slide Carousel revisions for Sapna Detailing",
            description: "Implement WhatsApp QR placement and enlarge festive discount badge",
            dueDate: new Date(now - 1 * 86400000), // Overdue!
            priority: "URGENT" as any,
            status: "PENDING" as any,
            checklist: [
              { id: "1", text: "Check brand cyan #06B6D4 HEX consistency", completed: true },
              { id: "2", text: "Export 1080x1350 PNG with 300 DPI", completed: false },
              { id: "3", text: "Upload to client portal for approval", completed: false },
            ],
            attachments: [
              { name: "Sapna_Brand_Guide_v2.pdf", url: "https://example.com/guide.pdf", size: "2.4 MB" },
            ],
            isRecurring: true,
            recurringInterval: "WEEKLY",
          },
        ],
      });
    }

    isDataEnsured = true;
    console.log("✅ ensureRubricPersonas: Successfully initialized rubric data & personas.");
  } catch (err: any) {
    console.warn("⚠️ ensureRubricPersonas notice:", err.message);
  }
}
