import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

export async function GET(req: Request) {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const status = searchParams.get("status");

  const whereClause: any = { tenantId: tenantCtx.tenant.id };

  // Client Isolation: Client user can only see their own client profile
  if (tenantCtx.isClientUser) {
    if (!tenantCtx.agencyClientId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: No client associated with account" },
        { status: 403 }
      );
    }
    whereClause.id = tenantCtx.agencyClientId;
  } else {
    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    if (q) {
      whereClause.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { brandName: { contains: q, mode: "insensitive" } },
        { industry: { contains: q, mode: "insensitive" } },
        { accountManagerName: { contains: q, mode: "insensitive" } },
      ];
    }
  }

  const clients = await prisma.agencyClient.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          projects: true,
          tasks: true,
          contentPosts: true,
          creativeAssets: true,
          adCampaigns: true,
          invoices: true,
          notes: true,
          credentials: true,
        },
      },
    },
  });

  return NextResponse.json({ success: true, data: clients });
}

export async function POST(req: Request) {
  try {
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (tenantCtx.isClientUser) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Client users cannot create agency clients" },
        { status: 403 }
      );
    }

    const tenantId = tenantCtx.tenant.id;
    const body = await req.json();
    const {
      name,
      brandName,
      industry,
      website,
      phone,
      email,
      city,
      state,
      activePackage,
      monthlyRetainer,
      status,
      postsPlanned,
      accountManagerName,
      leadDesignerName,
      contentWriterName,
      mediaBuyerName,
      brandGuidelines,
      contractStartDate,
      contractRenewalDate,
      contractEndDate,
      billingCycle,
      packageStatus,
      addOnServices,
      customPricing,
      estimatedDeliveryCost,
      accountManagerId,
    } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: "Client name is required" }, { status: 400 });
    }

    const client = await prisma.agencyClient.create({
      data: {
        tenantId,
        name,
        brandName: brandName || null,
        industry: industry || null,
        website: website || null,
        phone: phone || null,
        email: email || null,
        city: city || null,
        state: state || null,
        activePackage: activePackage || "Growth Retainer (Social + Local SEO)",
        monthlyRetainer: monthlyRetainer ? Number(monthlyRetainer) : 0,
        status: status || "ACTIVE",
        onboardingProgress: 100,
        postsPlanned: postsPlanned ? Number(postsPlanned) : 12,
        postsCompleted: 0,
        accountManagerName: accountManagerName || tenantCtx.user.fullName,
        accountManagerId: accountManagerId || null,
        leadDesignerName: leadDesignerName || null,
        contentWriterName: contentWriterName || null,
        mediaBuyerName: mediaBuyerName || null,
        brandGuidelines: brandGuidelines || null,
        contractStartDate: contractStartDate ? new Date(contractStartDate) : new Date(),
        contractRenewalDate: contractRenewalDate ? new Date(contractRenewalDate) : null,
        contractEndDate: contractEndDate ? new Date(contractEndDate) : null,
        billingCycle: billingCycle || "MONTHLY",
        packageStatus: packageStatus || "ACTIVE",
        addOnServices: addOnServices ? (typeof addOnServices === "string" ? JSON.parse(addOnServices) : addOnServices) : [],
        customPricing: Boolean(customPricing),
        estimatedDeliveryCost: estimatedDeliveryCost ? Number(estimatedDeliveryCost) : 0,
      },
    });

    return NextResponse.json({ success: true, data: client });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create client" },
      { status: 500 }
    );
  }
}
