import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

export async function GET() {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = tenantCtx.tenant.id;

  const [rules, executions] = await Promise.all([
    prisma.automationRule.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.automationExecution.findMany({
      where: { tenantId },
      orderBy: { executedAt: "desc" },
      take: 20,
      include: {
        rule: { select: { name: true } },
      },
    }),
  ]);

  return NextResponse.json({ success: true, data: { rules, executions } });
}

export async function POST(req: Request) {
  try {
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!tenantCtx.hasPermission("automations:manage")) {
      return NextResponse.json({ success: false, error: "Forbidden: Missing automations:manage permission" }, { status: 403 });
    }

    const tenantId = tenantCtx.tenant.id;
    const body = await req.json();
    const { name, triggerEvent, conditions = [], actions = [] } = body;

    if (!name || !triggerEvent) {
      return NextResponse.json({ success: false, error: "Name and Trigger Event are required" }, { status: 400 });
    }

    const rule = await prisma.automationRule.create({
      data: {
        tenantId,
        name,
        triggerEvent,
        conditions,
        actions,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, data: rule });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = tenantCtx.tenant.id;
    const { id, isActive } = await req.json();

    const rule = await prisma.automationRule.findFirst({
      where: { id, tenantId },
    });

    if (!rule) {
      return NextResponse.json({ success: false, error: "Rule not found" }, { status: 404 });
    }

    const updated = await prisma.automationRule.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
