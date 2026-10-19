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
      lead: true,
      contact: true,
      deal: true,
    },
  });

  if (!task) {
    return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: task });
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

    const body = await req.json();
    const { title, description, dueDate, priority, status, assignedToId } = body;

    const updated = await prisma.task.update({
      where: { id: task.id },
      data: {
        title: title ?? task.title,
        description: description !== undefined ? description : task.description,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : task.dueDate,
        priority: priority ?? task.priority,
        status: status ?? task.status,
        assignedToId: assignedToId !== undefined ? assignedToId : task.assignedToId,
      },
      include: {
        assignedTo: { select: { id: true, fullName: true, email: true } },
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
