import prisma from "../src/lib/prisma";
import { SERVICE_PACKAGES, ADD_ON_SERVICES, calculatePackageProfitability } from "../src/lib/agency/packages";
import { verifyClientConfidentialAccess } from "../src/lib/agency/auth-guard";

async function runVerification() {
  console.log("=== 1. VERIFYING STANDARDIZED PACKAGES & PRICING ===");
  console.log(`Total Standardized Packages: ${SERVICE_PACKAGES.length}`);
  if (SERVICE_PACKAGES.length !== 10) {
    throw new Error(`Expected 10 packages, got ${SERVICE_PACKAGES.length}`);
  }
  for (const pkg of SERVICE_PACKAGES) {
    const profit = calculatePackageProfitability(pkg.price, pkg.estimatedDeliveryCost);
    console.log(
      `✔ Package: "${pkg.name}" [${pkg.category}] - Price: ₹${pkg.price.toLocaleString("en-IN")} | Cost: ₹${pkg.estimatedDeliveryCost.toLocaleString("en-IN")} | Margin: ${profit.grossMarginPercent}% | Min Commitment: ${pkg.contractTerms.minCommitmentMonths} mo`
    );
  }

  console.log(`\nTotal Add-on Services: ${ADD_ON_SERVICES.length}`);
  for (const addon of ADD_ON_SERVICES) {
    console.log(`✔ Add-on: "${addon.name}" - ₹${addon.price.toLocaleString("en-IN")} (${addon.pricingType})`);
  }

  console.log("\n=== 2. VERIFYING DATABASE CLIENTS & CONTRACT FIELDS ===");
  const tenant = await prisma.tenant.findUnique({
    where: { code: "goodwin-grow-ai" },
  });
  if (!tenant) {
    throw new Error("Tenant goodwin-grow-ai not found");
  }

  const clients = await prisma.agencyClient.findMany({
    where: { tenantId: tenant.id },
    include: {
      notes: {
        include: {
          createdBy: { select: { fullName: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  console.log(`Found ${clients.length} agency clients for ${tenant.name}:`);
  for (const c of clients) {
    console.log(
      `\nClient: ${c.name} (${c.brandName}) | Status: ${c.status} | Package: ${c.activePackage} | Retainer: ₹${Number(c.monthlyRetainer).toLocaleString("en-IN")} | Delivery Cost: ₹${Number(c.estimatedDeliveryCost).toLocaleString("en-IN")} | Billing: ${c.billingCycle} | Contract: ${c.contractStartDate?.toISOString().slice(0, 10)} to ${c.contractEndDate?.toISOString().slice(0, 10)} | AM: ${c.accountManagerName}`
    );
    console.log(`  Notes count: ${c.notes.length}`);
    for (const n of c.notes) {
      console.log(`    [${n.category}] "${n.title}" by ${n.createdBy?.fullName || "System"} (Restricted Confidential)`);
    }
  }

  console.log("\n=== 3. VERIFYING RBAC CONFIDENTIAL ACCESS GUARD ===");
  const superAdmin = await prisma.user.findFirst({
    where: { email: "superadmin@goodwingrowai.com" },
  });
  const ansh = await prisma.user.findFirst({
    where: { email: "goodwingrow.ansh@gmail.com" },
  });
  const sameer = await prisma.user.findFirst({
    where: { email: "sameer@goodwingrowai.com" },
  });

  const anshClient = clients.find((c) => c.accountManagerName?.includes("Ansh"));
  if (anshClient && superAdmin && ansh && sameer) {
    // 1. Super Admin access
    const adminCtx: any = {
      tenant: { id: tenant.id },
      user: { id: superAdmin.id, fullName: superAdmin.fullName, email: superAdmin.email },
      membership: { isOwner: true },
      primaryRole: "Super Admin",
      roles: ["Super Admin", "Agency Admin"],
      isPlatformAdmin: true,
    };
    const adminCheck = verifyClientConfidentialAccess(adminCtx, anshClient);
    console.log(`✔ Super Admin access check on ${anshClient.name}: canAccess=${adminCheck.canAccessConfidentialNotes} (${adminCheck.roleDescription})`);
    if (!adminCheck.canAccessConfidentialNotes) throw new Error("Super Admin was unexpectedly blocked!");

    // 2. Assigned Account Manager access
    const amCtx: any = {
      tenant: { id: tenant.id },
      user: { id: ansh.id, fullName: ansh.fullName, email: ansh.email },
      membership: { isOwner: false },
      primaryRole: "Account Manager",
      roles: ["Account Manager"],
      isPlatformAdmin: false,
    };
    const amCheck = verifyClientConfidentialAccess(amCtx, anshClient);
    console.log(`✔ Assigned AM (${ansh.fullName}) check: canAccess=${amCheck.canAccessConfidentialNotes} (${amCheck.roleDescription})`);
    if (!amCheck.canAccessConfidentialNotes) throw new Error("Assigned AM was unexpectedly blocked!");

    // 3. Unassigned AM access (Sameer trying to access Ansh's client confidential notes)
    const unauthorizedCtx: any = {
      tenant: { id: tenant.id },
      user: { id: sameer.id, fullName: sameer.fullName, email: sameer.email },
      membership: { isOwner: false },
      primaryRole: "Account Manager",
      roles: ["Account Manager"],
      isPlatformAdmin: false,
    };
    const unauthorizedCheck = verifyClientConfidentialAccess(unauthorizedCtx, anshClient);
    console.log(`✔ Unassigned AM (${sameer.fullName}) check: canAccess=${unauthorizedCheck.canAccessConfidentialNotes} (Correctly rejected: "${unauthorizedCheck.roleDescription}")`);
    if (unauthorizedCheck.canAccessConfidentialNotes) throw new Error("Unassigned AM should have been BLOCKED from confidential notes!");
  }

  console.log("\n✅ ALL CRM ENHANCEMENT VERIFICATIONS PASSED SUCCESSFULLY!");
}

runVerification()
  .catch((err) => {
    console.error("❌ Verification failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
