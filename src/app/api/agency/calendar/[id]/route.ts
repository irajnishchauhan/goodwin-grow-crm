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
      festivalOrEvent,
      mediaUrl,
    } = body;

    const updated = await prisma.contentPost.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existing.title,
        caption: caption !== undefined ? caption : existing.caption,
        hashtags: hashtags !== undefined ? hashtags : existing.hashtags,
        platform: platform !== undefined ? platform : existing.platform,
        postType: postType !== undefined ? postType : existing.postType,
        scheduledDate: scheduledDate !== undefined ? (scheduledDate ? new Date(scheduledDate) : null) : existing.scheduledDate,
        status: status !== undefined ? status : existing.status,
        clientId: clientId !== undefined ? (clientId || null) : existing.clientId,
        festivalOrEvent: festivalOrEvent !== undefined ? festivalOrEvent : existing.festivalOrEvent,
        mediaUrl: mediaUrl !== undefined ? mediaUrl : existing.mediaUrl,
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
