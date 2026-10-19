import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const task = await prisma.task.findFirst({
    where: { id, tenantId: tenantCtx.tenant.id },
    include: {
      assignedTo: { select: { id: true, fullName: true, email: true } },
      client: { select: { id: true, name: true, brandName: true } },
      project: { select: { id: true, name: true } },
      lead: true,
      contact: true,
      deal: true,
    },
  });

  if (!task) {
    return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
  }

  if (tenantCtx.isClientUser && task.clientId !== tenantCtx.agencyClientId) {
    return NextResponse.json(
      { success: false, error: "Forbidden: Cannot view another client's task" },
      { status: 403 }
    );
  }

  const now = new Date();
  const enrichedTask = {
    ...task,
    isOverdue: Boolean(task.dueDate && new Date(task.dueDate) < now && task.status !== "COMPLETED"),
  };

  return NextResponse.json({ success: true, data: enrichedTask });
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

    if (!tenantCtx.hasPermission("tasks:write")) {
      return NextResponse.json({ success: false, error: "Forbidden: Missing tasks:write permission" }, { status: 403 });
    }

    const task = await prisma.task.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
    });

    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }

    if (tenantCtx.isClientUser && task.clientId !== tenantCtx.agencyClientId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Cannot edit another client's task" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      description,
      dueDate,
      priority,
      status,
      assignedToId,
      checklist,
      attachments,
      isRecurring,
      recurringInterval,
      clientId,
      projectId,
    } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId;
    if (checklist !== undefined) updateData.checklist = checklist;
    if (attachments !== undefined) updateData.attachments = attachments;
    if (isRecurring !== undefined) updateData.isRecurring = isRecurring;
    if (recurringInterval !== undefined) updateData.recurringInterval = recurringInterval;
    if (!tenantCtx.isClientUser && clientId !== undefined) updateData.clientId = clientId || null;
    if (!tenantCtx.isClientUser && projectId !== undefined) updateData.projectId = projectId || null;

    const updated = await prisma.task.update({
      where: { id: task.id },
      data: updateData,
      include: {
        assignedTo: { select: { id: true, fullName: true, email: true } },
        client: { select: { id: true, name: true, brandName: true } },
        project: { select: { id: true, name: true } },
      },
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

    if (!tenantCtx.hasPermission("tasks:delete")) {
      return NextResponse.json({ success: false, error: "Forbidden: Missing tasks:delete permission" }, { status: 403 });
    }

    const task = await prisma.task.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
    });

    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }

    await prisma.task.delete({ where: { id: task.id } });

    return NextResponse.json({ success: true, message: "Task deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
