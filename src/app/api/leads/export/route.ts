import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

function sanitizeCsvField(value: any): string {
  if (value === null || value === undefined) return '""';
  let str = String(value);
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

export async function GET(req: Request) {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (tenantCtx.isClientUser) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  if (!tenantCtx.hasPermission("leads:export") && !tenantCtx.hasPermission("*")) {
    return NextResponse.json(
      { success: false, error: "Forbidden: Missing leads:export permission" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const targetClientId = searchParams.get("clientId");

  const whereClause: any = { tenantId: tenantCtx.tenant.id };
  if (targetClientId && targetClientId !== "ALL") {
    whereClause.clientId = targetClientId;
  }

  const leads = await prisma.lead.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { name: true } },
      assignedOwner: { select: { fullName: true } },
    },
  });

  // Generate CSV rows
  const headers = [
    "ID",
    "First Name",
    "Last Name",
    "Company Name",
    "Email",
    "Phone",
    "Status",
    "Source",
    "Service Required",
    "Deal Value",
    "Next Follow Up",
    "Lost Reason",
    "Priority",
    "Score",
    "Client",
    "Owner",
    "Created At",
  ];

  const rows = leads.map((l) => [
    sanitizeCsvField(l.id),
    sanitizeCsvField(l.firstName),
    sanitizeCsvField(l.lastName),
    sanitizeCsvField(l.companyName || ""),
    sanitizeCsvField(l.email || ""),
    sanitizeCsvField(l.phone || ""),
    sanitizeCsvField(l.status),
    sanitizeCsvField(l.source || ""),
    sanitizeCsvField(l.serviceRequired || ""),
    sanitizeCsvField(l.dealValue ? Number(l.dealValue).toFixed(2) : ""),
    sanitizeCsvField(l.nextFollowUp ? l.nextFollowUp.toISOString() : ""),
    sanitizeCsvField(l.lostReason || ""),
    sanitizeCsvField(l.priority),
    l.score,
    sanitizeCsvField(l.client?.name || ""),
    sanitizeCsvField(l.assignedOwner?.fullName || ""),
    sanitizeCsvField(l.createdAt.toISOString()),
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
