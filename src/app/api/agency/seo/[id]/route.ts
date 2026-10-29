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

    const item = await prisma.seoTracker.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
      include: { client: true },
    });

    if (!item) {
      return NextResponse.json({ success: false, error: "SEO Tracker not found" }, { status: 404 });
    }

    if (tenantCtx.isClientUser && item.clientId !== tenantCtx.agencyClientId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Cross-client SEO tracker access is prohibited" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: item });
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
    if (tenantCtx.isClientUser) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Client users cannot modify SEO trackers" },
        { status: 403 }
      );
    }

    const existing = await prisma.seoTracker.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "SEO Tracker not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      keyword,
      targetUrl,
      currentRank,
      previousRank,
      searchVolume,
      difficulty,
      gbpScore,
      backlinksCount,
      clientId,
    } = body;

    const updated = await prisma.seoTracker.update({
      where: { id },
      data: {
        keyword: keyword !== undefined ? keyword : existing.keyword,
        targetUrl: targetUrl !== undefined ? targetUrl : existing.targetUrl,
        currentRank: currentRank !== undefined ? Number(currentRank) : existing.currentRank,
        previousRank: previousRank !== undefined ? Number(previousRank) : existing.previousRank,
        searchVolume: searchVolume !== undefined ? Number(searchVolume) : existing.searchVolume,
        difficulty: difficulty !== undefined ? Number(difficulty) : existing.difficulty,
        gbpScore: gbpScore !== undefined ? Number(gbpScore) : existing.gbpScore,
        backlinksCount: backlinksCount !== undefined ? Number(backlinksCount) : existing.backlinksCount,
        clientId: clientId !== undefined ? (clientId || null) : existing.clientId,
        lastAuditedAt: new Date(),
      },
      include: { client: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export const PATCH = PUT;

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
    if (tenantCtx.isClientUser) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Client users cannot delete SEO trackers" },
        { status: 403 }
      );
    }

    const existing = await prisma.seoTracker.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "SEO Tracker not found" }, { status: 404 });
    }

    await prisma.seoTracker.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "SEO Tracker deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
