import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";
import { processAutomationRules } from "@/lib/automation/engine";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
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

    if (!tenantCtx.hasPermission("deals:write")) {
      return NextResponse.json({ success: false, error: "Forbidden: Missing deals:write permission" }, { status: 403 });
    }

    const deal = await prisma.deal.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
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
      stageId,
      companyId,
      contactId,
      assignedOwnerId,
      status,
      lostReason,
    } = body;

    const previousStageId = deal.stageId;
    const stageChanged = stageId && stageId !== previousStageId;

    const updated = await prisma.deal.update({
      where: { id: deal.id },
      data: {
        title: title ?? deal.title,
        value: value !== undefined ? Number(value) : deal.value,
        probability: probability !== undefined ? Number(probability) : deal.probability,
        expectedCloseDate: expectedCloseDate !== undefined ? (expectedCloseDate ? new Date(expectedCloseDate) : null) : deal.expectedCloseDate,
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
      await prisma.dealStageHistory.create({
        data: {
          tenantId: tenantCtx.tenant.id,
          dealId: deal.id,
          fromStageId: previousStageId,
          toStageId: stageId,
          changedById: tenantCtx.user.id,
        },
      });

      // Fire workflow automations asynchronously
      processAutomationRules({
        tenantId: tenantCtx.tenant.id,
        triggerEvent: "deal.stage_changed",
        entityType: "Deal",
        entityId: deal.id,
        payload: {
          dealId: deal.id,
          dealTitle: updated.title,
          fromStage: deal.stage.name,
          stage: updated.stage.name,
          value: Number(updated.value),
          ownerId: updated.assignedOwnerId,
        },
      }).catch(console.error);
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
