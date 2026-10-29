import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";
import { evaluateAutomations } from "@/lib/automation/engine";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (tenantCtx.isClientUser) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
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
    if (tenantCtx.isClientUser) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (!tenantCtx.hasPermission("leads:write")) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const tenantId = tenantCtx.tenant.id;
    const existing = await prisma.lead.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
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
      serviceRequired,
      dealValue,
      nextFollowUp,
      lostReason,
      clientId,
      priority,
      score,
      tags,
      assignedOwnerId,
      convertToDeal,
      dealTitle,
    } = body;

    if (assignedOwnerId) {
      const validMember = await prisma.tenantMembership.findFirst({
        where: { tenantId, userId: assignedOwnerId },
      });
      if (!validMember) {
        return NextResponse.json({ success: false, error: "Invalid assigned owner for this tenant" }, { status: 400 });
      }
    }

    if (clientId) {
      const validClient = await prisma.agencyClient.findFirst({
        where: { id: clientId, tenantId },
      });
      if (!validClient) {
        return NextResponse.json({ success: false, error: "Invalid client for this tenant" }, { status: 400 });
      }
    }

    const previousStatus = existing.status;
    const targetStatus = convertToDeal ? "CONVERTED" : (status ?? existing.status);
    const shouldConvert = (targetStatus === "CONVERTED" && existing.status !== "CONVERTED") || Boolean(convertToDeal);

    const updateData: any = {
      firstName: firstName !== undefined ? firstName.trim() : existing.firstName,
      lastName: lastName !== undefined ? lastName.trim() : existing.lastName,
      companyName: companyName !== undefined ? companyName : existing.companyName,
      email: email !== undefined ? (email ? email.trim() : null) : existing.email,
      phone: phone !== undefined ? (phone ? phone.trim() : null) : existing.phone,
      status: targetStatus,
      source: source ?? existing.source,
      serviceRequired: serviceRequired !== undefined ? serviceRequired : existing.serviceRequired,
      dealValue: dealValue !== undefined ? (dealValue ? Number(dealValue) : null) : existing.dealValue,
      nextFollowUp: nextFollowUp !== undefined ? (nextFollowUp ? new Date(nextFollowUp) : null) : existing.nextFollowUp,
      lostReason: targetStatus === "LOST" ? (lostReason || existing.lostReason) : (targetStatus && targetStatus !== "LOST" ? null : (lostReason ?? existing.lostReason)),
      priority: priority ?? existing.priority,
      score: score !== undefined ? Number(score) : existing.score,
      tags: Array.isArray(tags) ? tags : existing.tags,
      assignedOwnerId: assignedOwnerId !== undefined ? assignedOwnerId : existing.assignedOwnerId,
    };

    if (clientId !== undefined) {
      updateData.clientId = clientId || null;
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (shouldConvert && !existing.convertedContactId) {
        let companyId: string | null = null;
        const resolvedCompanyName = updateData.companyName;
        if (resolvedCompanyName) {
          let company = await tx.company.findFirst({
            where: { tenantId, name: resolvedCompanyName },
          });
          if (!company) {
            company = await tx.company.create({
              data: {
                tenantId,
                name: resolvedCompanyName,
                assignedOwnerId: updateData.assignedOwnerId || tenantCtx.user.id,
              },
            });
          }
          companyId = company.id;
        }

        const contact = await tx.contact.create({
          data: {
            tenantId,
            companyId,
            firstName: updateData.firstName,
            lastName: updateData.lastName,
            email: updateData.email,
            phone: updateData.phone,
            source: updateData.source,
            tags: updateData.tags,
            assignedOwnerId: updateData.assignedOwnerId || tenantCtx.user.id,
          },
        });

        let createdDealId: string | null = null;
        const pipeline = await tx.pipeline.findFirst({
          where: { tenantId, isDefault: true },
          include: { stages: { orderBy: { orderIndex: "asc" } } },
        });

        if (pipeline && pipeline.stages.length > 0) {
          const initialStage = pipeline.stages[0];
          const resolvedTitle =
            dealTitle ||
            `${resolvedCompanyName || `${updateData.firstName} ${updateData.lastName}`} - ${updateData.serviceRequired || "New Deal"}`;
          const resolvedVal = Number(dealValue ?? existing.dealValue) || 0;

          const deal = await tx.deal.create({
            data: {
              tenantId,
              pipelineId: pipeline.id,
              stageId: initialStage.id,
              companyId,
              contactId: contact.id,
              title: resolvedTitle,
              value: resolvedVal,
              currency: "INR",
              probability: initialStage.winProbability,
              status: "OPEN",
              assignedOwnerId: updateData.assignedOwnerId || tenantCtx.user.id,
            },
          });
          createdDealId = deal.id;
        }

        updateData.convertedAt = new Date();
        updateData.convertedContactId = contact.id;
        updateData.convertedDealId = createdDealId;
      }

      return tx.lead.update({
        where: { id: existing.id },
        data: updateData,
        include: {
          assignedOwner: { select: { id: true, fullName: true, email: true } },
          client: { select: { id: true, name: true, brandName: true } },
        },
      });
    });

    if (targetStatus && targetStatus !== previousStatus) {
      await prisma.activity.create({
        data: {
          tenantId,
          type: "TASK",
          title: "Lead Status Changed",
          description: `Status changed from ${previousStatus} to ${targetStatus}${targetStatus === "LOST" && lostReason ? ` (Reason: ${lostReason})` : ""}`,
          performedById: tenantCtx.user.id,
          leadId: existing.id,
        },
      });

      evaluateAutomations({
        tenantId,
        triggerEvent: "LEAD_STATUS_CHANGED",
        entityType: "Lead",
        entityId: existing.id,
        data: updated,
        payload: { ...updated, previousStatus },
      }).catch(() => {});
    }

    if (nextFollowUp && nextFollowUp !== existing.nextFollowUp?.toISOString()) {
      await prisma.activity.create({
        data: {
          tenantId,
          type: "CALL",
          title: "Next Follow-Up Scheduled",
          description: `Follow-up scheduled for ${new Date(nextFollowUp).toLocaleString("en-IN")}`,
          performedById: tenantCtx.user.id,
          leadId: existing.id,
        },
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
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

