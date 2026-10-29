import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const visit = await prisma.batteryFieldVisit.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
      include: { partner: true },
    });

    if (!visit) {
      return NextResponse.json({ success: false, error: "Field visit not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: visit });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

async function updateFieldVisit(
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
      return NextResponse.json({ success: false, error: "Forbidden: Client users cannot update field visits" }, { status: 403 });
    }

    const visit = await prisma.batteryFieldVisit.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
    });

    if (!visit) {
      return NextResponse.json({ success: false, error: "Field visit not found" }, { status: 404 });
    }

    const body = await req.json();
    const { purpose, outcome, notes, orderBooked, collectionMade, followUpDate } = body;

    const updated = await prisma.batteryFieldVisit.update({
      where: { id: visit.id },
      data: {
        ...(purpose && { purpose }),
        ...(outcome !== undefined && { outcome }),
        ...(notes !== undefined && { notes }),
        ...(orderBooked !== undefined && { orderBooked: orderBooked !== "" && orderBooked !== null ? Number(orderBooked) : null }),
        ...(collectionMade !== undefined && { collectionMade: collectionMade !== "" && collectionMade !== null ? Number(collectionMade) : null }),
        ...(followUpDate !== undefined && { followUpDate: followUpDate ? new Date(followUpDate) : null }),
      },
      include: { partner: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  return updateFieldVisit(req, context);
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  return updateFieldVisit(req, context);
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
    if (tenantCtx.isClientUser) {
      return NextResponse.json({ success: false, error: "Forbidden: Client users cannot delete field visits" }, { status: 403 });
    }

    const visit = await prisma.batteryFieldVisit.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
    });

    if (!visit) {
      return NextResponse.json({ success: false, error: "Field visit not found" }, { status: 404 });
    }

    await prisma.batteryFieldVisit.delete({ where: { id: visit.id } });

    return NextResponse.json({ success: true, message: "Field visit deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
