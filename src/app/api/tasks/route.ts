import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

export async function GET(req: Request) {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const assignedToId = searchParams.get("assignedToId");
  const clientId = searchParams.get("clientId");
  const projectId = searchParams.get("projectId");

  // Client Isolation: Enforce client scope
  if (tenantCtx.isClientUser) {
    if (!tenantCtx.agencyClientId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: No client associated with account" },
        { status: 403 }
      );
    }
    if (clientId && clientId !== tenantCtx.agencyClientId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Cross-client tasks access is strictly prohibited" },
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

  if (projectId && projectId !== "ALL") {
    whereClause.projectId = projectId;
  }

  if (status && status !== "ALL") {
    whereClause.status = status;
  }

  if (priority && priority !== "ALL") {
    whereClause.priority = priority;
  }

  if (assignedToId && assignedToId !== "ALL") {
    whereClause.assignedToId = assignedToId === "me" ? tenantCtx.user.id : assignedToId;
  }

  const tasks = await prisma.task.findMany({
    where: whereClause,
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    include: {
      assignedTo: { select: { id: true, fullName: true, email: true } },
      client: { select: { id: true, name: true, brandName: true } },
      project: { select: { id: true, name: true } },
      lead: { select: { id: true, firstName: true, lastName: true } },
      contact: { select: { id: true, firstName: true, lastName: true } },
      deal: { select: { id: true, title: true } },
    },
  });

  const now = new Date();
  const enrichedTasks = tasks.map((t) => ({
    ...t,
    isOverdue: Boolean(t.dueDate && new Date(t.dueDate) < now && t.status !== "COMPLETED"),
  }));

  return NextResponse.json({ success: true, data: enrichedTasks });
}

export async function POST(req: Request) {
  try {
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (tenantCtx.isClientUser) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Client users cannot create or modify tasks" },
        { status: 403 }
      );
    }

    const tenantId = tenantCtx.tenant.id;
    const body = await req.json();
    const {
      title,
      description,
      dueDate,
      priority = "MEDIUM",
      status = "PENDING",
      assignedToId,
      leadId,
      contactId,
      dealId,
      clientId,
      projectId,
      checklist = [],
      attachments = [],
      isRecurring = false,
      recurringInterval,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: "Task title is required" }, { status: 400 });
    }

    const targetClientId = tenantCtx.isClientUser ? tenantCtx.agencyClientId : (clientId || null);

    const task = await prisma.task.create({
      data: {
        tenantId,
        title: title.trim(),
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority,
        status,
        assignedToId: assignedToId || tenantCtx.user.id,
        leadId: leadId || null,
        contactId: contactId || null,
        dealId: dealId || null,
        clientId: targetClientId,
        projectId: projectId || null,
        checklist: Array.isArray(checklist) ? checklist : [],
        attachments: Array.isArray(attachments) ? attachments : [],
        isRecurring: Boolean(isRecurring),
        recurringInterval: recurringInterval || null,
      },
      include: {
        assignedTo: { select: { id: true, fullName: true, email: true } },
        client: { select: { id: true, name: true, brandName: true } },
        project: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: task });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create task" },
      { status: 500 }
    );
  }
}


export async function PATCH(req: Request) {
  try {
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (tenantCtx.isClientUser) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Client users cannot create or modify tasks" },
        { status: 403 }
      );
    }
    if (!tenantCtx.hasPermission("tasks:write")) {
      return NextResponse.json({ success: false, error: "Forbidden: Missing tasks:write permission" }, { status: 403 });
    }

    const tenantId = tenantCtx.tenant.id;
    const body = await req.json();
    const { id, ids, status, priority, assignedToId } = body;

    // Bulk update support
    if (Array.isArray(ids) && ids.length > 0) {
      const updateData: any = {};
      if (status) updateData.status = status;
      if (priority) updateData.priority = priority;
      if (assignedToId) updateData.assignedToId = assignedToId;

      const updated = await prisma.task.updateMany({
        where: { id: { in: ids }, tenantId },
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        message: `Updated ${updated.count} tasks`,
        updatedCount: updated.count,
      });
    }

    // Single update support
    if (!id || !status) {
      return NextResponse.json({ success: false, error: "id and status (or ids array) are required" }, { status: 400 });
    }

    const task = await prisma.task.findFirst({
      where: { id, tenantId },
    });

    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }

    const updated = await prisma.task.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (tenantCtx.isClientUser) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    if (!tenantCtx.hasPermission("tasks:delete") && !tenantCtx.hasPermission("tasks:write")) {
      return NextResponse.json({ success: false, error: "Forbidden: Missing tasks:delete permission" }, { status: 403 });
    }

    const tenantId = tenantCtx.tenant.id;
    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: "Valid array of task IDs required" }, { status: 400 });
    }

    const deleted = await prisma.task.deleteMany({
      where: {
        id: { in: ids },
        tenantId,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${deleted.count} tasks`,
      deletedCount: deleted.count,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
