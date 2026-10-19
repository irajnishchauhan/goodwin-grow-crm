import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const campaign = await prisma.adCampaign.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
      include: { client: true },
    });

    if (!campaign) {
      return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: campaign });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.adCampaign.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      campaignName,
      platform,
      objective,
      status,
      clientId,
      budget,
      spent,
      leadsCount,
      cpl,
      roas,
      impressions,
      clicks,
    } = body;

    const updated = await prisma.adCampaign.update({
      where: { id },
      data: {
        campaignName: campaignName !== undefined ? campaignName : existing.campaignName,
        platform: platform !== undefined ? platform : existing.platform,
        objective: objective !== undefined ? objective : existing.objective,
        status: status !== undefined ? status : existing.status,
        clientId: clientId !== undefined ? (clientId || null) : existing.clientId,
        budget: budget !== undefined ? budget : existing.budget,
        spent: spent !== undefined ? spent : existing.spent,
        leadsCount: leadsCount !== undefined ? Number(leadsCount) : existing.leadsCount,
        cpl: cpl !== undefined ? cpl : existing.cpl,
        roas: roas !== undefined ? roas : existing.roas,
        impressions: impressions !== undefined ? Number(impressions) : existing.impressions,
        clicks: clicks !== undefined ? Number(clicks) : existing.clicks,
      },
      include: { client: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.adCampaign.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 });
    }

    await prisma.adCampaign.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Campaign deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
