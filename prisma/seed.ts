import { PrismaClient } from "@prisma/client";
import { provisionTenant } from "../src/lib/tenant/provision";
import { hashPassword } from "../src/lib/auth/password";
import { SYSTEM_PERMISSIONS } from "../src/lib/rbac/permissions";
import { buildGoodwinBatteries } from "../scripts/build-goodwin-batteries";
import { buildGoodwinGrowAI } from "../scripts/build-goodwin-grow-ai";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Goodwin Grow CRM database...");

  // 1. Ensure system permissions are populated
  for (const p of SYSTEM_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: {},
      create: {
        code: p.code,
        module: p.module,
        description: p.description,
      },
    });
  }
  console.log(`✅ Loaded ${SYSTEM_PERMISSIONS.length} system permissions.`);

  // 2. Ensure standard subscription plans exist
  const plans = [
    { name: "Starter", code: "starter", monthlyPrice: 1999, annualPrice: 19990, seatLimit: 5 },
    { name: "Growth", code: "growth", monthlyPrice: 4999, annualPrice: 49990, seatLimit: 15 },
    { name: "Professional", code: "professional", monthlyPrice: 9999, annualPrice: 99990, seatLimit: 50 },
    { name: "Enterprise", code: "enterprise", monthlyPrice: 24999, annualPrice: 249990, seatLimit: 500 },
  ];

  for (const pl of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { code: pl.code },
      update: {},
      create: {
        name: pl.name,
        code: pl.code,
        monthlyPrice: pl.monthlyPrice,
        annualPrice: pl.annualPrice,
        seatLimit: pl.seatLimit,
        features: {
          leads: true,
          deals: true,
          contacts: true,
          quotations: true,
          automations: pl.code !== "starter",
          advanced_reporting: pl.code === "professional" || pl.code === "enterprise",
        },
      },
    });
  }
  console.log("✅ Seeded subscription plans.");

  // 3. Platform Super Admin User
  const superAdminPassword = await hashPassword("GoodwinAdmin@2026!");
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@goodwingrowai.com" },
    update: { isPlatformAdmin: true },
    create: {
      email: "superadmin@goodwingrowai.com",
      fullName: "Goodwin Super Admin",
      passwordHash: superAdminPassword,
      isPlatformAdmin: true,
      isActive: true,
    },
  });
  console.log(`✅ Platform Super Admin created: ${superAdmin.email}`);

  // 4. Provision Tenant 1: Goodwin Grow AI
  let t1Tenant = await prisma.tenant.findUnique({ where: { code: "goodwin-grow-ai" } });
  if (!t1Tenant) {
    const t1 = await provisionTenant({
      name: "Goodwin Grow AI",
      code: "goodwin-grow-ai",
      industry: "AI SaaS & Digital Consulting",
      businessEmail: "info@goodwingrowai.com",
      adminName: "Goodwin Super Admin",
      adminEmail: "superadmin@goodwingrowai.com",
      adminPassword: "GoodwinAdmin@2026!",
      planCode: "enterprise",
      seatLimit: 100,
      createdById: superAdmin.id,
    });
    t1Tenant = t1.tenant;
  }
  console.log(`✅ Provisioned Tenant 1: Goodwin Grow AI (${t1Tenant.id})`);

  // Comprehensive Agency Workspace Setup for Goodwin Grow AI
  await buildGoodwinGrowAI(prisma);

  // 5. Provision Tenant 2: Goodwin Batteries
  let t2Tenant = await prisma.tenant.findUnique({ where: { code: "goodwin-batteries" } });
  if (!t2Tenant) {
    const t2 = await provisionTenant({
      name: "Goodwin Batteries",
      code: "goodwin-batteries",
      industry: "Battery Manufacturing & Distribution",
      businessEmail: "contact@goodwinbatteries.com",
      phone: "+91 98765 43210",
      address: "Plot 42, Industrial Area, Phase II",
      adminName: "Goodwin Batteries Admin",
      adminEmail: "admin@goodwinbatteries.com",
      adminPassword: "CompanyAdmin@2026!",
      planCode: "growth",
      seatLimit: 20,
      createdById: superAdmin.id,
    });
    t2Tenant = t2.tenant;
  }
  console.log(`✅ Provisioned Tenant 2: Goodwin Batteries (${t2Tenant.id})`);

  // Add Sales Manager to Tenant 2
  const salesManagerPassword = await hashPassword("SalesManager@2026!");
  const salesUser = await prisma.user.upsert({
    where: { email: "sales@goodwinbatteries.com" },
    update: {},
    create: {
      email: "sales@goodwinbatteries.com",
      fullName: "Vikram Sharma (Sales Manager)",
      passwordHash: salesManagerPassword,
      isActive: true,
    },
  });

  const managerRole = await prisma.role.findFirst({
    where: { tenantId: t2Tenant.id, name: "Sales Manager" },
  });

  if (managerRole) {
    const existingMembership = await prisma.tenantMembership.findUnique({
      where: {
        tenantId_userId: {
          tenantId: t2Tenant.id,
          userId: salesUser.id,
        },
      },
    });

    if (!existingMembership) {
      const managerMembership = await prisma.tenantMembership.create({
        data: {
          tenantId: t2Tenant.id,
          userId: salesUser.id,
          isOwner: false,
          status: "ACTIVE",
        },
      });

      await prisma.membershipRole.create({
        data: {
          membershipId: managerMembership.id,
          roleId: managerRole.id,
        },
      });
    }
  }

  // Comprehensive Battery Industry Workspace Setup for Goodwin Batteries
  await buildGoodwinBatteries(prisma);

  // 6. Provision Tenant 3: Sapna Washing Point
  let t3Tenant = await prisma.tenant.findUnique({ where: { code: "sapna-wash" } });
  if (!t3Tenant) {
    const t3 = await provisionTenant({
      name: "Sapna Washing Point",
      code: "sapna-wash",
      industry: "Automobile Care & Detailing Services",
      businessEmail: "sapnawash@gmail.com",
      phone: "+91 98999 11223",
      address: "NH-48 Highway Express Hub, Gurugram",
      adminName: "Sapna Detailing Admin",
      adminEmail: "admin@sapnawashing.com",
      adminPassword: "SapnaAdmin@2026!",
      planCode: "starter",
      seatLimit: 5,
      createdById: superAdmin.id,
    });
    t3Tenant = t3.tenant;

    // Sapna Washing Point demo leads and deals
    await prisma.lead.create({
      data: {
        tenantId: t3Tenant.id,
        firstName: "Karan",
        lastName: "Mehra",
        companyName: "Mehra Luxury Car Rentals",
        email: "karan@mehracars.com",
        phone: "+91 99111 88776",
        status: "QUALIFIED",
        priority: "MEDIUM",
        source: "Google Local Search",
        score: 60,
        tags: ["Ceramic Coating", "Fleet Wash"],
      },
    });

    const sapnaStages = await prisma.pipelineStage.findMany({
      where: { tenantId: t3Tenant.id },
      orderBy: { orderIndex: "asc" },
    });

    if (sapnaStages.length >= 2) {
      await prisma.deal.create({
        data: {
          tenantId: t3Tenant.id,
          pipelineId: sapnaStages[0].pipelineId,
          stageId: sapnaStages[1].id,
          title: "20-Cab Monthly Detailing Package",
          value: 75000,
          currency: "INR",
          probability: sapnaStages[1].winProbability,
          status: "OPEN",
        },
      });
    }
  }
  console.log(`✅ Provisioned Tenant 3: Sapna Washing Point (${t3Tenant.id})`);

  console.log("🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
