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
  const projectId = searchParams.get("projectId");
  const stage = searchParams.get("stage");

  const whereClause: any = { tenantId: tenantCtx.tenant.id };
  if (tenantCtx.isClientUser) {
    if (!tenantCtx.agencyClientId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: No client associated with account" },
        { status: 403 }
      );
    }
    if (clientId && clientId !== tenantCtx.agencyClientId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Cross-client tasks access is prohibited" },
        { status: 403 }
      );
    }
    whereClause.clientId = tenantCtx.agencyClientId;
  } else if (clientId) {
    whereClause.clientId = clientId;
  }
  if (projectId && projectId !== "ALL") whereClause.projectId = projectId;
  if (stage && stage !== "ALL") whereClause.stage = stage;

  const tasks = await prisma.agencyTask.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { id: true, name: true, brandName: true } },
      project: { select: { id: true, name: true } },
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
    if (tenantCtx.isClientUser) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Client users cannot create agency workflow tasks" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, description, clientId, projectId, stage, priority, assigneeName, assigneeRole, dueDate } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: "Task title is required" }, { status: 400 });
    }

    const task = await prisma.agencyTask.create({
      data: {
        tenantId: tenantCtx.tenant.id,
        clientId: clientId || null,
        projectId: projectId || null,
        title,
        description: description || null,
        stage: stage || "CONTENT_BRIEF",
        priority: priority || "MEDIUM",
        assigneeName: assigneeName || tenantCtx.user.fullName,
        assigneeRole: assigneeRole || "Marketing Executive",
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        client: { select: { id: true, name: true } },
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
