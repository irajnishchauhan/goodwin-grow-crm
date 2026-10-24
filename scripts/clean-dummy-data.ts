import prisma from "../src/lib/prisma";

async function cleanDummyData() {
  const tenant = await prisma.tenant.findUnique({
    where: { code: "goodwin-grow-ai" },
  });

  if (!tenant) {
    console.error("Tenant goodwin-grow-ai not found");
    return;
  }

  const tenantId = tenant.id;
  console.log(`Starting dummy data cleanup for tenant: ${tenant.name} (${tenantId})`);

  // 1. Delete Deliverables & Reports
  try {
    await prisma.$executeRawUnsafe(`DELETE FROM "client_deliverables" WHERE "tenant_id" = $1;`, tenantId);
    await prisma.$executeRawUnsafe(`DELETE FROM "client_reports" WHERE "tenant_id" = $1;`, tenantId);
  } catch (err: any) {
    console.warn("Notice: raw table cleanup:", err.message);
  }

  // 2. Creative assets & versions & comments
  const delComments = await prisma.creativeComment.deleteMany({ where: { tenantId } });
  const delVersions = await prisma.creativeVersion.deleteMany({ where: { tenantId } });
  const delAssets = await prisma.creativeAsset.deleteMany({ where: { tenantId } });
  console.log(`Deleted creative assets: ${delAssets.count}, versions: ${delVersions.count}, comments: ${delComments.count}`);

  // 3. Social Media Content Posts
  const delPosts = await prisma.contentPost.deleteMany({ where: { tenantId } });
  console.log(`Deleted content posts: ${delPosts.count}`);

  // 4. Ad Campaigns & SEO Trackers
  const delCampaigns = await prisma.adCampaign.deleteMany({ where: { tenantId } });
  const delSeo = await prisma.seoTracker.deleteMany({ where: { tenantId } });
  console.log(`Deleted ad campaigns: ${delCampaigns.count}, SEO trackers: ${delSeo.count}`);

  // 5. Invoices & Expenses
  const delInvoices = await prisma.agencyInvoice.deleteMany({ where: { tenantId } });
  const delExpenses = await prisma.agencyExpense.deleteMany({ where: { tenantId } });
  console.log(`Deleted invoices: ${delInvoices.count}, expenses: ${delExpenses.count}`);

  // 6. Agency Tasks & Projects
  const delAgencyTasks = await prisma.agencyTask.deleteMany({ where: { tenantId } });
  const delProjects = await prisma.agencyProject.deleteMany({ where: { tenantId } });
  console.log(`Deleted agency tasks: ${delAgencyTasks.count}, projects: ${delProjects.count}`);

  // 7. CRM Tasks & Leads
  const delTasks = await prisma.task.deleteMany({ where: { tenantId } });
  const delLeads = await prisma.lead.deleteMany({ where: { tenantId } });
  console.log(`Deleted CRM tasks: ${delTasks.count}, leads: ${delLeads.count}`);

  // 8. Remove associations on memberships
  await prisma.tenantMembership.updateMany({
    where: { tenantId },
    data: { agencyClientId: null },
  });

  // 9. Dummy Client Portal Users & Memberships
  const dummyClientEmails = [
    "client@sapnawashing.in",
    "client@ambafurnishing.com",
    "admin@sapnawashing.com",
    "admin@testclient.com",
  ];
  for (const email of dummyClientEmails) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.membershipRole.deleteMany({
        where: { membership: { userId: user.id, tenantId } },
      }).catch(() => {});
      await prisma.tenantMembership.deleteMany({
        where: { userId: user.id, tenantId },
      }).catch(() => {});
      await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
      console.log(`Removed dummy client portal user: ${email}`);
    }
  }

  // 10. Agency Clients
  const delClients = await prisma.agencyClient.deleteMany({ where: { tenantId } });
  console.log(`Deleted agency clients: ${delClients.count}`);

  console.log("✅ Cleanup complete! Workspace 'goodwin-grow-ai' now has zero dummy data.");
}

cleanDummyData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Cleanup error:", err);
    process.exit(1);
  });
