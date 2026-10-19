import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";
import { WarrantyClaimStatus } from "@prisma/client";

export async function GET(req: Request) {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = tenantCtx.tenant.id;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const serial = searchParams.get("serial");
  const q = searchParams.get("q");

  const whereClause: any = { tenantId };

  if (status && status !== "ALL") {
    whereClause.status = status as WarrantyClaimStatus;
  }
  if (serial) {
    whereClause.batterySerialNumber = { contains: serial, mode: "insensitive" };
  }
  if (q) {
    whereClause.OR = [
      { claimNumber: { contains: q, mode: "insensitive" } },
      { batterySerialNumber: { contains: q, mode: "insensitive" } },
      { customerName: { contains: q, mode: "insensitive" } },
      { customerPhone: { contains: q, mode: "insensitive" } },
      { batteryModel: { contains: q, mode: "insensitive" } },
    ];
  }

  try {
    const claims = await prisma.batteryWarrantyClaim.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        partner: true,
      },
    });

    const counts = await prisma.batteryWarrantyClaim.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: { _all: true },
    });

    return NextResponse.json({
      success: true,
      data: claims,
      counts,
    });
  } catch (error: any) {
    console.error("Error fetching warranty claims:", error);
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
    const {
      partnerId,
      customerName,
      customerPhone,
      batterySerialNumber,
      batteryModel,
      purchaseDate,
      claimType,
      technicianNotes,
    } = body;

    if (!customerName || !customerPhone || !batterySerialNumber || !batteryModel || !claimType) {
      return NextResponse.json(
        { success: false, error: "Missing required fields for warranty registration" },
        { status: 400 }
      );
    }

    const count = await prisma.batteryWarrantyClaim.count({ where: { tenantId } });
    const claimNumber = `GB-CLM-2026-${(count + 1).toString().padStart(3, "0")}`;

    const claim = await prisma.batteryWarrantyClaim.create({
      data: {
        tenantId,
        claimNumber,
        partnerId: partnerId || null,
        customerName,
        customerPhone,
        batterySerialNumber: batterySerialNumber.trim().toUpperCase(),
        batteryModel,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(Date.now() - 180 * 86400000),
        claimType,
        status: WarrantyClaimStatus.SUBMITTED,
        technicianNotes: technicianNotes || "Logged at dealer service desk. Awaiting hydrometer & load tester report.",
        erpSyncStatus: "PENDING_VERIFICATION",
      },
      include: { partner: true },
    });

    return NextResponse.json({ success: true, data: claim }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating warranty claim:", error);
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
    const { id, status, replacementSerial, technicianNotes } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Claim ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (status) {
      updateData.status = status as WarrantyClaimStatus;
    }
    if (replacementSerial) {
      updateData.replacementSerial = replacementSerial.trim().toUpperCase();
      updateData.resolutionDate = new Date();
      updateData.erpSyncStatus = "CREDIT_MEMO_PENDING_IN_ERP";
    }
    if (technicianNotes) {
      updateData.technicianNotes = technicianNotes;
    }

    const updated = await prisma.batteryWarrantyClaim.update({
      where: { id, tenantId },
      data: updateData,
      include: { partner: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Error updating warranty claim:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
