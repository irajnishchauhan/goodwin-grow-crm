import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";
import { PartnerType, PartnerStatus, PartnerTier } from "@prisma/client";

export async function GET(req: Request) {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = tenantCtx.tenant.id;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // DEALER, DISTRIBUTOR, RETAILER, or ALL
  const territory = searchParams.get("territory");
  const tier = searchParams.get("tier");
  const status = searchParams.get("status");
  const q = searchParams.get("q");

  const whereClause: any = { tenantId };

  if (type && type !== "ALL") {
    whereClause.type = type as PartnerType;
  }
  if (territory && territory !== "ALL") {
    whereClause.territory = territory;
  }
  if (tier && tier !== "ALL") {
    whereClause.tier = tier as PartnerTier;
  }
  if (status && status !== "ALL") {
    whereClause.status = status as PartnerStatus;
  }
  if (q) {
    whereClause.OR = [
      { businessName: { contains: q, mode: "insensitive" } },
      { ownerName: { contains: q, mode: "insensitive" } },
      { code: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
      { gstin: { contains: q, mode: "insensitive" } },
    ];
  }

  try {
    const [partners, counts] = await Promise.all([
      prisma.batteryPartner.findMany({
        where: whereClause,
        orderBy: [{ type: "asc" }, { businessName: "asc" }],
        include: {
          orders: {
            take: 3,
            orderBy: { createdAt: "desc" },
          },
          collections: {
            where: { status: "OVERDUE" },
          },
          _count: {
            select: {
              orders: true,
              collections: true,
              warrantyClaims: true,
              fieldVisits: true,
            },
          },
        },
      }),
      prisma.batteryPartner.groupBy({
        by: ["type", "status"],
        where: { tenantId },
        _count: { _all: true },
      }),
    ]);

    // Compute summary breakdown
    let activeDealersCount = 0;
    let distributorsCount = 0;
    let retailersCount = 0;

    for (const c of counts) {
      if (c.type === "DEALER" && c.status === "ACTIVE") activeDealersCount += c._count._all;
      if (c.type === "DISTRIBUTOR") distributorsCount += c._count._all;
      if (c.type === "RETAILER") retailersCount += c._count._all;
    }

    return NextResponse.json({
      success: true,
      data: partners,
      summary: {
        activeDealers: activeDealersCount,
        distributors: distributorsCount,
        retailers: retailersCount,
        total: partners.length,
      },
    });
  } catch (error: any) {
    console.error("Error fetching battery partners:", error);
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
      businessName,
      ownerName,
      phone,
      email,
      gstin,
      pan,
      address,
      city,
      state,
      pincode,
      territory,
      type = "DEALER",
      tier = "SILVER",
      creditLimit = 250000,
      creditDays = 30,
      parentDistributorId,
    } = body;

    if (!businessName || !ownerName || !phone || !city || !state || !territory) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (business name, owner, phone, city, state, territory)" },
        { status: 400 }
      );
    }

    // Auto-generate unique partner code if not provided
    const prefix = type === "DISTRIBUTOR" ? "DIST" : type === "RETAILER" ? "RET" : "DLR";
    const count = await prisma.batteryPartner.count({ where: { tenantId, type: type as PartnerType } });
    const code = `${prefix}-${(count + 1).toString().padStart(3, "0")}`;

    const partner = await prisma.batteryPartner.create({
      data: {
        tenantId,
        code,
        businessName,
        ownerName,
        phone,
        email: email || null,
        gstin: gstin ? gstin.toUpperCase().trim() : null,
        pan: pan ? pan.toUpperCase().trim() : null,
        address: address || "",
        city,
        state,
        pincode: pincode || null,
        territory,
        type: type as PartnerType,
        tier: tier as PartnerTier,
        creditLimit: Number(creditLimit),
        creditDays: Number(creditDays),
        parentDistributorId: parentDistributorId || null,
        assignedSalesUserId: tenantCtx.user.id,
        status: PartnerStatus.ACTIVE,
      },
    });

    return NextResponse.json({ success: true, data: partner }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating battery partner:", error);
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
    const { id, status, creditLimit, creditDays, tier, outstandingBalance, overdueAmount } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Partner ID is required" }, { status: 400 });
    }

    const partner = await prisma.batteryPartner.update({
      where: { id, tenantId },
      data: {
        ...(status && { status: status as PartnerStatus }),
        ...(creditLimit !== undefined && { creditLimit: Number(creditLimit) }),
        ...(creditDays !== undefined && { creditDays: Number(creditDays) }),
        ...(tier && { tier: tier as PartnerTier }),
        ...(outstandingBalance !== undefined && { outstandingBalance: Number(outstandingBalance) }),
        ...(overdueAmount !== undefined && { overdueAmount: Number(overdueAmount) }),
      },
    });

    return NextResponse.json({ success: true, data: partner });
  } catch (error: any) {
    console.error("Error updating battery partner:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
