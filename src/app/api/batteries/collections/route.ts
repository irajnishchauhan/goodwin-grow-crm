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
  if (tenantCtx.isClientUser) {
    return NextResponse.json({ success: false, error: "Forbidden: Client users cannot modify collections" }, { status: 403 });
  }

  const tenantId = tenantCtx.tenant.id;

  try {
    const body = await req.json();
    const {
      id,
      partnerId,
      invoiceNumber,
      amountDue,
      amountPaid = 0,
      dueDate,
      status,
      followUpNotes,
      nextFollowUpDate,
      paymentReceived,
      paymentMode,
    } = body;

    // If no `id` is provided, create a new collection invoice record
    if (!id) {
      if (!partnerId || !amountDue) {
        return NextResponse.json(
          { success: false, error: "Partner and amount due are required to create a collection invoice" },
          { status: 400 }
        );
      }

      const partner = await prisma.batteryPartner.findFirst({
        where: { id: partnerId, tenantId },
      });

      if (!partner) {
        return NextResponse.json({ success: false, error: "Partner not found in this workspace" }, { status: 404 });
      }

      const existingCount = await prisma.batteryCollection.count({ where: { tenantId } });
      const resolvedInvoiceNumber =
        invoiceNumber || `GB-INV-2026-${(existingCount + 1).toString().padStart(3, "0")}`;
      const resolvedDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 86400000);
      const paidVal = Number(paymentReceived || amountPaid || 0);
      const dueVal = Number(amountDue);
      const diffMs = Date.now() - resolvedDueDate.getTime();
      const ageingDays = diffMs > 0 ? Math.floor(diffMs / 86400000) : 0;

      let resolvedStatus: CollectionStatus = status
        ? (status as CollectionStatus)
        : paidVal >= dueVal
        ? CollectionStatus.PAID
        : paidVal > 0
        ? CollectionStatus.PARTIAL
        : ageingDays > 0
        ? CollectionStatus.OVERDUE
        : CollectionStatus.PENDING;

      const created = await prisma.batteryCollection.create({
        data: {
          tenantId,
          partnerId,
          invoiceNumber: resolvedInvoiceNumber,
          amountDue: dueVal,
          amountPaid: paidVal,
          dueDate: resolvedDueDate,
          paymentDate: paidVal > 0 ? new Date() : null,
          paymentMode: paidVal > 0 ? paymentMode || "NEFT / RTGS" : null,
          status: resolvedStatus,
          ageingDays,
          followUpNotes: followUpNotes || null,
          nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
        },
        include: { partner: true },
      });

      if (paidVal > 0) {
        const newBalance = Math.max(0, Number(partner.outstandingBalance) - paidVal);
        const newOverdue = Math.max(0, Number(partner.overdueAmount) - paidVal);
        await prisma.batteryPartner.update({
          where: { id: partner.id },
          data: {
            outstandingBalance: newBalance,
            overdueAmount: newOverdue,
          },
        });
      }

      return NextResponse.json({ success: true, data: created }, { status: 201 });
    }

    const current = await prisma.batteryCollection.findUnique({
      where: { id, tenantId },
      include: { partner: true },
    });

    if (!current) {
      return NextResponse.json({ success: false, error: "Collection record not found" }, { status: 404 });
    }

    const updateData: any = {};

    if (followUpNotes !== undefined) {
      updateData.followUpNotes = followUpNotes;
    }
    if (nextFollowUpDate !== undefined) {
      updateData.nextFollowUpDate = nextFollowUpDate ? new Date(nextFollowUpDate) : null;
    }
    if (status) {
      updateData.status = status as CollectionStatus;
    }

    const addedPayment = Number(paymentReceived || amountPaid || 0);
    if (addedPayment > 0) {
      const newPaid = Number(current.amountPaid) + addedPayment;
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
        const newBalance = Math.max(0, Number(current.partner.outstandingBalance) - addedPayment);
        const newOverdue = Math.max(0, Number(current.partner.overdueAmount) - addedPayment);
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
