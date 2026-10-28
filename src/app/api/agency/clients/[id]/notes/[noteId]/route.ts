import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";
import { verifyClientConfidentialAccess } from "@/lib/agency/auth-guard";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const { id, noteId } = await params;
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const client = await prisma.agencyClient.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
      select: {
        id: true,
        accountManagerId: true,
        accountManagerName: true,
        email: true,
      },
    });

    if (!client) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
    }

    const access = verifyClientConfidentialAccess(tenantCtx, client);
    if (!access.canAccessConfidentialNotes) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You do not have permission to edit this client's notes." },
        { status: 403 }
      );
    }

    const note = await prisma.agencyClientNote.findFirst({
      where: { id: noteId, clientId: id, tenantId: tenantCtx.tenant.id },
    });

    if (!note) {
      return NextResponse.json({ success: false, error: "Note not found" }, { status: 404 });
    }

    const body = await req.json();
    const { title, content, category, isConfidential } = body;

    const updated = await prisma.agencyClientNote.update({
      where: { id: noteId },
      data: {
        title: title !== undefined ? title.trim() : note.title,
        content: content !== undefined ? content.trim() : note.content,
        category: category !== undefined ? category : note.category,
        isConfidential: isConfidential !== undefined ? Boolean(isConfidential) : note.isConfidential,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update note" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const { id, noteId } = await params;
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const client = await prisma.agencyClient.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
      select: {
        id: true,
        accountManagerId: true,
        accountManagerName: true,
        email: true,
      },
    });

    if (!client) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
    }

    const access = verifyClientConfidentialAccess(tenantCtx, client);
    if (!access.canAccessConfidentialNotes) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You do not have permission to delete this client's notes." },
        { status: 403 }
      );
    }

    const note = await prisma.agencyClientNote.findFirst({
      where: { id: noteId, clientId: id, tenantId: tenantCtx.tenant.id },
    });

    if (!note) {
      return NextResponse.json({ success: false, error: "Note not found" }, { status: 404 });
    }

    await prisma.agencyClientNote.delete({
      where: { id: noteId },
    });

    return NextResponse.json({ success: true, message: "Note deleted successfully" });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete note" },
      { status: 500 }
    );
  }
}
