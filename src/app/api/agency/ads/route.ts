import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

export async function GET(req: Request) {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform");
  const clientId = searchParams.get("clientId");

  const whereClause: any = { tenantId: tenantCtx.tenant.id };
  if (platform && platform !== "ALL") whereClause.platform = platform;
  if (tenantCtx.isClientUser) {
    if (!tenantCtx.agencyClientId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: No client associated with account" },
        { status: 403 }
      );
    }
    if (clientId && clientId !== tenantCtx.agencyClientId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Cross-client ad campaign access is prohibited" },
        { status: 403 }
      );
    }
    whereClause.clientId = tenantCtx.agencyClientId;
  } else if (clientId) {
    whereClause.clientId = clientId;
  }

  const ads = await prisma.adCampaign.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { id: true, name: true, brandName: true } },
    },
  });

  return NextResponse.json({ success: true, data: ads });
}

export async function POST(req: Request) {
  try {
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (tenantCtx.isClientUser) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Client users cannot create ad campaigns" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { campaignName, platform, objective, budget, spent, leadsCount, roas, clientId } = body;

    if (!campaignName) {
      return NextResponse.json({ success: false, error: "Campaign name is required" }, { status: 400 });
    }

    const leads = leadsCount ? Number(leadsCount) : 0;
    const spendVal = spent ? Number(spent) : 0;
    const cplVal = leads > 0 ? spendVal / leads : 0;

    const ad = await prisma.adCampaign.create({
      data: {
        tenantId: tenantCtx.tenant.id,
        clientId: clientId || null,
        campaignName,
        platform: platform || "META",
        objective: objective || "Lead Generation",
        budget: budget ? Number(budget) : 0,
        spent: spendVal,
        leadsCount: leads,
        cpl: cplVal,
        roas: roas ? Number(roas) : 0,
        status: "ACTIVE",
      },
      include: {
        client: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: ad });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create ad campaign" },
      { status: 500 }
    );
  }
}
