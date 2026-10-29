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

    const task = await prisma.agencyTask.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
      include: {
        client: { select: { id: true, name: true, brandName: true } },
        project: { select: { id: true, name: true } },
      },
    });

    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }

    if (tenantCtx.isClientUser && task.clientId !== tenantCtx.agencyClientId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Cross-client task access is prohibited" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: task });
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
        { success: false, error: "Forbidden: Client users cannot modify agency workflow tasks" },
        { status: 403 }
      );
    }

    const existing = await prisma.agencyTask.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }

    const body = await req.json();
    const updated = await prisma.agencyTask.update({
      where: { id },
      data: {
        stage: body.stage ?? existing.stage,
        priority: body.priority ?? existing.priority,
        title: body.title ?? existing.title,
        description: body.description !== undefined ? body.description : existing.description,
        clientId: body.clientId !== undefined ? (body.clientId || null) : existing.clientId,
        projectId: body.projectId !== undefined ? (body.projectId || null) : existing.projectId,
        assigneeName: body.assigneeName ?? existing.assigneeName,
        assigneeRole: body.assigneeRole ?? existing.assigneeRole,
        commentsCount: body.commentsCount !== undefined ? Number(body.commentsCount) : existing.commentsCount,
        dueDate: body.dueDate !== undefined ? (body.dueDate ? new Date(body.dueDate) : null) : existing.dueDate,
      },
      include: {
        client: { select: { id: true, name: true, brandName: true } },
        project: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update task" },
      { status: 500 }
    );
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
        { success: false, error: "Forbidden: Client users cannot delete agency workflow tasks" },
        { status: 403 }
      );
    }

    await prisma.agencyTask.deleteMany({
      where: { id, tenantId: tenantCtx.tenant.id },
    });

    return NextResponse.json({ success: true, message: "Task deleted" });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete task" },
      { status: 500 }
    );
  }
}
