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

  // Client Isolation: Enforce client access
  if (tenantCtx.isClientUser) {
    if (!tenantCtx.agencyClientId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: No client associated with account" },
        { status: 403 }
      );
    }
    if (clientId && clientId !== tenantCtx.agencyClientId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Cross-client calendar access is strictly prohibited" },
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

  if (platform && platform !== "ALL") {
    whereClause.platform = platform;
  }

  const posts = await prisma.contentPost.findMany({
    where: whereClause,
    orderBy: { scheduledDate: "asc" },
    include: {
      client: { select: { id: true, name: true, brandName: true } },
    },
  });

  const now = new Date();
  const enrichedPosts = posts.map((p) => {
    const isOverdue = Boolean(
      p.deadline &&
      new Date(p.deadline) < now &&
      !["APPROVED", "PUBLISHED", "CLIENT_APPROVED"].includes(p.approvalStatus || p.status)
    );
    return {
      ...p,
      isOverdueApproval: isOverdue,
    };
  });

  return NextResponse.json({ success: true, data: enrichedPosts });
}

export async function POST(req: Request) {
  try {
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (tenantCtx.isClientUser) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Clients cannot schedule new posts directly" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      caption,
      hashtags,
      clientId,
      platform,
      postType,
      scheduledDate,
      ownerName,
      deadline,
      approvalStatus,
      festivalOrEvent,
      mediaUrl,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: "Post title is required" }, { status: 400 });
    }

    const post = await prisma.contentPost.create({
      data: {
        tenantId: tenantCtx.tenant.id,
        clientId: clientId || null,
        title: title.trim(),
        caption: caption || null,
        hashtags: hashtags || null,
        platform: platform || "INSTAGRAM",
        postType: postType || "Carousel",
        ownerName: ownerName || tenantCtx.user.fullName,
        deadline: deadline ? new Date(deadline) : null,
        approvalStatus: approvalStatus || "DRAFT",
        scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
        festivalOrEvent: festivalOrEvent || null,
        mediaUrl: mediaUrl || null,
        status: "SCHEDULED",
      },
      include: {
        client: { select: { id: true, name: true, brandName: true } },
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

