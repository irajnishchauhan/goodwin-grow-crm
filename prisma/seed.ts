import { PrismaClient } from "@prisma/client";
import { provisionTenant } from "../src/lib/tenant/provision";
import { hashPassword } from "../src/lib/auth/password";
import { SYSTEM_PERMISSIONS } from "../src/lib/rbac/permissions";

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
  console.log(`✅ Provisioned Tenant 1: Goodwin Grow AI (${t1.tenant.id})`);

  // 5. Provision Tenant 2: Goodwin Batteries
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
  console.log(`✅ Provisioned Tenant 2: Goodwin Batteries (${t2.tenant.id})`);

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
    where: { tenantId: t2.tenant.id, name: "Sales Manager" },
  });

  if (managerRole) {
    const managerMembership = await prisma.tenantMembership.create({
      data: {
        tenantId: t2.tenant.id,
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

  // Populate sample Leads, Contacts, Deals for Goodwin Batteries
  const lead1 = await prisma.lead.create({
    data: {
      tenantId: t2.tenant.id,
      firstName: "Amit",
      lastName: "Verma",
      companyName: "Zenith Automotive Dealers",
      email: "amit@zenithauto.in",
      phone: "+91 98111 22334",
      status: "QUALIFIED",
      priority: "HIGH",
      source: "Distributor Inbound",
      score: 75,
      assignedOwnerId: salesUser.id,
      tags: ["Automotive", "OEM", "North Zone"],
    },
  });

  const lead2 = await prisma.lead.create({
    data: {
      tenantId: t2.tenant.id,
      firstName: "Sunita",
      lastName: "Patel",
      companyName: "Surat E-Rickshaw Fleet",
      email: "sunita@suratrickshaw.com",
      phone: "+91 98222 33445",
      status: "NEW",
      priority: "URGENT",
      source: "Trade Expo",
      score: 85,
      assignedOwnerId: salesUser.id,
      tags: ["EV Fleet", "Lithium Battery"],
    },
  });

  const company1 = await prisma.company.create({
    data: {
      tenantId: t2.tenant.id,
      name: "Apex Logistics India",
      industry: "Freight & Heavy Transportation",
      website: "https://apexlogistics.in",
      phone: "+91 98333 44556",
      assignedOwnerId: salesUser.id,
    },
  });

  const contact1 = await prisma.contact.create({
    data: {
      tenantId: t2.tenant.id,
      companyId: company1.id,
      firstName: "Rajesh",
      lastName: "Gupta",
      email: "rajesh@apexlogistics.in",
      phone: "+91 98444 55667",
      jobTitle: "Chief Procurement Officer",
      assignedOwnerId: salesUser.id,
    },
  });

  // Get stages for pipeline
  const stages = await prisma.pipelineStage.findMany({
    where: { tenantId: t2.tenant.id },
    orderBy: { orderIndex: "asc" },
  });

  if (stages.length >= 4) {
    const proposalStage = stages[3]; // "Proposal Sent"
    const negotiationStage = stages[4]; // "Negotiation"

    await prisma.deal.create({
      data: {
        tenantId: t2.tenant.id,
        pipelineId: stages[0].pipelineId,
        stageId: proposalStage.id,
        companyId: company1.id,
        contactId: contact1.id,
        title: "500-Unit Inverter Battery Fleet Contract",
        value: 1250000,
        currency: "INR",
        probability: proposalStage.winProbability,
        status: "OPEN",
        assignedOwnerId: salesUser.id,
      },
    });

    await prisma.deal.create({
      data: {
        tenantId: t2.tenant.id,
        pipelineId: stages[0].pipelineId,
        stageId: negotiationStage.id,
        companyId: company1.id,
        contactId: contact1.id,
        title: "Annual Tubular Battery Replacement Deal",
        value: 480000,
        currency: "INR",
        probability: negotiationStage.winProbability,
        status: "OPEN",
        assignedOwnerId: salesUser.id,
      },
    });
  }

  // Create Task
  await prisma.task.create({
    data: {
      tenantId: t2.tenant.id,
      title: "Send updated warranty certificate to Rajesh Gupta",
      priority: "HIGH",
      status: "PENDING",
      dueDate: new Date(Date.now() + 86400000), // Tomorrow
      assignedToId: salesUser.id,
      contactId: contact1.id,
    },
  });

  // 6. Provision Tenant 3: Sapna Washing Point
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
  console.log(`✅ Provisioned Tenant 3: Sapna Washing Point (${t3.tenant.id})`);

  // Sapna Washing Point demo leads and deals
  const sapnaLead = await prisma.lead.create({
    data: {
      tenantId: t3.tenant.id,
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
    where: { tenantId: t3.tenant.id },
    orderBy: { orderIndex: "asc" },
  });

  if (sapnaStages.length >= 2) {
    await prisma.deal.create({
      data: {
        tenantId: t3.tenant.id,
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
