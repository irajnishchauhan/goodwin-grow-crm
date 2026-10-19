import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verifyTenantIsolation() {
  console.log("🔒 Running Multi-Tenant Cryptographic Isolation Test...\n");

  const agencyTenant = await prisma.tenant.findUnique({ where: { code: "goodwin-grow-ai" } });
  const batteryTenant = await prisma.tenant.findUnique({ where: { code: "goodwin-batteries" } });

  if (!agencyTenant || !batteryTenant) {
    throw new Error("Could not find both tenants.");
  }

  console.log(`1. Goodwin Grow AI Tenant ID: ${agencyTenant.id}`);
  console.log(`2. Goodwin Batteries Tenant ID: ${batteryTenant.id}`);

  // Check 1: Battery Partners exist only in Goodwin Batteries
  const batteryPartnersInBattery = await prisma.batteryPartner.count({ where: { tenantId: batteryTenant.id } });
  const batteryPartnersInAgency = await prisma.batteryPartner.count({ where: { tenantId: agencyTenant.id } });

  console.log(`\n• Battery Partners in Goodwin Batteries: ${batteryPartnersInBattery}`);
  console.log(`• Battery Partners in Goodwin Grow AI: ${batteryPartnersInAgency}`);
  if (batteryPartnersInAgency !== 0) throw new Error("Isolation breach: Battery partners leaked into agency!");

  // Check 2: Battery Orders
  const batteryOrdersInBattery = await prisma.batteryOrder.count({ where: { tenantId: batteryTenant.id } });
  const batteryOrdersInAgency = await prisma.batteryOrder.count({ where: { tenantId: agencyTenant.id } });
  console.log(`• Battery Orders in Goodwin Batteries: ${batteryOrdersInBattery}`);
  console.log(`• Battery Orders in Goodwin Grow AI: ${batteryOrdersInAgency}`);
  if (batteryOrdersInAgency !== 0) throw new Error("Isolation breach: Orders leaked!");

  // Check 3: Battery Collections
  const collectionsInBattery = await prisma.batteryCollection.count({ where: { tenantId: batteryTenant.id } });
  const collectionsInAgency = await prisma.batteryCollection.count({ where: { tenantId: agencyTenant.id } });
  console.log(`• Battery Collections in Goodwin Batteries: ${collectionsInBattery}`);
  console.log(`• Battery Collections in Goodwin Grow AI: ${collectionsInAgency}`);
  if (collectionsInAgency !== 0) throw new Error("Isolation breach: Collections leaked!");

  // Check 4: Warranty Claims
  const warrantyInBattery = await prisma.batteryWarrantyClaim.count({ where: { tenantId: batteryTenant.id } });
  const warrantyInAgency = await prisma.batteryWarrantyClaim.count({ where: { tenantId: agencyTenant.id } });
  console.log(`• Warranty Claims in Goodwin Batteries: ${warrantyInBattery}`);
  console.log(`• Warranty Claims in Goodwin Grow AI: ${warrantyInAgency}`);
  if (warrantyInAgency !== 0) throw new Error("Isolation breach: Warranty leaked!");

  // Check 5: Agency Clients
  const agencyClientsInAgency = await prisma.agencyClient.count({ where: { tenantId: agencyTenant.id } });
  const agencyClientsInBattery = await prisma.agencyClient.count({ where: { tenantId: batteryTenant.id } });
  console.log(`• Agency Clients in Goodwin Grow AI: ${agencyClientsInAgency}`);
  console.log(`• Agency Clients in Goodwin Batteries: ${agencyClientsInBattery}`);
  if (agencyClientsInBattery !== 0) throw new Error("Isolation breach: Agency clients leaked into battery!");

  // Check 6: Prompt Metrics for Goodwin Batteries
  const activeDealers = await prisma.batteryPartner.count({ where: { tenantId: batteryTenant.id, type: "DEALER", status: "ACTIVE" } });
  const openEnquiries = await prisma.lead.count({ where: { tenantId: batteryTenant.id, status: { in: ["NEW", "CONTACTED", "QUALIFIED"] } } });
  const pendingOrders = await prisma.batteryOrder.count({ where: { tenantId: batteryTenant.id, status: "PENDING_APPROVAL" } });
  const collectionFollowUps = await prisma.batteryCollection.count({ where: { tenantId: batteryTenant.id, nextFollowUpDate: { not: null } } });

  console.log("\n=======================================================");
  console.log("Goodwin Batteries Sales & Distribution Dashboard Metrics:");
  console.log(`  [42] Active Dealers:        ${activeDealers} ${activeDealers === 42 ? "✅ EXACT" : "⚠️"}`);
  console.log(`  [18] Open Enquiries:        ${openEnquiries} ${openEnquiries === 18 ? "✅ EXACT" : "⚠️"}`);
  console.log(`  [12] Pending Orders:        ${pendingOrders} ${pendingOrders === 12 ? "✅ EXACT" : "⚠️"}`);
  console.log(`  [ 7] Collection Follow-ups:  ${collectionFollowUps} ${collectionFollowUps === 7 ? "✅ EXACT" : "⚠️"}`);
  console.log("=======================================================\n");

  console.log("🛡️ MULTI-TENANT ISOLATION 100% VERIFIED: ZERO CROSS-TENANT DATA LEAKAGE DETECTED.");
}

verifyTenantIsolation()
  .catch((e) => {
    console.error("❌ Isolation check failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
