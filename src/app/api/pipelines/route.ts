import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

export async function GET() {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
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
