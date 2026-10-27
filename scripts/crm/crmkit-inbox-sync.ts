import fs from "fs";
import path from "path";
import prisma from "../../src/lib/prisma";

interface InboundInteraction {
  type: "EMAIL" | "WHATSAPP" | "CALL" | "MEETING" | "NOTE";
  senderEmail?: string;
  senderPhone?: string;
  senderName?: string;
  companyName?: string;
  subject?: string;
  content: string;
  timestamp?: string;
  suggestedFollowUp?: string;
}

async function runInboxSync() {
  const args = process.argv.slice(2);
  let inputSource = "";
  let tenantCode = "goodwin-grow-ai";

  for (const arg of args) {
    if (arg.startsWith("--input=")) {
      inputSource = arg.replace("--input=", "").trim();
    } else if (arg.startsWith("--tenant=")) {
      tenantCode = arg.replace("--tenant=", "").trim();
    }
  }

  if (!inputSource) {
    console.log("Usage: npx tsx scripts/crm/crmkit-inbox-sync.ts --input=<path_or_json_string> [--tenant=code]");
    process.exit(1);
  }

  const tenant = await prisma.tenant.findUnique({
    where: { code: tenantCode },
  });

  if (!tenant) {
    console.error(`Tenant "${tenantCode}" not found.`);
    process.exit(1);
  }

  let rawData = "";
  if (fs.existsSync(path.resolve(process.cwd(), inputSource))) {
    rawData = fs.readFileSync(path.resolve(process.cwd(), inputSource), "utf-8");
  } else {
    rawData = inputSource;
  }

  let interactions: InboundInteraction[] = [];
  try {
    const parsed = JSON.parse(rawData);
    interactions = Array.isArray(parsed) ? parsed : [parsed];
  } catch (err) {
    console.error("Invalid JSON input for inbox-sync:", err);
    process.exit(1);
  }

  // Get a fallback system/team user for performedBy
  const teamMember = await prisma.user.findFirst({
    where: {
      memberships: { some: { tenantId: tenant.id } },
      isActive: true,
    },
  });

  if (!teamMember) {
    console.error("No active team member found for tenant to log interactions.");
    process.exit(1);
  }

  console.log(`\n============================================================`);
  console.log(`📥 CRMKIT INBOX SYNC • INTERACTION INGESTION`);
  console.log(`   Tenant: ${tenant.name} (${tenant.code})`);
  console.log(`   Interactions to Ingest: ${interactions.length}`);
  console.log(`   Logging as Team User: ${teamMember.fullName} (${teamMember.email})`);
  console.log(`============================================================\n`);

  let syncedActivities = 0;
  let newLeadsCreated = 0;

  for (const item of interactions) {
    const email = item.senderEmail?.toLowerCase().trim();
    const phone = item.senderPhone?.trim();

    // Find matching lead
    let lead = null;
    if (email || phone) {
      lead = await prisma.lead.findFirst({
        where: {
          tenantId: tenant.id,
          OR: [
            ...(email ? [{ email }] : []),
            ...(phone ? [{ phone }] : []),
          ],
        },
      });
    }

    // Auto-create lead if not existing
    if (!lead && (email || phone || item.senderName)) {
      const nameParts = (item.senderName || "Unknown Prospect").split(" ");
      lead = await prisma.lead.create({
        data: {
          tenantId: tenant.id,
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(" ") || "",
          email: email || null,
          phone: phone || null,
          companyName: item.companyName || null,
          status: "CONTACTED",
          source: item.type === "EMAIL" ? "Email Inbox" : item.type === "WHATSAPP" ? "WhatsApp Chatbot" : "Inbound Inquiry",
          priority: "HIGH",
          score: 75,
        },
      });
      newLeadsCreated++;
    }

    // Log Activity
    const activityType = ["CALL", "EMAIL", "MEETING", "NOTE", "WHATSAPP"].includes(item.type)
      ? item.type
      : "EMAIL";

    await prisma.activity.create({
      data: {
        tenantId: tenant.id,
        type: activityType,
        title: item.subject || `Inbound ${activityType} from ${item.senderName || item.senderEmail || "Prospect"}`,
        description: item.content,
        performedById: teamMember.id,
        leadId: lead ? lead.id : null,
        createdAt: item.timestamp ? new Date(item.timestamp) : new Date(),
      },
    });

    if (lead && item.suggestedFollowUp) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { nextFollowUp: new Date(item.suggestedFollowUp) },
      });
    }

    syncedActivities++;
  }

  console.log(`✅ Inbox sync completed successfully!`);
  console.log(`• Interactions Logged: ${syncedActivities}`);
  console.log(`• New Leads Captured: ${newLeadsCreated}\n`);
}

runInboxSync()
  .catch((err) => {
    console.error("crmkit-inbox-sync failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
