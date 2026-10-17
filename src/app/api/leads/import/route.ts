import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

export async function POST(req: Request) {
  try {
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!tenantCtx.hasPermission("leads:write")) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const tenantId = tenantCtx.tenant.id;
    const body = await req.json();
    const rows: any[] = body.leads;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, error: "No leads provided in payload" }, { status: 400 });
    }

    // Extract valid emails for duplicate check
    const incomingEmails = rows
      .map((r) => r.email?.toLowerCase().trim())
      .filter(Boolean);

    // Find existing leads in this tenant with these emails
    const existingLeads = await prisma.lead.findMany({
      where: {
        tenantId,
        email: { in: incomingEmails },
      },
      select: { email: true },
    });

    const existingEmailSet = new Set(existingLeads.map((l) => l.email?.toLowerCase()));

    const leadsToInsert: any[] = [];
    const duplicateEmails: string[] = [];

    for (const row of rows) {
      const email = row.email ? row.email.toLowerCase().trim() : null;

      if (email && existingEmailSet.has(email)) {
        duplicateEmails.push(email);
        continue;
      }

      const firstName = row.firstName || row.name?.split(" ")[0] || "Lead";
      const lastName = row.lastName || row.name?.split(" ").slice(1).join(" ") || "Prospect";

      leadsToInsert.push({
        tenantId,
        firstName,
        lastName,
        companyName: row.companyName || row.company || null,
        email: email || null,
        phone: row.phone || null,
        source: row.source || "CSV Import",
        priority: row.priority || "MEDIUM",
        score: Number(row.score) || 50,
        status: "NEW",
        assignedOwnerId: tenantCtx.user.id,
      });

      if (email) existingEmailSet.add(email);
    }

    if (leadsToInsert.length > 0) {
      await prisma.lead.createMany({
        data: leadsToInsert,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${leadsToInsert.length} leads.`,
      data: {
        importedCount: leadsToInsert.length,
        skippedCount: duplicateEmails.length,
        duplicateEmails,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
