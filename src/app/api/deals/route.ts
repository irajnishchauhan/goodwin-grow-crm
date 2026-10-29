import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

export async function GET(req: Request) {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (tenantCtx.isClientUser) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const pipelineId = searchParams.get("pipelineId");
  const assignedOwnerId = searchParams.get("assignedOwnerId");

  const whereClause: any = {
    tenantId: tenantCtx.tenant.id,
  };

  if (pipelineId) {
    whereClause.pipelineId = pipelineId;
  }

  if (assignedOwnerId && assignedOwnerId !== "ALL") {
    whereClause.assignedOwnerId = assignedOwnerId === "me" ? tenantCtx.user.id : assignedOwnerId;
  }

  const deals = await prisma.deal.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      stage: true,
      company: { select: { id: true, name: true } },
      contact: { select: { id: true, firstName: true, lastName: true, email: true } },
      assignedOwner: { select: { id: true, fullName: true, email: true } },
    },
  });

  return NextResponse.json({ success: true, data: deals });
}

export async function POST(req: Request) {
  try {
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
    const {
      title,
      value = 0,
      pipelineId,
      stageId,
      companyId,
      contactId,
      expectedCloseDate,
      assignedOwnerId,
    } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: "Deal title is required" }, { status: 400 });
    }

    // Resolve pipeline and stage if not provided
    let finalPipelineId = pipelineId;
    let finalStageId = stageId;

    if (!finalPipelineId || !finalStageId) {
      const defaultPipeline = await prisma.pipeline.findFirst({
        where: { tenantId, isDefault: true },
        include: { stages: { orderBy: { orderIndex: "asc" } } },
      });

      if (!defaultPipeline || defaultPipeline.stages.length === 0) {
        return NextResponse.json({ success: false, error: "No pipeline stages found" }, { status: 400 });
      }

      finalPipelineId = finalPipelineId || defaultPipeline.id;
      finalStageId = finalStageId || defaultPipeline.stages[0].id;
    }

    const validPipeline = await prisma.pipeline.findFirst({
      where: { id: finalPipelineId, tenantId },
    });
    if (!validPipeline) {
      return NextResponse.json({ success: false, error: "Invalid pipeline for this tenant" }, { status: 400 });
    }

    const targetStage = await prisma.pipelineStage.findFirst({
      where: { id: finalStageId, tenantId, pipelineId: finalPipelineId },
    });

    if (!targetStage) {
      return NextResponse.json({ success: false, error: "Invalid pipeline stage" }, { status: 400 });
    }

    // Tenant boundary check on associated contact / company
    if (contactId) {
      const validContact = await prisma.contact.findFirst({ where: { id: contactId, tenantId } });
      if (!validContact) {
        return NextResponse.json({ success: false, error: "Invalid contact for this tenant" }, { status: 400 });
      }
    }

    if (companyId) {
      const validCompany = await prisma.company.findFirst({ where: { id: companyId, tenantId } });
      if (!validCompany) {
        return NextResponse.json({ success: false, error: "Invalid company for this tenant" }, { status: 400 });
      }
    }

    const deal = await prisma.deal.create({
      data: {
        tenantId,
        pipelineId: finalPipelineId,
        stageId: finalStageId,
        title,
        value: Number(value) || 0,
        currency: "INR",
        probability: targetStage.winProbability,
        status: "OPEN",
        companyId: companyId || null,
        contactId: contactId || null,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        assignedOwnerId: assignedOwnerId || tenantCtx.user.id,
      },
    });

    await prisma.activity.create({
      data: {
        tenantId,
        type: "NOTE",
        title: "Deal Created",
        description: `Created deal "${title}" valued at ₹${Number(value).toLocaleString("en-IN")}`,
        performedById: tenantCtx.user.id,
        dealId: deal.id,
      },
    });

    return NextResponse.json({ success: true, data: deal });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create deal" },
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
    if (!tenantCtx.hasPermission("deals:delete") && !tenantCtx.hasPermission("deals:write")) {
      return NextResponse.json({ success: false, error: "Forbidden: Missing deals:delete permission" }, { status: 403 });
    }

    const tenantId = tenantCtx.tenant.id;
    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: "Valid array of deal IDs required" }, { status: 400 });
    }

    await prisma.activity.deleteMany({ where: { dealId: { in: ids }, tenantId } }).catch(() => {});
    await prisma.dealStageHistory.deleteMany({ where: { dealId: { in: ids } } }).catch(() => {});
    await prisma.quotation.deleteMany({ where: { dealId: { in: ids }, tenantId } }).catch(() => {});

    const deleted = await prisma.deal.deleteMany({
      where: {
        id: { in: ids },
        tenantId,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${deleted.count} deals`,
      deletedCount: deleted.count,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
