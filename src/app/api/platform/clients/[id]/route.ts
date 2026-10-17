import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getCurrentSession();
  if (!session || !session.user.isPlatformAdmin) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      settings: true,
      subscription: { include: { plan: true } },
      memberships: { include: { user: true } },
      _count: { select: { leads: true, deals: true, contacts: true } },
    },
  });

  if (!tenant) {
    return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: tenant });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getCurrentSession();
    if (!session || !session.user.isPlatformAdmin) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { status, seatLimit, planCode } = body;

    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      let t = tenant;
      if (status) {
        t = await tx.tenant.update({
          where: { id },
          data: { status },
        });
      }

      if (seatLimit !== undefined) {
        await tx.tenantSettings.update({
          where: { tenantId: id },
          data: { seatLimit: Number(seatLimit) },
        });
      }

      if (planCode) {
        const plan = await tx.subscriptionPlan.findUnique({ where: { code: planCode } });
        if (plan) {
          await tx.subscription.update({
            where: { tenantId: id },
            data: { planId: plan.id },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          tenantId: id,
          userId: session.user.id,
          action: "TENANT_UPDATED",
          entityType: "Tenant",
          entityId: id,
          metadata: { status, seatLimit, planCode },
        },
      });

      return t;
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
