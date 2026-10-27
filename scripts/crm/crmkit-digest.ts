import prisma from "../../src/lib/prisma";

async function runDigest() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes("--json");
  const tenantArg = args.find((a) => !a.startsWith("--")) || "goodwin-grow-ai";

  const tenant = await prisma.tenant.findUnique({
    where: { code: tenantArg },
  });

  if (!tenant) {
    console.error(`Tenant with code "${tenantArg}" not found.`);
    process.exit(1);
  }

  const tenantId = tenant.id;

  // 1. Leads overview
  const leads = await prisma.lead.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });

  const leadsByStatus = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {});

  const totalPipelineValue = leads
    .filter((l) => l.status !== "LOST" && l.status !== "CONVERTED")
    .reduce((sum, l) => sum + Number(l.dealValue || 0), 0);

  const now = new Date();
  const overdueFollowUps = leads.filter((l) => l.nextFollowUp && new Date(l.nextFollowUp) < now && l.status !== "CONVERTED" && l.status !== "LOST");
  const upcomingFollowUps = leads.filter((l) => l.nextFollowUp && new Date(l.nextFollowUp) >= now && l.status !== "CONVERTED" && l.status !== "LOST");

  // 2. Deals overview
  const deals = await prisma.deal.findMany({
    where: { tenantId },
    include: { stage: true },
  });

  const dealsByStatus = deals.reduce<Record<string, number>>((acc, d) => {
    acc[d.status] = (acc[d.status] || 0) + 1;
    return acc;
  }, {});

  const openDealsValue = deals
    .filter((d) => d.status === "OPEN")
    .reduce((sum, d) => sum + Number(d.value), 0);

  const wonDealsValue = deals
    .filter((d) => d.status === "WON")
    .reduce((sum, d) => sum + Number(d.value), 0);

  // 3. Agency Clients & Deliverables
  const clients = await prisma.agencyClient.findMany({
    where: { tenantId },
    orderBy: { monthlyRetainer: "desc" },
  });

  const totalMonthlyRetainers = clients
    .filter((c) => c.status === "ACTIVE")
    .reduce((sum, c) => sum + Number(c.monthlyRetainer), 0);

  const totalPostsPlanned = clients.reduce((sum, c) => sum + (c.postsPlanned || 0), 0);
  const totalPostsCompleted = clients.reduce((sum, c) => sum + (c.postsCompleted || 0), 0);
  const deliverablePace = totalPostsPlanned > 0 ? Math.round((totalPostsCompleted / totalPostsPlanned) * 100) : 0;

  // 4. Recent activities
  const recentActivities = await prisma.activity.findMany({
    where: { tenantId },
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      lead: { select: { firstName: true, lastName: true, companyName: true } },
      deal: { select: { title: true } },
      performedBy: { select: { fullName: true, email: true } },
    },
  });

  const digestData = {
    timestamp: new Date().toISOString(),
    workspace: {
      id: tenant.id,
      name: tenant.name,
      code: tenant.code,
    },
    leads: {
      total: leads.length,
      byStatus: leadsByStatus,
      totalPipelineValue,
      overdueFollowUps: overdueFollowUps.length,
      upcomingFollowUps: upcomingFollowUps.length,
    },
    deals: {
      total: deals.length,
      byStatus: dealsByStatus,
      openValue: openDealsValue,
      wonValue: wonDealsValue,
    },
    clients: {
      total: clients.length,
      activeRetainersMonthly: totalMonthlyRetainers,
      deliverablesCompleted: totalPostsCompleted,
      deliverablesPlanned: totalPostsPlanned,
      deliverablePace: `${deliverablePace}%`,
      clientList: clients.map((c) => ({
        name: c.name,
        retainer: Number(c.monthlyRetainer),
        posts: `${c.postsCompleted}/${c.postsPlanned}`,
        accountManager: c.accountManagerName || "Unassigned",
        leadDesigner: c.leadDesignerName || "Unassigned",
        contentWriter: c.contentWriterName || "Unassigned",
      })),
    },
    recentActivities: recentActivities.map((a) => ({
      type: a.type,
      title: a.title,
      description: a.description,
      performedBy: a.performedBy.fullName || a.performedBy.email,
      target: a.lead ? `${a.lead.firstName} ${a.lead.lastName} (${a.lead.companyName || "N/A"})` : a.deal?.title || "Workspace",
      createdAt: a.createdAt.toISOString(),
    })),
  };

  if (jsonMode) {
    console.log(JSON.stringify(digestData, null, 2));
    return;
  }

  // Markdown Formatted Output for Terminal & AI Agents
  console.log(`\n============================================================`);
  console.log(`📊 CRMKIT EXECUTIVE PIPELINE DIGEST • ${tenant.name.toUpperCase()}`);
  console.log(`   Generated: ${new Date().toLocaleString("en-IN")}`);
  console.log(`============================================================\n`);

  console.log(`🎯 LEADS & PIPELINE METRICS:`);
  console.log(`• Total Leads: ${leads.length}`);
  console.log(`• Open Pipeline Value: ₹${totalPipelineValue.toLocaleString("en-IN")}`);
  console.log(`• Overdue Follow-ups: ${overdueFollowUps.length}`);
  console.log(`• Breakdown: ${Object.entries(leadsByStatus).map(([k, v]) => `${k}: ${v}`).join(" | ")}\n`);

  console.log(`💼 DEALS METRICS:`);
  console.log(`• Total Deals: ${deals.length}`);
  console.log(`• Open Pipeline Deals: ₹${openDealsValue.toLocaleString("en-IN")}`);
  console.log(`• Closed-Won Deals: ₹${wonDealsValue.toLocaleString("en-IN")}`);
  console.log(`• Breakdown: ${Object.entries(dealsByStatus).map(([k, v]) => `${k}: ${v}`).join(" | ")}\n`);

  console.log(`🏢 ACTIVE CLIENTS & DELIVERABLE RETENTION:`);
  console.log(`• Active Clients: ${clients.length}`);
  console.log(`• Monthly Retainer Revenue: ₹${totalMonthlyRetainers.toLocaleString("en-IN")}/mo`);
  console.log(`• Deliverables Delivered: ${totalPostsCompleted}/${totalPostsPlanned} (${deliverablePace}%)\n`);

  if (clients.length > 0) {
    console.log(`Pod Roster for Clients:`);
    clients.slice(0, 5).forEach((c) => {
      console.log(
        `  - ${c.name} (₹${Number(c.monthlyRetainer).toLocaleString("en-IN")}/mo) | AM: ${c.accountManagerName || "Unassigned"} | Design: ${c.leadDesignerName || "Unassigned"} | CW: ${c.contentWriterName || "Unassigned"}`
      );
    });
    console.log("");
  }

  console.log(`⚡ RECENT ACTIVITY LOGS (Last ${recentActivities.length}):`);
  if (recentActivities.length === 0) {
    console.log(`• No logged interactions recorded yet.\n`);
  } else {
    recentActivities.forEach((a) => {
      console.log(`• [${a.type}] ${a.title} by ${a.performedBy.fullName || a.performedBy.email} (${new Date(a.createdAt).toLocaleDateString()})`);
    });
    console.log("");
  }
}

runDigest()
  .catch((err) => {
    console.error("crmkit-digest failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
