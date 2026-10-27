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

    const activity = await prisma.activity.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
    });

    if (!activity) {
      return NextResponse.json({ success: false, error: "Activity not found" }, { status: 404 });
    }

    const body = await req.json();
    const { type, title, description, occurredAt } = body;

    const updated = await prisma.activity.update({
      where: { id: activity.id },
      data: {
        ...(type && { type }),
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(occurredAt && { occurredAt: new Date(occurredAt) }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

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

