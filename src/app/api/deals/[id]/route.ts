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

  const deal = await prisma.deal.findFirst({
    where: { id, tenantId: tenantCtx.tenant.id },
    include: {
      stage: true,
      pipeline: true,
      company: true,
      contact: true,
      assignedOwner: { select: { id: true, fullName: true, email: true } },
      tasks: {
        orderBy: { dueDate: "asc" },
        include: { assignedTo: { select: { fullName: true } } },
      },
      activities: {
        orderBy: { occurredAt: "desc" },
        include: { performedBy: { select: { fullName: true } } },
      },
      notes: {
        orderBy: { createdAt: "desc" },
        include: { createdBy: { select: { fullName: true } } },
      },
      stageHistory: {
        orderBy: { createdAt: "desc" },
        include: {
          fromStage: { select: { name: true } },
          toStage: { select: { name: true } },
        },
      },
    },
  });

  if (!deal) {
    return NextResponse.json({ success: false, error: "Deal not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: deal });
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

    if (!tenantCtx.hasPermission("deals:write")) {
      return NextResponse.json({ success: false, error: "Forbidden: Missing deals:write permission" }, { status: 403 });
    }

    const tenantId = tenantCtx.tenant.id;
    const deal = await prisma.deal.findFirst({
      where: { id, tenantId },
      include: { stage: true },
    });

    if (!deal) {
      return NextResponse.json({ success: false, error: "Deal not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      title,
      value,
      probability,
      expectedCloseDate,
      pipelineId,
      stageId,
      companyId,
      contactId,
      assignedOwnerId,
      status,
      lostReason,
    } = body;

    if (pipelineId) {
      const validPipe = await prisma.pipeline.findFirst({ where: { id: pipelineId, tenantId } });
      if (!validPipe) {
        return NextResponse.json({ success: false, error: "Invalid pipeline for this tenant" }, { status: 400 });
      }
    }

    let targetStage: any = null;
    if (stageId) {
      targetStage = await prisma.pipelineStage.findFirst({
        where: { id: stageId, tenantId },
      });
      if (!targetStage) {
        return NextResponse.json({ success: false, error: "Invalid stage for this tenant" }, { status: 400 });
      }
    }

    if (companyId) {
      const validComp = await prisma.company.findFirst({ where: { id: companyId, tenantId } });
      if (!validComp) {
        return NextResponse.json({ success: false, error: "Invalid company for this tenant" }, { status: 400 });
      }
    }

    if (contactId) {
      const validContact = await prisma.contact.findFirst({ where: { id: contactId, tenantId } });
      if (!validContact) {
        return NextResponse.json({ success: false, error: "Invalid contact for this tenant" }, { status: 400 });
      }
    }

    const previousStageId = deal.stageId;
    const previousStatus = deal.status;
    const stageChanged = Boolean(stageId && stageId !== previousStageId);

    const resolvedProbability =
      probability !== undefined
        ? Number(probability)
        : stageChanged && targetStage
        ? targetStage.winProbability
        : deal.probability;

    const updated = await prisma.$transaction(async (tx) => {
      const upd = await tx.deal.update({
        where: { id: deal.id },
        data: {
          title: title ?? deal.title,
          value: value !== undefined ? Number(value) : deal.value,
          probability: resolvedProbability,
          expectedCloseDate:
            expectedCloseDate !== undefined
              ? expectedCloseDate
                ? new Date(expectedCloseDate)
                : null
              : deal.expectedCloseDate,
          pipelineId: pipelineId ?? deal.pipelineId,
          stageId: stageId ?? deal.stageId,
          companyId: companyId !== undefined ? companyId : deal.companyId,
          contactId: contactId !== undefined ? contactId : deal.contactId,
          assignedOwnerId: assignedOwnerId !== undefined ? assignedOwnerId : deal.assignedOwnerId,
          status: status ?? deal.status,
          lostReason: lostReason !== undefined ? lostReason : deal.lostReason,
        },
        include: {
          stage: true,
          company: true,
          contact: true,
          assignedOwner: { select: { id: true, fullName: true, email: true } },
        },
      });

      if (stageChanged) {
        await tx.dealStageHistory.create({
          data: {
            tenantId,
            dealId: deal.id,
            fromStageId: previousStageId,
            toStageId: stageId,
            changedById: tenantCtx.user.id,
          },
        });
      }

      return upd;
    });

    if (stageChanged) {
      evaluateAutomations({
        tenantId,
        triggerEvent: "DEAL_STAGE_CHANGED",
        entityType: "Deal",
        entityId: deal.id,
        data: updated,
        payload: {
          dealId: deal.id,
          dealTitle: updated.title,
          fromStage: deal.stage.name,
          stage: updated.stage.name,
          value: Number(updated.value),
          ownerId: updated.assignedOwnerId,
          assignedOwnerId: updated.assignedOwnerId,
        },
      }).catch(() => {});
    }

    if (updated.status !== previousStatus) {
      if (updated.status === "WON") {
        evaluateAutomations({
          tenantId,
          triggerEvent: "DEAL_WON",
          entityType: "Deal",
          entityId: deal.id,
          data: updated,
          payload: updated,
        }).catch(() => {});
      } else if (updated.status === "LOST") {
        evaluateAutomations({
          tenantId,
          triggerEvent: "DEAL_LOST",
          entityType: "Deal",
          entityId: deal.id,
          data: updated,
          payload: updated,
        }).catch(() => {});
      }
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
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (!tenantCtx.hasPermission("deals:delete")) {
      return NextResponse.json({ success: false, error: "Forbidden: Missing deals:delete permission" }, { status: 403 });
    }

    const deal = await prisma.deal.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
    });

    if (!deal) {
      return NextResponse.json({ success: false, error: "Deal not found" }, { status: 404 });
    }

    await prisma.deal.delete({ where: { id: deal.id } });

    return NextResponse.json({ success: true, message: "Deal deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
