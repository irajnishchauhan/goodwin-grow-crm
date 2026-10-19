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

  const whereClause: any = { tenantId: tenantCtx.tenant.id };
  if (clientId) {
    whereClause.clientId = clientId;
  }

  const projects = await prisma.agencyProject.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { id: true, name: true, brandName: true, activePackage: true } },
      _count: { select: { tasks: true } },
    },
  });

  return NextResponse.json({ success: true, data: projects });
}

export async function POST(req: Request) {
  try {
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, clientId, deliverableType, budget, startDate, dueDate, assigneeName } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: "Project name is required" }, { status: 400 });
    }

    const project = await prisma.agencyProject.create({
      data: {
        tenantId: tenantCtx.tenant.id,
        clientId: clientId || null,
        name,
        description: description || null,
        deliverableType: deliverableType || "Monthly Retainer Deliverable",
        status: "IN_PROGRESS",
        budget: budget ? Number(budget) : 0,
        startDate: startDate ? new Date(startDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeName: assigneeName || tenantCtx.user.fullName,
        progressPercent: 0,
      },
      include: {
        client: { select: { id: true, name: true, brandName: true } },
      },
    });

    return NextResponse.json({ success: true, data: project });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create project" },
      { status: 500 }
    );
  }
}
