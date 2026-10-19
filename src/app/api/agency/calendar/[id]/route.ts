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

    const post = await prisma.contentPost.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
      include: { client: true },
    });

    if (!post) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    }

    if (tenantCtx.isClientUser && post.clientId !== tenantCtx.agencyClientId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Cannot view another client's calendar post" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: post });
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

    const existing = await prisma.contentPost.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    }

    if (tenantCtx.isClientUser && existing.clientId !== tenantCtx.agencyClientId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Cannot modify another client's post" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      caption,
      hashtags,
      platform,
      postType,
      scheduledDate,
      status,
      clientId,
      ownerName,
      deadline,
      approvalStatus,
      festivalOrEvent,
      mediaUrl,
    } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (caption !== undefined) updateData.caption = caption;
    if (hashtags !== undefined) updateData.hashtags = hashtags;
    if (platform !== undefined) updateData.platform = platform;
    if (postType !== undefined) updateData.postType = postType;
    if (scheduledDate !== undefined) updateData.scheduledDate = scheduledDate ? new Date(scheduledDate) : null;
    if (status !== undefined) updateData.status = status;
    if (ownerName !== undefined) updateData.ownerName = ownerName;
    if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;
    if (approvalStatus !== undefined) updateData.approvalStatus = approvalStatus;
    if (clientId !== undefined && !tenantCtx.isClientUser) updateData.clientId = clientId || null;
    if (festivalOrEvent !== undefined) updateData.festivalOrEvent = festivalOrEvent;
    if (mediaUrl !== undefined) updateData.mediaUrl = mediaUrl;

    const updated = await prisma.contentPost.update({
      where: { id },
      data: updateData,
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

    const existing = await prisma.contentPost.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    }

    await prisma.contentPost.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Post deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
