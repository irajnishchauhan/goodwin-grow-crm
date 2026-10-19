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
  const reviewStatus = searchParams.get("reviewStatus");

  // Client Isolation: One client must NEVER access another client's files or creative assets
  if (tenantCtx.isClientUser) {
    if (!tenantCtx.agencyClientId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Client account is not assigned to a client workspace" },
        { status: 403 }
      );
    }
    if (clientId && clientId !== tenantCtx.agencyClientId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Cross-client creative access is strictly prohibited" },
        { status: 403 }
      );
    }
  }

  const whereClause: any = { tenantId: tenantCtx.tenant.id };
  if (tenantCtx.isClientUser) {
    whereClause.clientId = tenantCtx.agencyClientId;
  } else if (clientId && clientId !== "ALL") {
    whereClause.clientId = clientId;
  }

  if (reviewStatus && reviewStatus !== "ALL") {
    whereClause.reviewStatus = reviewStatus;
  }

  const assets = await prisma.creativeAsset.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { id: true, name: true, brandName: true } },
      versions: { orderBy: { versionNumber: "desc" } },
      comments: {
        where: tenantCtx.isClientUser ? { isInternal: false } : {},
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return NextResponse.json({ success: true, data: assets });
}

export async function POST(req: Request) {
  try {
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (tenantCtx.isClientUser) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Clients cannot create new creative briefs directly" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, assetType, dimensions, fileUrl, mediaType, clientId, submittedBy, reviewStatus } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 });
    }

    const initialStatus = reviewStatus || "INTERNAL_REVIEW";
    const initialUrl = fileUrl || "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800";
    const initialMediaType = mediaType || (initialUrl.match(/\.(mp4|webm|mov)(\?|$)/i) ? "video" : "image");

    const asset = await prisma.creativeAsset.create({
      data: {
        tenantId: tenantCtx.tenant.id,
        clientId: clientId || null,
        title: title.trim(),
        assetType: assetType || "Social Graphic",
        dimensions: dimensions || "1080x1080",
        fileUrl: initialUrl,
        mediaType: initialMediaType,
        version: 1,
        reviewStatus: initialStatus as any,
        submittedBy: submittedBy || tenantCtx.user.fullName,
        versions: {
          create: {
            tenantId: tenantCtx.tenant.id,
            versionNumber: 1,
            fileUrl: initialUrl,
            mediaType: initialMediaType,
            changelog: "Initial creative draft submitted",
            submittedBy: submittedBy || tenantCtx.user.fullName,
          },
        },
      },
      include: {
        client: { select: { id: true, name: true, brandName: true } },
        versions: true,
        comments: true,
      },
    });

    return NextResponse.json({ success: true, data: asset });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create creative asset" },
      { status: 500 }
    );
  }
}

