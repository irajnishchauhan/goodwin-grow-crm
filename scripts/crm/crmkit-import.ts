import fs from "fs";
import path from "path";
import prisma from "../../src/lib/prisma";

function parseCsv(content: string): Array<Record<string, string>> {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return [];

  // Parse header line handling potential commas in quotes
  function parseLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  }

  const headers = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/[\s_-]+/g, ""));
  const rows: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });
    rows.push(row);
  }

  return rows;
}

async function runImport() {
  const args = process.argv.slice(2);
  let filePath = "";
  let entityType = "leads"; // leads | clients | contacts
  let tenantCode = "goodwin-grow-ai";

  for (const arg of args) {
    if (arg.startsWith("--file=")) {
      filePath = arg.replace("--file=", "").trim();
    } else if (arg.startsWith("--type=")) {
      entityType = arg.replace("--type=", "").trim().toLowerCase();
    } else if (arg.startsWith("--tenant=")) {
      tenantCode = arg.replace("--tenant=", "").trim();
    }
  }

  if (!filePath) {
    console.log("Usage: npx tsx scripts/crm/crmkit-import.ts --file=<path_to_csv_or_json> [--type=leads|clients|contacts] [--tenant=code]");
    process.exit(1);
  }

  const resolvedPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`Error: File not found at ${resolvedPath}`);
    process.exit(1);
  }

  const tenant = await prisma.tenant.findUnique({ where: { code: tenantCode } });
  if (!tenant) {
    console.error(`Error: Tenant "${tenantCode}" not found.`);
    process.exit(1);
  }

  const raw = fs.readFileSync(resolvedPath, "utf-8");
  let records: Array<Record<string, any>> = [];

  if (filePath.endsWith(".json")) {
    const parsed = JSON.parse(raw);
    records = Array.isArray(parsed) ? parsed : [parsed];
  } else {
    records = parseCsv(raw);
  }

  console.log(`\n============================================================`);
  console.log(`📥 CRMKIT BULK UPSERT • ${entityType.toUpperCase()}`);
  console.log(`   Tenant: ${tenant.name} (${tenant.code})`);
  console.log(`   Records to Process: ${records.length}`);
  console.log(`============================================================\n`);

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  if (entityType === "leads") {
    for (const r of records) {
      const firstName = r.firstname || r.first_name || r.name?.split(" ")[0] || "Unknown";
      const lastName = r.lastname || r.last_name || r.name?.split(" ").slice(1).join(" ") || "";
      const email = r.email ? r.email.trim().toLowerCase() : null;
      const phone = r.phone ? r.phone.trim() : null;
      const companyName = r.company || r.companyname || r.company_name || null;
      const source = r.source || "Bulk Import";
      const serviceRequired = r.service || r.servicerequired || r.notes || null;
      const dealValue = r.value || r.dealvalue ? parseFloat(r.value || r.dealvalue) : null;
      const priority = ["LOW", "MEDIUM", "HIGH", "URGENT"].includes(r.priority?.toUpperCase())
        ? (r.priority.toUpperCase() as "LOW" | "MEDIUM" | "HIGH" | "URGENT")
        : "MEDIUM";

      let existing = null;
      if (email || phone) {
        existing = await prisma.lead.findFirst({
          where: {
            tenantId: tenant.id,
            OR: [
              ...(email ? [{ email }] : []),
              ...(phone ? [{ phone }] : []),
            ],
          },
        });
      }

      if (existing) {
        await prisma.lead.update({
          where: { id: existing.id },
          data: {
            companyName: companyName || existing.companyName,
            serviceRequired: serviceRequired || existing.serviceRequired,
            dealValue: dealValue || existing.dealValue,
            priority,
          },
        });
        updatedCount++;
      } else {
        await prisma.lead.create({
          data: {
            tenantId: tenant.id,
            firstName,
            lastName,
            email,
            phone,
            companyName,
            source,
            serviceRequired,
            dealValue,
            priority,
            status: "NEW",
            score: 70,
          },
        });
        createdCount++;
      }
    }
  } else if (entityType === "clients") {
    for (const r of records) {
      const name = r.name || r.clientname || r.client_name;
      if (!name) {
        skippedCount++;
        continue;
      }

      const existing = await prisma.agencyClient.findFirst({
        where: { tenantId: tenant.id, name: { equals: name, mode: "insensitive" } },
      });

      const monthlyRetainer = r.retainer || r.monthlyretainer ? parseFloat(r.retainer || r.monthlyretainer) : 50000;
      const activePackage = r.package || r.activepackage || "Growth Retainer (Social + Local SEO)";
      const postsPlanned = r.posts || r.postsplanned ? parseInt(r.posts || r.postsplanned) : 12;

      if (existing) {
        await prisma.agencyClient.update({
          where: { id: existing.id },
          data: {
            brandName: r.brand || r.brandname || existing.brandName,
            phone: r.phone || existing.phone,
            email: r.email || existing.email,
            monthlyRetainer,
            activePackage,
            postsPlanned,
          },
        });
        updatedCount++;
      } else {
        await prisma.agencyClient.create({
          data: {
            tenantId: tenant.id,
            name,
            brandName: r.brand || r.brandname || null,
            industry: r.industry || "Agency Services",
            website: r.website || null,
            phone: r.phone || null,
            email: r.email || null,
            city: r.city || null,
            state: r.state || null,
            activePackage,
            monthlyRetainer,
            postsPlanned,
            postsCompleted: 0,
            status: "ACTIVE",
          },
        });
        createdCount++;
      }
    }
  } else if (entityType === "contacts") {
    for (const r of records) {
      const firstName = r.firstname || r.first_name || r.name?.split(" ")[0] || "Unknown";
      const lastName = r.lastname || r.last_name || r.name?.split(" ").slice(1).join(" ") || "";
      const email = r.email ? r.email.trim().toLowerCase() : null;
      const phone = r.phone ? r.phone.trim() : null;

      let existing = null;
      if (email) {
        existing = await prisma.contact.findFirst({
          where: { tenantId: tenant.id, email },
        });
      }

      if (existing) {
        await prisma.contact.update({
          where: { id: existing.id },
          data: {
            phone: phone || existing.phone,
            jobTitle: r.title || r.jobtitle || existing.jobTitle,
          },
        });
        updatedCount++;
      } else {
        await prisma.contact.create({
          data: {
            tenantId: tenant.id,
            firstName,
            lastName,
            email,
            phone,
            jobTitle: r.title || r.jobtitle || null,
          },
        });
        createdCount++;
      }
    }
  }

  console.log(`✅ Import finished successfully!`);
  console.log(`• Records Created: ${createdCount}`);
  console.log(`• Records Updated (deduplicated): ${updatedCount}`);
  console.log(`• Records Skipped: ${skippedCount}\n`);
}

runImport()
  .catch((err) => {
    console.error("crmkit-import failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
