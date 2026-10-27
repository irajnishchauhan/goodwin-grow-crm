import fs from "fs";
import path from "path";
import prisma from "../../src/lib/prisma";

async function runBackup() {
  const args = process.argv.slice(2);
  let tenantCode = "goodwin-grow-ai";
  let outPath = "";

  for (const arg of args) {
    if (arg.startsWith("--tenant=")) {
      tenantCode = arg.replace("--tenant=", "").trim();
    } else if (arg.startsWith("--out=")) {
      outPath = arg.replace("--out=", "").trim();
    }
  }

  const tenant = await prisma.tenant.findUnique({
    where: { code: tenantCode },
  });

  if (!tenant) {
    console.error(`Tenant "${tenantCode}" not found.`);
    process.exit(1);
  }

  const tenantId = tenant.id;

  const [leads, deals, clients, tasks, activities, contacts, companies] = await Promise.all([
    prisma.lead.findMany({ where: { tenantId } }),
    prisma.deal.findMany({ where: { tenantId }, include: { stage: true } }),
    prisma.agencyClient.findMany({ where: { tenantId } }),
    prisma.task.findMany({ where: { tenantId } }),
    prisma.activity.findMany({ where: { tenantId } }),
    prisma.contact.findMany({ where: { tenantId } }),
    prisma.company.findMany({ where: { tenantId } }),
  ]);

  const backupPayload = {
    metadata: {
      exportedAt: new Date().toISOString(),
      tenant: {
        id: tenant.id,
        name: tenant.name,
        code: tenant.code,
      },
      counts: {
        leads: leads.length,
        deals: deals.length,
        clients: clients.length,
        tasks: tasks.length,
        activities: activities.length,
        contacts: contacts.length,
        companies: companies.length,
      },
    },
    data: {
      leads,
      deals,
      clients,
      tasks,
      activities,
      contacts,
      companies,
    },
  };

  const jsonString = JSON.stringify(backupPayload, null, 2);

  if (outPath) {
    const resolved = path.resolve(process.cwd(), outPath);
    const dir = path.dirname(resolved);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(resolved, jsonString, "utf-8");
    console.log(`\n============================================================`);
    console.log(`📦 CRMKIT BACKUP COMPLETED`);
    console.log(`   Tenant: ${tenant.name} (${tenant.code})`);
    console.log(`   Output file: ${resolved}`);
    console.log(`   Total entities exported: ${leads.length + deals.length + clients.length + tasks.length + activities.length + contacts.length + companies.length}`);
    console.log(`============================================================\n`);
  } else {
    console.log(jsonString);
  }
}

runBackup()
  .catch((err) => {
    console.error("crmkit-backup failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
