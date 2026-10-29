import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";
import { CollectionStatus } from "@prisma/client";

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

    const collection = await prisma.batteryCollection.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
      include: { partner: true },
    });

    if (!collection) {
      return NextResponse.json({ success: false, error: "Collection record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: collection });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

async function updateCollection(
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
      return NextResponse.json({ success: false, error: "Forbidden: Client users cannot update collections" }, { status: 403 });
    }

    const collection = await prisma.batteryCollection.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
      include: { partner: true },
    });

    if (!collection) {
      return NextResponse.json({ success: false, error: "Collection record not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      paymentAmount,
      paymentReceived,
      amountPaid,
      paymentDate: reqPaymentDate,
      paymentMode,
      followUpNotes,
      nextFollowUpDate,
      status,
    } = body;

    let updatedAmountPaid = Number(collection.amountPaid);
    let newStatus = collection.status;
    let paymentDate = reqPaymentDate ? new Date(reqPaymentDate) : collection.paymentDate;
    let deltaPaid = 0;

    if (paymentAmount !== undefined || paymentReceived !== undefined) {
      deltaPaid = Number(paymentAmount ?? paymentReceived ?? 0);
      if (deltaPaid > 0) {
        updatedAmountPaid += deltaPaid;
        paymentDate = reqPaymentDate ? new Date(reqPaymentDate) : new Date();
      }
    } else if (amountPaid !== undefined) {
      const nextPaid = Number(amountPaid);
      deltaPaid = Math.max(0, nextPaid - Number(collection.amountPaid));
      updatedAmountPaid = nextPaid;
      if (deltaPaid > 0) {
        paymentDate = reqPaymentDate ? new Date(reqPaymentDate) : new Date();
      }
    }

    if (deltaPaid > 0) {
      if (updatedAmountPaid >= Number(collection.amountDue)) {
        newStatus = "PAID";
      } else if (updatedAmountPaid > 0) {
        newStatus = "PARTIAL";
      }
    }

    if (status) {
      newStatus = status as CollectionStatus;
    }

    const updated = await prisma.batteryCollection.update({
      where: { id: collection.id },
      data: {
        amountPaid: updatedAmountPaid,
        status: newStatus,
        paymentDate,
        ...(paymentMode !== undefined && { paymentMode }),
        ...(followUpNotes !== undefined && { followUpNotes }),
        ...(nextFollowUpDate !== undefined && {
          nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
        }),
      },
      include: { partner: true },
    });

    // Adjust partner outstandingBalance and overdueAmount when additional payment is recorded
    if (deltaPaid > 0 && collection.partner) {
      const newBalance = Math.max(0, Number(collection.partner.outstandingBalance) - deltaPaid);
      const newOverdue = Math.max(0, Number(collection.partner.overdueAmount) - deltaPaid);
      await prisma.batteryPartner
        .update({
          where: { id: collection.partnerId },
          data: {
            outstandingBalance: newBalance,
            overdueAmount: newOverdue,
          },
        })
        .catch(() => {});
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  return updateCollection(req, context);
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  return updateCollection(req, context);
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
      return NextResponse.json({ success: false, error: "Forbidden: Client users cannot delete collections" }, { status: 403 });
    }

    const collection = await prisma.batteryCollection.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
    });

    if (!collection) {
      return NextResponse.json({ success: false, error: "Collection record not found" }, { status: 404 });
    }

    await prisma.batteryCollection.delete({ where: { id: collection.id } });

    return NextResponse.json({ success: true, message: "Collection invoice deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
