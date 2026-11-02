import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

export async function POST(req: Request) {
  try {
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (tenantCtx.isClientUser) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
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

    // Extract valid emails and phones for duplicate check
    const incomingEmails = rows
      .map((r) => r.email?.toLowerCase().trim())
      .filter(Boolean);

    const incomingPhones = rows
      .map((r) => (r.phone ? r.phone.trim() : null))
      .filter(Boolean);

    // Find existing leads in this tenant with these emails or phones
    const existingLeads = await prisma.lead.findMany({
      where: {
        tenantId,
        OR: [
          ...(incomingEmails.length > 0
            ? incomingEmails.map((em) => ({ email: { equals: em, mode: "insensitive" as const } }))
            : []),
          ...(incomingPhones.length > 0
            ? incomingPhones.map((ph) => ({ phone: { equals: ph } }))
            : []),
        ],
      },
      select: { email: true, phone: true },
    });

    const existingEmailSet = new Set(existingLeads.map((l) => l.email?.toLowerCase()).filter(Boolean));
    const existingPhoneSet = new Set(existingLeads.map((l) => l.phone).filter(Boolean));

    const leadsToInsert: any[] = [];
    const duplicateRecords: string[] = [];

    for (const row of rows) {
      const email = row.email ? row.email.toLowerCase().trim() : null;
      const phone = row.phone ? row.phone.trim() : null;

      if ((email && existingEmailSet.has(email)) || (phone && existingPhoneSet.has(phone))) {
        duplicateRecords.push(email || phone || "Unknown duplicate");
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
        phone: phone || null,
        source: row.source || "CSV Import",
        priority: row.priority || "MEDIUM",
        score: Number(row.score) || 50,
        status: "NEW",
        assignedOwnerId: tenantCtx.user.id,
      });

      if (email) existingEmailSet.add(email);
      if (phone) existingPhoneSet.add(phone);
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
        skippedCount: duplicateRecords.length,
        duplicateRecords,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
