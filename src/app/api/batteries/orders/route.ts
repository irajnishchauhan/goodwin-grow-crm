import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";
import { BatteryOrderStatus } from "@prisma/client";
import { processAutomationRules } from "@/lib/automation/engine";

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
  if (tenantCtx.isClientUser) {
    return NextResponse.json({ success: false, error: "Forbidden: Client users cannot create orders" }, { status: 403 });
  }

  const tenantId = tenantCtx.tenant.id;

  try {
    const body = await req.json();
    const { partnerId, items, deliveryAddress, notes, expectedDate, status, totalAmount } = body;

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
    if (totalAmount !== undefined && Number(totalAmount) > 0) {
      calculatedTotal = Number(totalAmount);
    }

    // Auto-generate collision-safe order number
    const existingOrders = await prisma.batteryOrder.findMany({
      where: { tenantId, orderNumber: { startsWith: "GB-ORD-2026-" } },
      select: { orderNumber: true },
    });
    let maxSeq = existingOrders.length;
    for (const o of existingOrders) {
      const num = parseInt(o.orderNumber.replace("GB-ORD-2026-", ""), 10);
      if (!isNaN(num) && num > maxSeq) maxSeq = num;
    }
    const orderNumber = `GB-ORD-2026-${(maxSeq + 1).toString().padStart(3, "0")}`;
    const orderStatus = (status as BatteryOrderStatus) || BatteryOrderStatus.PENDING_APPROVAL;

    const order = await prisma.batteryOrder.create({
      data: {
        tenantId,
        orderNumber,
        partnerId,
        salesUserId: tenantCtx.user.id,
        totalAmount: calculatedTotal,
        status: orderStatus,
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

    if (orderStatus !== BatteryOrderStatus.CANCELLED && orderStatus !== BatteryOrderStatus.DRAFT && calculatedTotal > 0) {
      await prisma.batteryPartner.update({
        where: { id: partner.id },
        data: {
          outstandingBalance: Number(partner.outstandingBalance || 0) + calculatedTotal,
        },
      }).catch(() => {});
    }

    processAutomationRules({
      tenantId,
      triggerEvent: "order.created",
      entityType: "BatteryOrder",
      entityId: order.id,
      data: {
        orderNumber: order.orderNumber,
        partnerId: partner.id,
        partnerName: partner.businessName,
        totalAmount: calculatedTotal,
        status: order.status,
      },
    }).catch((err) => console.error("Order automation error:", err));

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
  if (tenantCtx.isClientUser) {
    return NextResponse.json({ success: false, error: "Forbidden: Client users cannot update orders" }, { status: 403 });
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
