import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";
import { processAutomationRules } from "@/lib/automation/engine";

export async function GET(req: Request) {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = tenantCtx.tenant.id;
  const { searchParams } = new URL(req.url);
  const partnerId = searchParams.get("partnerId");

  const whereClause: any = { tenantId };
  if (partnerId) {
    whereClause.partnerId = partnerId;
  }

  try {
    const visits = await prisma.batteryFieldVisit.findMany({
      where: whereClause,
      orderBy: { visitDate: "desc" },
      include: {
        partner: true,
      },
    });

    const totalOrdersBooked = visits.reduce((acc, v) => acc + Number(v.orderBooked || 0), 0);
    const totalCollectionsMade = visits.reduce((acc, v) => acc + Number(v.collectionMade || 0), 0);

    return NextResponse.json({
      success: true,
      data: visits,
      metrics: {
        totalVisits: visits.length,
        totalOrdersBooked,
        totalCollectionsMade,
      },
    });
  } catch (error: any) {
    console.error("Error fetching field visits:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (tenantCtx.isClientUser) {
    return NextResponse.json({ success: false, error: "Forbidden: Client users cannot log field visits" }, { status: 403 });
  }

  const tenantId = tenantCtx.tenant.id;

  try {
    const body = await req.json();
    const {
      partnerId,
      purpose,
      outcome,
      notes,
      orderBooked,
      collectionMade,
      followUpDate,
      latitude,
      longitude,
      autoCreateOrder,
      autoCreateCollection,
    } = body;

    if (!partnerId || !purpose) {
      return NextResponse.json({ success: false, error: "Partner and purpose are required" }, { status: 400 });
    }

    const partner = await prisma.batteryPartner.findFirst({
      where: { id: partnerId, tenantId },
    });

    if (!partner) {
      return NextResponse.json(
        { success: false, error: "Partner not found in this workspace" },
        { status: 404 }
      );
    }

    let resolvedNotes = notes || "GPS Verified Check-in.";
    if (latitude && longitude) {
      resolvedNotes = `[GPS Coordinates: ${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}] ${resolvedNotes}`.trim();
    }

    const visit = await prisma.batteryFieldVisit.create({
      data: {
        tenantId,
        partnerId,
        salesUserId: tenantCtx.user.id,
        purpose,
        outcome: outcome || "Visit completed as scheduled.",
        notes: resolvedNotes,
        orderBooked: orderBooked ? Number(orderBooked) : null,
        collectionMade: collectionMade ? Number(collectionMade) : null,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
      },
      include: { partner: true },
    });

    // Auto-create purchase order if requested and order booked > 0
    if (autoCreateOrder && Number(orderBooked) > 0) {
      const orderCount = await prisma.batteryOrder.count({ where: { tenantId } });
      const orderNumber = `GB-ORD-2026-${(orderCount + 1).toString().padStart(3, "0")}`;
      await prisma.batteryOrder.create({
        data: {
          tenantId,
          orderNumber,
          partnerId,
          salesUserId: tenantCtx.user.id,
          totalAmount: Number(orderBooked),
          status: "PENDING_APPROVAL",
          erpSyncStatus: "QUEUED_FOR_ERP_VALIDATION",
          items: [
            {
              sku: "GB-FLD-BOOKING",
              name: `Field Sales Booking (${partner.businessName})`,
              quantity: 1,
              unitPrice: Number(orderBooked),
            },
          ],
          deliveryAddress: partner.address,
          notes: `Booked on field visit on ${new Date().toLocaleDateString("en-IN")}. Purpose: ${purpose}`,
        },
      }).catch((e) => console.warn("Notice: Order auto-creation error:", e));

      await prisma.batteryPartner.update({
        where: { id: partner.id },
        data: {
          outstandingBalance: {
            increment: Number(orderBooked),
          },
        },
      }).catch(() => {});
    }

    // Auto-record collection payment if requested and collection made > 0
    if (autoCreateCollection && Number(collectionMade) > 0) {
      const colCount = await prisma.batteryCollection.count({ where: { tenantId } });
      const invoiceNumber = `GB-RCPT-2026-${(colCount + 1).toString().padStart(3, "0")}`;
      const amountPaidVal = Number(collectionMade);

      await prisma.batteryCollection.create({
        data: {
          tenantId,
          partnerId,
          invoiceNumber,
          amountDue: amountPaidVal,
          amountPaid: amountPaidVal,
          dueDate: new Date(),
          paymentDate: new Date(),
          paymentMode: "Field Executive Cash/Cheque Collection",
          status: "PAID",
          ageingDays: 0,
          followUpNotes: `Collected by field executive during on-site visit (${purpose})`,
        },
      }).catch((e) => console.warn("Notice: Collection auto-creation error:", e));

      await prisma.batteryPartner.update({
        where: { id: partner.id },
        data: {
          outstandingBalance: {
            decrement: Math.min(Number(partner.outstandingBalance), amountPaidVal),
          },
          overdueAmount: {
            decrement: Math.min(Number(partner.overdueAmount), amountPaidVal),
          },
        },
      }).catch(() => {});
    }

    processAutomationRules({
      tenantId,
      triggerEvent: "field_visit.completed",
      entityType: "FieldVisit",
      entityId: visit.id,
      data: {
        partnerId: partner.id,
        partnerName: partner.businessName,
        purpose: visit.purpose,
        outcome: visit.outcome,
        orderBooked: visit.orderBooked,
      },
    }).catch((err) => console.error("Field visit automation error:", err));

    return NextResponse.json({ success: true, data: visit }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating field visit:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
