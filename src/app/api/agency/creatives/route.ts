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

  const whereClause: any = { tenantId: tenantCtx.tenant.id };
  if (clientId) whereClause.clientId = clientId;
  if (reviewStatus && reviewStatus !== "ALL") whereClause.reviewStatus = reviewStatus;

  const assets = await prisma.creativeAsset.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { id: true, name: true, brandName: true } },
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

    const body = await req.json();
    const { title, assetType, dimensions, fileUrl, clientId, submittedBy } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 });
    }

    const asset = await prisma.creativeAsset.create({
      data: {
        tenantId: tenantCtx.tenant.id,
        clientId: clientId || null,
        title,
        assetType: assetType || "Social Graphic",
        dimensions: dimensions || "1080x1080",
        fileUrl: fileUrl || "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800",
        version: 1,
        reviewStatus: "PENDING",
        submittedBy: submittedBy || tenantCtx.user.fullName,
      },
      include: {
        client: { select: { id: true, name: true } },
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
