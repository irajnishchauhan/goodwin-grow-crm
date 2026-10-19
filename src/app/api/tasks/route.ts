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
  const assignedToId = searchParams.get("assignedToId");

  const whereClause: any = { tenantId: tenantCtx.tenant.id };
  if (status && status !== "ALL") {
    whereClause.status = status;
  }

  if (assignedToId && assignedToId !== "ALL") {
    whereClause.assignedToId = assignedToId === "me" ? tenantCtx.user.id : assignedToId;
  }

  const tasks = await prisma.task.findMany({
    where: whereClause,
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    include: {
      assignedTo: { select: { id: true, fullName: true, email: true } },
      lead: { select: { id: true, firstName: true, lastName: true } },
      contact: { select: { id: true, firstName: true, lastName: true } },
      deal: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json({ success: true, data: tasks });
}

export async function POST(req: Request) {
  try {
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = tenantCtx.tenant.id;
    const body = await req.json();
    const { title, description, dueDate, priority = "MEDIUM", assignedToId, leadId, contactId, dealId } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: "Task title is required" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        tenantId,
        title,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority,
        status: "PENDING",
        assignedToId: assignedToId || tenantCtx.user.id,
        leadId: leadId || null,
        contactId: contactId || null,
        dealId: dealId || null,
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

    const { id, status } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ success: false, error: "id and status are required" }, { status: 400 });
    }

    const task = await prisma.task.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
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
