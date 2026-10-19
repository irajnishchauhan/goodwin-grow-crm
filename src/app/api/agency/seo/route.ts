import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

export async function GET(req: Request) {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");

  const whereClause: any = { tenantId: tenantCtx.tenant.id };
  if (clientId) whereClause.clientId = clientId;

  const trackers = await prisma.seoTracker.findMany({
    where: whereClause,
    orderBy: { currentRank: "asc" },
    include: {
      client: { select: { id: true, name: true, brandName: true } },
    },
  });

  return NextResponse.json({ success: true, data: trackers });
}

export async function POST(req: Request) {
  try {
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { keyword, targetUrl, currentRank, searchVolume, difficulty, gbpScore, clientId } = body;

    if (!keyword) {
      return NextResponse.json({ success: false, error: "Keyword is required" }, { status: 400 });
    }

    const tracker = await prisma.seoTracker.create({
      data: {
        tenantId: tenantCtx.tenant.id,
        clientId: clientId || null,
        keyword,
        targetUrl: targetUrl || null,
        currentRank: currentRank ? Number(currentRank) : 1,
        searchVolume: searchVolume ? Number(searchVolume) : 1000,
        difficulty: difficulty ? Number(difficulty) : 25,
        gbpScore: gbpScore ? Number(gbpScore) : 85,
        lastAuditedAt: new Date(),
      },
      include: {
        client: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: tracker });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create SEO tracker" },
      { status: 500 }
    );
  }
}
