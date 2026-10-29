import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

export async function GET(
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

    const rule = await prisma.automationRule.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
    });

    if (!rule) {
      return NextResponse.json({ success: false, error: "Automation rule not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: rule });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
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

    if (!tenantCtx.hasPermission("automations:manage")) {
      return NextResponse.json({ success: false, error: "Forbidden: Missing automations:manage permission" }, { status: 403 });
    }

    const existing = await prisma.automationRule.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Automation rule not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, triggerEvent, conditions, actions, isActive } = body;

    const updated = await prisma.automationRule.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        triggerEvent: triggerEvent !== undefined ? triggerEvent : existing.triggerEvent,
        conditions: conditions !== undefined ? conditions : (existing.conditions as any),
        actions: actions !== undefined ? actions : (existing.actions as any),
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
      },
    });

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

    if (!tenantCtx.hasPermission("automations:manage")) {
      return NextResponse.json({ success: false, error: "Forbidden: Missing automations:manage permission" }, { status: 403 });
    }

    const existing = await prisma.automationRule.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Automation rule not found" }, { status: 404 });
    }

    await prisma.automationRule.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Automation rule deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
