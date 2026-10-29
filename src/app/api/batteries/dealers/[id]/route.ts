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

    const partner = await prisma.batteryPartner.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
      include: {
        orders: { take: 10, orderBy: { createdAt: "desc" } },
        collections: { orderBy: { dueDate: "asc" } },
        warrantyClaims: { take: 5, orderBy: { createdAt: "desc" } },
        fieldVisits: { take: 5, orderBy: { visitDate: "desc" } },
      },
    });

    if (!partner) {
      return NextResponse.json({ success: false, error: "Partner not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: partner });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

async function updateDealer(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (tenantCtx.isClientUser) {
      return NextResponse.json({ success: false, error: "Forbidden: Client users cannot update partners" }, { status: 403 });
    }

    const partner = await prisma.batteryPartner.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
    });

    if (!partner) {
      return NextResponse.json({ success: false, error: "Partner not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      businessName,
      ownerName,
      phone,
      email,
      gstin,
      pan,
      address,
      city,
      state,
      pincode,
      territory,
      tier,
      status,
      type,
      creditLimit,
      creditDays,
      outstandingBalance,
      overdueAmount,
      assignedSalesUserId,
      parentDistributorId,
    } = body;

    if (parentDistributorId) {
      const parentDist = await prisma.batteryPartner.findFirst({
        where: { id: parentDistributorId, tenantId: tenantCtx.tenant.id },
      });
      if (!parentDist) {
        return NextResponse.json(
          { success: false, error: "Parent distributor not found in this workspace" },
          { status: 404 }
        );
      }
    }

    const updated = await prisma.batteryPartner.update({
      where: { id: partner.id },
      data: {
        ...(businessName && { businessName }),
        ...(ownerName && { ownerName }),
        ...(phone && { phone }),
        ...(email !== undefined && { email }),
        ...(gstin !== undefined && { gstin }),
        ...(pan !== undefined && { pan }),
        ...(address !== undefined && { address }),
        ...(city && { city }),
        ...(state && { state }),
        ...(pincode !== undefined && { pincode }),
        ...(territory && { territory }),
        ...(tier && { tier }),
        ...(status && { status }),
        ...(type && { type }),
        ...(creditLimit !== undefined && { creditLimit: Number(creditLimit) || 0 }),
        ...(creditDays !== undefined && { creditDays: Number(creditDays) || 30 }),
        ...(outstandingBalance !== undefined && { outstandingBalance: Number(outstandingBalance) || 0 }),
        ...(overdueAmount !== undefined && { overdueAmount: Number(overdueAmount) || 0 }),
        ...(assignedSalesUserId !== undefined && { assignedSalesUserId }),
        ...(parentDistributorId !== undefined && { parentDistributorId }),
      },
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
  return updateDealer(req, context);
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  return updateDealer(req, context);
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
      return NextResponse.json({ success: false, error: "Forbidden: Client users cannot delete partners" }, { status: 403 });
    }

    const partner = await prisma.batteryPartner.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
    });

    if (!partner) {
      return NextResponse.json({ success: false, error: "Partner not found" }, { status: 404 });
    }

    // Cascade delete any child records before deleting partner
    await prisma.batteryFieldVisit.deleteMany({ where: { partnerId: partner.id } }).catch(() => {});
    await prisma.batteryWarrantyClaim.deleteMany({ where: { partnerId: partner.id } }).catch(() => {});
    await prisma.batteryCollection.deleteMany({ where: { partnerId: partner.id } }).catch(() => {});
    await prisma.batteryOrder.deleteMany({ where: { partnerId: partner.id } }).catch(() => {});

    await prisma.batteryPartner.delete({ where: { id: partner.id } });

    return NextResponse.json({ success: true, message: "Partner deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
