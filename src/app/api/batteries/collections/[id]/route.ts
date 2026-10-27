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

export async function PATCH(
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
    });

    if (!collection) {
      return NextResponse.json({ success: false, error: "Collection record not found" }, { status: 404 });
    }

    const body = await req.json();
    const { paymentAmount, paymentMode, followUpNotes, nextFollowUpDate, status } = body;

    let updatedAmountPaid = Number(collection.amountPaid);
    let newStatus = collection.status;
    let paymentDate = collection.paymentDate;

    if (paymentAmount !== undefined) {
      updatedAmountPaid += Number(paymentAmount);
      paymentDate = new Date();
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
        ...(paymentMode && { paymentMode }),
        ...(followUpNotes !== undefined && { followUpNotes }),
        nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : undefined,
      },
      include: { partner: true },
    });

    // Also adjust partner outstanding balance if payment recorded
    if (paymentAmount) {
      await prisma.batteryPartner.update({
        where: { id: collection.partnerId },
        data: {
          outstandingBalance: {
            decrement: Number(paymentAmount),
          },
        },
      }).catch(() => {});
    }

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
