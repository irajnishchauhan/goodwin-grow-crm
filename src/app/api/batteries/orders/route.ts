import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";
import { BatteryOrderStatus } from "@prisma/client";

export async function GET(req: Request) {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = tenantCtx.tenant.id;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const partnerId = searchParams.get("partnerId");
  const q = searchParams.get("q");

  const whereClause: any = { tenantId };

  if (status && status !== "ALL") {
    whereClause.status = status as BatteryOrderStatus;
  }
  if (partnerId) {
    whereClause.partnerId = partnerId;
  }
  if (q) {
    whereClause.OR = [
      { orderNumber: { contains: q, mode: "insensitive" } },
      { erpOrderRef: { contains: q, mode: "insensitive" } },
      { partner: { businessName: { contains: q, mode: "insensitive" } } },
      { partner: { code: { contains: q, mode: "insensitive" } } },
    ];
  }

  try {
    const [orders, counts] = await Promise.all([
      prisma.batteryOrder.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        include: {
          partner: true,
        },
      }),
      prisma.batteryOrder.groupBy({
        by: ["status"],
        where: { tenantId },
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),
    ]);

    let pendingCount = 0;
    let pendingValue = 0;
    let dispatchedCount = 0;

    for (const c of counts) {
      if (c.status === "PENDING_APPROVAL") {
        pendingCount = c._count._all;
        pendingValue = Number(c._sum.totalAmount || 0);
      }
      if (c.status === "DISPATCHED" || c.status === "DELIVERED") {
        dispatchedCount += c._count._all;
      }
    }

    return NextResponse.json({
      success: true,
      data: orders,
      summary: {
        total: orders.length,
        pendingCount,
        pendingValue,
        dispatchedCount,
      },
    });
  } catch (error: any) {
    console.error("Error fetching battery orders:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = tenantCtx.tenant.id;

  try {
    const body = await req.json();
    const { partnerId, items, deliveryAddress, notes, expectedDate } = body;

    if (!partnerId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Partner and at least one order line item are required" },
        { status: 400 }
      );
    }

    const partner = await prisma.batteryPartner.findFirst({
      where: { id: partnerId, tenantId },
    });

    if (!partner) {
      return NextResponse.json({ success: false, error: "Partner not found" }, { status: 404 });
    }

    // Calculate total amount from items
    let calculatedTotal = 0;
    for (const item of items) {
      calculatedTotal += Number(item.unitPrice || 0) * Number(item.quantity || 1);
    }

    // Auto-generate order number
    const count = await prisma.batteryOrder.count({ where: { tenantId } });
    const orderNumber = `GB-ORD-2026-${(count + 1).toString().padStart(3, "0")}`;

    const order = await prisma.batteryOrder.create({
      data: {
        tenantId,
        orderNumber,
        partnerId,
        salesUserId: tenantCtx.user.id,
        totalAmount: calculatedTotal,
        status: BatteryOrderStatus.PENDING_APPROVAL,
        erpSyncStatus: "QUEUED_FOR_ERP_VALIDATION",
        items,
        deliveryAddress: deliveryAddress || partner.address,
        notes: notes || `Direct booking for ${partner.businessName}`,
        expectedDate: expectedDate ? new Date(expectedDate) : new Date(Date.now() + 5 * 86400000),
      },
      include: {
        partner: true,
      },
    });

    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating battery order:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = tenantCtx.tenant.id;

  try {
    const body = await req.json();
    const { id, status, triggerErpSync, notes } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Order ID is required" }, { status: 400 });
    }

    const updateData: any = {};

    if (status) {
      updateData.status = status as BatteryOrderStatus;
    }

    if (notes) {
      updateData.notes = notes;
    }

    if (triggerErpSync) {
      // Mock bidirectional ERP Synchronization Boundary
      const randErpRef = `ERP-SO-${Math.floor(Math.random() * 9000 + 1000)}`;
      updateData.erpSyncStatus = "ERP_CONFIRMED_SYNCED";
      updateData.erpOrderRef = randErpRef;
      if (!status) {
        updateData.status = BatteryOrderStatus.APPROVED;
      }
    }

    const updated = await prisma.batteryOrder.update({
      where: { id, tenantId },
      data: updateData,
      include: { partner: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Error updating battery order:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
