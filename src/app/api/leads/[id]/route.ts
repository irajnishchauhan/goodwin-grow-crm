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
      client: { select: { id: true, name: true, brandName: true } },
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

  // Client Isolation: Check ownership
  if (tenantCtx.isClientUser && lead.clientId !== tenantCtx.agencyClientId) {
    return NextResponse.json(
      { success: false, error: "Forbidden: Cross-client lead access is strictly prohibited" },
      { status: 403 }
    );
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

    // Client Isolation: Check ownership
    if (tenantCtx.isClientUser && lead.clientId !== tenantCtx.agencyClientId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You cannot modify another client's lead" },
        { status: 403 }
      );
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
      serviceRequired,
      dealValue,
      nextFollowUp,
      lostReason,
      clientId,
      priority,
      score,
      tags,
      assignedOwnerId,
    } = body;

    const previousStatus = lead.status;

    const updateData: any = {
      firstName: firstName !== undefined ? firstName.trim() : lead.firstName,
      lastName: lastName !== undefined ? lastName.trim() : lead.lastName,
      companyName: companyName !== undefined ? companyName : lead.companyName,
      email: email !== undefined ? (email ? email.trim() : null) : lead.email,
      phone: phone !== undefined ? (phone ? phone.trim() : null) : lead.phone,
      status: status ?? lead.status,
      source: source ?? lead.source,
      serviceRequired: serviceRequired !== undefined ? serviceRequired : lead.serviceRequired,
      dealValue: dealValue !== undefined ? (dealValue ? Number(dealValue) : null) : lead.dealValue,
      nextFollowUp: nextFollowUp !== undefined ? (nextFollowUp ? new Date(nextFollowUp) : null) : lead.nextFollowUp,
      lostReason: status === "LOST" ? (lostReason || lead.lostReason) : (status && status !== "LOST" ? null : (lostReason ?? lead.lostReason)),
      priority: priority ?? lead.priority,
      score: score !== undefined ? Number(score) : lead.score,
      tags: Array.isArray(tags) ? tags : lead.tags,
      assignedOwnerId: assignedOwnerId !== undefined ? assignedOwnerId : lead.assignedOwnerId,
    };

    if (!tenantCtx.isClientUser && clientId !== undefined) {
      updateData.clientId = clientId || null;
    }

    const updated = await prisma.lead.update({
      where: { id: lead.id },
      data: updateData,
      include: {
        assignedOwner: { select: { id: true, fullName: true, email: true } },
        client: { select: { id: true, name: true, brandName: true } },
      },
    });

    if (status && status !== previousStatus) {
      await prisma.activity.create({
        data: {
          tenantId: tenantCtx.tenant.id,
          type: "TASK",
          title: "Lead Status Changed",
          description: `Status changed from ${previousStatus} to ${status}${status === "LOST" && lostReason ? ` (Reason: ${lostReason})` : ""}`,
          performedById: tenantCtx.user.id,
          leadId: lead.id,
        },
      });
    }

    if (nextFollowUp && nextFollowUp !== lead.nextFollowUp?.toISOString()) {
      await prisma.activity.create({
        data: {
          tenantId: tenantCtx.tenant.id,
          type: "CALL",
          title: "Next Follow-Up Scheduled",
          description: `Follow-up scheduled for ${new Date(nextFollowUp).toLocaleString("en-IN")}`,
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

    if (tenantCtx.isClientUser) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Clients cannot delete leads" },
        { status: 403 }
      );
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

