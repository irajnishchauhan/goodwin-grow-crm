import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

export async function GET(req: Request) {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (tenantCtx.isClientUser) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const performedById = searchParams.get("performedById");

  const whereClause: any = { tenantId: tenantCtx.tenant.id };
  if (type && type !== "ALL") {
    whereClause.type = type;
  }

  if (performedById && performedById !== "ALL") {
    whereClause.performedById = performedById === "me" ? tenantCtx.user.id : performedById;
  }

  const activities = await prisma.activity.findMany({
    where: whereClause,
    orderBy: { occurredAt: "desc" },
    include: {
      performedBy: { select: { id: true, fullName: true, email: true } },
      lead: { select: { id: true, firstName: true, lastName: true } },
      contact: { select: { id: true, firstName: true, lastName: true } },
      deal: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json({ success: true, data: activities });
}

export async function POST(req: Request) {
  try {
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (tenantCtx.isClientUser) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    if (!tenantCtx.hasPermission("activities:write")) {
      return NextResponse.json({ success: false, error: "Forbidden: Missing activities:write permission" }, { status: 403 });
    }

    const tenantId = tenantCtx.tenant.id;
    const body = await req.json();
    const { type = "CALL", title, description, occurredAt, leadId, contactId, dealId } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: "Activity title is required" }, { status: 400 });
    }

    const activity = await prisma.activity.create({
      data: {
        tenantId,
        type,
        title,
        description: description || null,
        occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
        performedById: tenantCtx.user.id,
        leadId: leadId || null,
        contactId: contactId || null,
        dealId: dealId || null,
      },
    });

    return NextResponse.json({ success: true, data: activity });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to log activity" },
      { status: 500 }
    );
  }
}
