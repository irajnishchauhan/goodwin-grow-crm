import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const activity = await prisma.activity.findFirst({
      where: { id, tenantId },
    });

    if (!activity) {
      return NextResponse.json({ success: false, error: "Activity not found" }, { status: 404 });
    }

    const body = await req.json();
    const { type, title, description, occurredAt, leadId, contactId, dealId } = body;

    const updated = await prisma.activity.update({
      where: { id: activity.id },
      data: {
        ...(type && { type }),
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(occurredAt && { occurredAt: new Date(occurredAt) }),
        ...(leadId !== undefined && { leadId: leadId || null }),
        ...(contactId !== undefined && { contactId: contactId || null }),
        ...(dealId !== undefined && { dealId: dealId || null }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export const PATCH = PUT;

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (tenantCtx.isClientUser) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    if (!tenantCtx.hasPermission("activities:delete") && !tenantCtx.hasPermission("activities:write")) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const activity = await prisma.activity.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
    });

    if (!activity) {
      return NextResponse.json({ success: false, error: "Activity not found" }, { status: 404 });
    }

    await prisma.activity.delete({ where: { id: activity.id } });

    return NextResponse.json({ success: true, message: "Activity deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

