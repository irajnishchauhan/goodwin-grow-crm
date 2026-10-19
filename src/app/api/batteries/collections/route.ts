import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";
import { CollectionStatus } from "@prisma/client";

export async function GET(req: Request) {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = tenantCtx.tenant.id;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const partnerId = searchParams.get("partnerId");
  const onlyFollowUps = searchParams.get("onlyFollowUps") === "true";
  const q = searchParams.get("q");

  const whereClause: any = { tenantId };

  if (status && status !== "ALL") {
    whereClause.status = status as CollectionStatus;
  }
  if (partnerId) {
    whereClause.partnerId = partnerId;
  }
  if (onlyFollowUps) {
    whereClause.nextFollowUpDate = { not: null };
  }
  if (q) {
    whereClause.OR = [
      { invoiceNumber: { contains: q, mode: "insensitive" } },
      { followUpNotes: { contains: q, mode: "insensitive" } },
      { partner: { businessName: { contains: q, mode: "insensitive" } } },
      { partner: { code: { contains: q, mode: "insensitive" } } },
    ];
  }

  try {
    const collections = await prisma.batteryCollection.findMany({
      where: whereClause,
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
      include: {
        partner: true,
      },
    });

    // Ageing analysis buckets calculation
    const allTenantCollections = await prisma.batteryCollection.findMany({
      where: { tenantId, status: { in: ["OVERDUE", "PENDING", "PARTIAL"] } },
      select: { amountDue: true, amountPaid: true, ageingDays: true, nextFollowUpDate: true },
    });

    let bucket0to30 = 0;
    let bucket31to60 = 0;
    let bucket61to90 = 0;
    let bucket90Plus = 0;
    let totalOutstanding = 0;
    let followUpsCount = 0;

    for (const c of allTenantCollections) {
      const remaining = Number(c.amountDue) - Number(c.amountPaid);
      totalOutstanding += remaining;
      if (c.nextFollowUpDate) {
        followUpsCount++;
      }

      if (c.ageingDays <= 30) {
        bucket0to30 += remaining;
      } else if (c.ageingDays <= 60) {
        bucket31to60 += remaining;
      } else if (c.ageingDays <= 90) {
        bucket61to90 += remaining;
      } else {
        bucket90Plus += remaining;
      }
    }

    return NextResponse.json({
      success: true,
      data: collections,
      ageing: {
        totalOutstanding,
        followUpsCount,
        bucket0to30,
        bucket31to60,
        bucket61to90,
        bucket90Plus,
      },
    });
  } catch (error: any) {
    console.error("Error fetching collections:", error);
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
    const { id, followUpNotes, nextFollowUpDate, paymentReceived, paymentMode } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Collection ID is required" }, { status: 400 });
    }

    const current = await prisma.batteryCollection.findUnique({
      where: { id, tenantId },
      include: { partner: true },
    });

    if (!current) {
      return NextResponse.json({ success: false, error: "Collection record not found" }, { status: 404 });
    }

    const updateData: any = {};

    if (followUpNotes) {
      updateData.followUpNotes = followUpNotes;
    }
    if (nextFollowUpDate !== undefined) {
      updateData.nextFollowUpDate = nextFollowUpDate ? new Date(nextFollowUpDate) : null;
    }

    if (paymentReceived && Number(paymentReceived) > 0) {
      const newPaid = Number(current.amountPaid) + Number(paymentReceived);
      updateData.amountPaid = newPaid;
      updateData.paymentDate = new Date();
      updateData.paymentMode = paymentMode || "NEFT / RTGS";

      if (newPaid >= Number(current.amountDue)) {
        updateData.status = CollectionStatus.PAID;
      } else {
        updateData.status = CollectionStatus.PARTIAL;
      }

      // Also adjust partner outstanding in CRM
      if (current.partner) {
        const newBalance = Math.max(0, Number(current.partner.outstandingBalance) - Number(paymentReceived));
        const newOverdue = Math.max(0, Number(current.partner.overdueAmount) - Number(paymentReceived));
        await prisma.batteryPartner.update({
          where: { id: current.partnerId },
          data: {
            outstandingBalance: newBalance,
            overdueAmount: newOverdue,
          },
        });
      }
    }

    const updated = await prisma.batteryCollection.update({
      where: { id },
      data: updateData,
      include: { partner: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Error updating collection:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
