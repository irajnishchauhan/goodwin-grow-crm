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

  const lead = await prisma.lead.findFirst({
    where: { id, tenantId: tenantCtx.tenant.id },
    include: {
      assignedOwner: { select: { id: true, fullName: true, email: true } },
      activities: {
        orderBy: { occurredAt: "desc" },
        include: { performedBy: { select: { fullName: true } } },
      },
      tasks: {
        orderBy: { dueDate: "asc" },
        include: { assignedTo: { select: { fullName: true } } },
      },
      notes: {
        orderBy: { createdAt: "desc" },
        include: { createdBy: { select: { fullName: true } } },
      },
    },
  });

  if (!lead) {
    return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: lead });
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

    if (!tenantCtx.hasPermission("leads:write")) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const lead = await prisma.lead.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
    });

    if (!lead) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      firstName,
      lastName,
      companyName,
      email,
      phone,
      status,
      source,
      priority,
      score,
      tags,
      assignedOwnerId,
    } = body;

    const previousStatus = lead.status;

    const updated = await prisma.lead.update({
      where: { id: lead.id },
      data: {
        firstName: firstName ?? lead.firstName,
        lastName: lastName ?? lead.lastName,
        companyName: companyName !== undefined ? companyName : lead.companyName,
        email: email !== undefined ? email : lead.email,
        phone: phone !== undefined ? phone : lead.phone,
        status: status ?? lead.status,
        source: source ?? lead.source,
        priority: priority ?? lead.priority,
        score: score !== undefined ? Number(score) : lead.score,
        tags: Array.isArray(tags) ? tags : lead.tags,
        assignedOwnerId: assignedOwnerId !== undefined ? assignedOwnerId : lead.assignedOwnerId,
      },
    });

    if (status && status !== previousStatus) {
      await prisma.activity.create({
        data: {
          tenantId: tenantCtx.tenant.id,
          type: "TASK",
          title: "Lead Status Changed",
          description: `Status changed from ${previousStatus} to ${status}`,
          performedById: tenantCtx.user.id,
          leadId: lead.id,
        },
      });
    }

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

    if (!tenantCtx.hasPermission("leads:delete")) {
      return NextResponse.json({ success: false, error: "Forbidden: Missing leads:delete permission" }, { status: 403 });
    }

    const lead = await prisma.lead.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
    });

    if (!lead) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    await prisma.lead.delete({
      where: { id: lead.id },
    });

    return NextResponse.json({ success: true, message: "Lead deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
