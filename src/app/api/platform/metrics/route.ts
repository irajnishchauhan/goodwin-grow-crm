import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getCurrentSession();
  if (!session || !session.user.isPlatformAdmin) {
    return NextResponse.json(
      { success: false, error: "Forbidden: Platform Super Admin access required" },
      { status: 403 }
    );
  }

  const [totalTenants, activeTenants, totalUsers, totalDeals, plans] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { status: "ACTIVE" } }),
    prisma.user.count(),
    prisma.deal.count(),
    prisma.subscriptionPlan.findMany({
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      totalTenants,
      activeTenants,
      totalUsers,
      totalDeals,
      plans: plans.map((p) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        monthlyPrice: p.monthlyPrice,
        seatLimit: p.seatLimit,
        subscribersCount: p._count.subscriptions,
      })),
    },
  });
}
