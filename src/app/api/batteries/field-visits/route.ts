import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

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
    const { partnerId, purpose, outcome, notes, orderBooked, collectionMade, followUpDate } = body;

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

    const visit = await prisma.batteryFieldVisit.create({
      data: {
        tenantId,
        partnerId,
        salesUserId: tenantCtx.user.id,
        purpose,
        outcome: outcome || "Visit completed as scheduled.",
        notes: notes || "GPS Verified Check-in.",
        orderBooked: orderBooked ? Number(orderBooked) : null,
        collectionMade: collectionMade ? Number(collectionMade) : null,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
      },
      include: { partner: true },
    });

    return NextResponse.json({ success: true, data: visit }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating field visit:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
