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

    await prisma.batteryOrder.delete({ where: { id: order.id } });

    return NextResponse.json({ success: true, message: "Order deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
