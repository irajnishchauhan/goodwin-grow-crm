import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";
import { BatteryOrderStatus } from "@prisma/client";

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

    const order = await prisma.batteryOrder.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
      include: {
        partner: true,
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: order });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

async function updateOrder(
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
      return NextResponse.json({ success: false, error: "Forbidden: Client users cannot update orders" }, { status: 403 });
    }

    const order = await prisma.batteryOrder.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const body = await req.json();
    const { status, deliveryAddress, notes, erpOrderRef, erpSyncStatus, totalAmount, items, triggerErpSync } = body;

    const updateData: any = {
      ...(status && { status: status as BatteryOrderStatus }),
      ...(deliveryAddress !== undefined && { deliveryAddress }),
      ...(notes !== undefined && { notes }),
      ...(erpOrderRef !== undefined && { erpOrderRef }),
      ...(erpSyncStatus !== undefined && { erpSyncStatus }),
      ...(totalAmount !== undefined && { totalAmount: Number(totalAmount) }),
      ...(items !== undefined && { items }),
    };

    if (triggerErpSync || (status === "APPROVED" && !order.erpOrderRef && !erpOrderRef)) {
      const randErpRef = `ERP-SO-${Math.floor(Math.random() * 9000 + 1000)}`;
      updateData.erpSyncStatus = "ERP_CONFIRMED_SYNCED";
      updateData.erpOrderRef = randErpRef;
      if (!status) {
        updateData.status = BatteryOrderStatus.APPROVED;
      }
    }

    // If order is being cancelled, rollback outstandingBalance on partner ledger
    if (status === "CANCELLED" && order.status !== "CANCELLED" && order.status !== "DRAFT" && Number(order.totalAmount) > 0) {
      await prisma.batteryPartner.update({
        where: { id: order.partnerId },
        data: {
          outstandingBalance: {
            decrement: Math.min(Number(order.totalAmount), Number(order.totalAmount)),
          },
        },
      }).catch(() => {});
    }

    // If order is marked DISPATCHED, ensure BatteryCollection record exists for billing & ageing
    if ((status === "DISPATCHED" || status === "APPROVED") && Number(order.totalAmount) > 0) {
      const existingCollection = await prisma.batteryCollection.findFirst({
        where: {
          tenantId: tenantCtx.tenant.id,
          partnerId: order.partnerId,
          invoiceNumber: { contains: order.orderNumber.replace("GB-ORD-", "") },
        },
      });

      if (!existingCollection) {
        const partner = await prisma.batteryPartner.findUnique({ where: { id: order.partnerId } });
        const randSeq = Math.floor(1000 + Math.random() * 9000);
        const invNum = `GB-INV-2026-${randSeq}`;
        const dueDate = new Date(Date.now() + (partner?.creditDays || 30) * 86400000);

        await prisma.batteryCollection.create({
          data: {
            tenantId: tenantCtx.tenant.id,
            partnerId: order.partnerId,
            invoiceNumber: invNum,
            amountDue: order.totalAmount,
            amountPaid: 0,
            dueDate,
            status: "PENDING",
            ageingDays: 0,
            followUpNotes: `Generated on order dispatch for PO ${order.orderNumber}`,
          },
        }).catch((e) => console.warn("Notice: Collection auto-creation error", e));
      }
    }

    const updated = await prisma.batteryOrder.update({
      where: { id: order.id },
      data: updateData,
      include: {
        partner: true,
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
  return updateOrder(req, context);
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  return updateOrder(req, context);
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
      return NextResponse.json({ success: false, error: "Forbidden: Client users cannot delete orders" }, { status: 403 });
    }

    const order = await prisma.batteryOrder.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    // Roll back partner outstanding balance so deleted orders do not create phantom debt
    if (order.status !== "CANCELLED" && order.status !== "DRAFT" && Number(order.totalAmount) > 0) {
      await prisma.batteryPartner.update({
        where: { id: order.partnerId },
        data: {
          outstandingBalance: {
            decrement: Number(order.totalAmount),
          },
        },
      }).catch(() => {});
    }

    await prisma.batteryOrder.delete({ where: { id: order.id } });

    return NextResponse.json({ success: true, message: "Order deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
