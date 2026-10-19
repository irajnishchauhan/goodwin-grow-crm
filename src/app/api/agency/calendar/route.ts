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
  const platform = searchParams.get("platform");

  const whereClause: any = { tenantId: tenantCtx.tenant.id };
  if (clientId) whereClause.clientId = clientId;
  if (platform && platform !== "ALL") whereClause.platform = platform;

  const posts = await prisma.contentPost.findMany({
    where: whereClause,
    orderBy: { scheduledDate: "asc" },
    include: {
      client: { select: { id: true, name: true, brandName: true } },
    },
  });

  return NextResponse.json({ success: true, data: posts });
}

export async function POST(req: Request) {
  try {
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, caption, hashtags, clientId, platform, postType, scheduledDate, festivalOrEvent, mediaUrl } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: "Post title is required" }, { status: 400 });
    }

    const post = await prisma.contentPost.create({
      data: {
        tenantId: tenantCtx.tenant.id,
        clientId: clientId || null,
        title,
        caption: caption || null,
        hashtags: hashtags || null,
        platform: platform || "INSTAGRAM",
        postType: postType || "Carousel",
        scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
        festivalOrEvent: festivalOrEvent || null,
        mediaUrl: mediaUrl || null,
        status: "SCHEDULED",
      },
      include: {
        client: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: post });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create post" },
      { status: 500 }
    );
  }
}
