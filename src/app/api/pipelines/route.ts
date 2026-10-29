import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

export async function GET() {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (tenantCtx.isClientUser) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const pipelines = await prisma.pipeline.findMany({
    where: { tenantId: tenantCtx.tenant.id },
    include: {
      stages: {
        orderBy: { orderIndex: "asc" },
        include: {
          _count: { select: { deals: true } },
        },
      },
    },
  });

  return NextResponse.json({ success: true, data: pipelines });
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

    if (!tenantCtx.hasPermission("settings:manage")) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const tenantId = tenantCtx.tenant.id;
    const body = await req.json();
    const { name, isDefault = false, stages = [] } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: "Pipeline name is required" }, { status: 400 });
    }

    const defaultStages = stages.length > 0 ? stages : [
      { name: "New Opportunity", orderIndex: 0, winProbability: 10 },
      { name: "Discovery Call", orderIndex: 1, winProbability: 30 },
      { name: "Proposal / Demo", orderIndex: 2, winProbability: 60 },
      { name: "Closing / Negotiation", orderIndex: 3, winProbability: 85 },
      { name: "Won", orderIndex: 4, winProbability: 100 },
      { name: "Lost", orderIndex: 5, winProbability: 0 },
    ];

    const pipeline = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.pipeline.updateMany({
          where: { tenantId },
          data: { isDefault: false },
        });
      }

      const p = await tx.pipeline.create({
        data: {
          tenantId,
          name,
          isDefault,
        },
      });

      for (let i = 0; i < defaultStages.length; i++) {
        const st = defaultStages[i];
        await tx.pipelineStage.create({
          data: {
            tenantId,
            pipelineId: p.id,
            name: st.name,
            orderIndex: i,
            winProbability: Number(st.winProbability) || 50,
          },
        });
      }

      return tx.pipeline.findUnique({
        where: { id: p.id },
        include: { stages: { orderBy: { orderIndex: "asc" } } },
      });
    });

    return NextResponse.json({ success: true, data: pipeline });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
