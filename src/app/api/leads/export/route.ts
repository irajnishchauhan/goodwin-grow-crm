import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

export async function GET(req: Request) {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const targetClientId = searchParams.get("clientId");

  // Client Isolation: One client must NEVER access or export another client's leads
  if (tenantCtx.isClientUser) {
    if (!tenantCtx.agencyClientId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: No client associated with account" },
        { status: 403 }
      );
    }
    if (targetClientId && targetClientId !== tenantCtx.agencyClientId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Cross-client lead export is strictly prohibited" },
        { status: 403 }
      );
    }
  } else if (!tenantCtx.hasPermission("leads:export") && !tenantCtx.hasPermission("*")) {
    return NextResponse.json(
      { success: false, error: "Forbidden: Missing leads:export permission" },
      { status: 403 }
    );
  }

  const whereClause: any = { tenantId: tenantCtx.tenant.id };
  if (tenantCtx.isClientUser) {
    whereClause.clientId = tenantCtx.agencyClientId;
  } else if (targetClientId && targetClientId !== "ALL") {
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
    `"${l.id}"`,
    `"${l.firstName}"`,
    `"${l.lastName}"`,
    `"${l.companyName || ""}"`,
    `"${l.email || ""}"`,
    `"${l.phone || ""}"`,
    `"${l.status}"`,
    `"${l.source || ""}"`,
    `"${l.serviceRequired || ""}"`,
    `"${l.dealValue ? Number(l.dealValue).toFixed(2) : ""}"`,
    `"${l.nextFollowUp ? l.nextFollowUp.toISOString() : ""}"`,
    `"${l.lostReason || ""}"`,
    `"${l.priority}"`,
    l.score,
    `"${l.client?.name || ""}"`,
    `"${l.assignedOwner?.fullName || ""}"`,
    `"${l.createdAt.toISOString()}"`,
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
