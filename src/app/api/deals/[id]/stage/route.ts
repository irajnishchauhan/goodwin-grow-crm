import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";
import { processAutomationRules } from "@/lib/automation/engine";

export async function PATCH(
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
    const body = await req.json();
    const { stageId, lostReason } = body;

    if (!stageId) {
      return NextResponse.json({ success: false, error: "stageId is required" }, { status: 400 });
    }

    // 1. Fetch deal scoped to active tenant
    const deal = await prisma.deal.findFirst({
      where: { id, tenantId },
    });

    if (!deal) {
      return NextResponse.json({ success: false, error: "Deal not found" }, { status: 404 });
    }

    // 2. Fetch target stage ensuring tenant ownership
    const targetStage = await prisma.pipelineStage.findFirst({
      where: { id: stageId, tenantId },
    });

    if (!targetStage) {
      return NextResponse.json(
        { success: false, error: "Target stage does not belong to this tenant" },
        { status: 400 }
      );
    }

    // Determine status
    let status: "OPEN" | "WON" | "LOST" = "OPEN";
    if (targetStage.name.toLowerCase().includes("won")) {
      status = "WON";
    } else if (targetStage.name.toLowerCase().includes("lost")) {
      status = "LOST";
    }

    const previousStageId = deal.stageId;

    const [updatedDeal] = await prisma.$transaction([
      prisma.deal.update({
        where: { id: deal.id },
        data: {
          stageId: targetStage.id,
          probability: targetStage.winProbability,
          status,
          lostReason: status === "LOST" ? lostReason || "Unspecified" : null,
        },
      }),
      prisma.dealStageHistory.create({
        data: {
          tenantId,
          dealId: deal.id,
          fromStageId: previousStageId,
          toStageId: targetStage.id,
          changedById: tenantCtx.user.id,
        },
      }),
      prisma.activity.create({
        data: {
          tenantId,
          type: "TASK",
          title: "Deal Stage Changed",
          description: `Stage moved to "${targetStage.name}" (${status})`,
          performedById: tenantCtx.user.id,
          dealId: deal.id,
        },
      }),
    ]);

    processAutomationRules({
      tenantId,
      triggerEvent: "deal.stage_changed",
      entityType: "Deal",
      entityId: deal.id,
      data: updatedDeal,
      payload: {
        ...updatedDeal,
        stage: targetStage.name,
        ownerId: updatedDeal.assignedOwnerId,
        assignedOwnerId: updatedDeal.assignedOwnerId,
      },
    }).catch(() => {});

    if (status === "WON") {
      processAutomationRules({
        tenantId,
        triggerEvent: "deal.won",
        entityType: "Deal",
        entityId: deal.id,
        data: updatedDeal,
        payload: updatedDeal,
      }).catch(() => {});
    } else if (status === "LOST") {
      processAutomationRules({
        tenantId,
        triggerEvent: "deal.lost",
        entityType: "Deal",
        entityId: deal.id,
        data: updatedDeal,
        payload: updatedDeal,
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, data: updatedDeal });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update deal stage" },
      { status: 500 }
    );
  }
}
