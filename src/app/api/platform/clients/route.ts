import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { provisionTenant } from "@/lib/tenant/provision";

export async function GET() {
  const session = await getCurrentSession();
  if (!session || !session.user.isPlatformAdmin) {
    return NextResponse.json(
      { success: false, error: "Forbidden: Platform Super Admin access required" },
      { status: 403 }
    );
  }

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      settings: true,
      subscription: {
        include: {
          plan: true,
        },
      },
      _count: {
        select: {
          memberships: true,
          leads: true,
          deals: true,
          contacts: true,
        },
      },
    },
  });

  return NextResponse.json({
    success: true,
    data: tenants.map((t) => ({
      id: t.id,
      name: t.name,
      code: t.code,
      status: t.status,
      createdAt: t.createdAt,
      settings: t.settings,
      subscription: t.subscription
        ? {
            planName: t.subscription.plan.name,
            planCode: t.subscription.plan.code,
            status: t.subscription.status,
            currentPeriodEnd: t.subscription.currentPeriodEnd,
          }
        : null,
      stats: {
        membersCount: t._count.memberships,
        leadsCount: t._count.leads,
        dealsCount: t._count.deals,
        contactsCount: t._count.contacts,
      },
    })),
  });
}

export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session || !session.user.isPlatformAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Platform Super Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      name,
      code,
      industry,
      businessEmail,
      phone,
      website,
      address,
      country,
      currency,
      timezone,
      seatLimit,
      planCode,
      adminName,
      adminEmail,
      adminPassword,
    } = body;

    if (!name || !code || !adminName || !adminEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "Company Name, Code, Admin Name, and Admin Email are required",
        },
        { status: 400 }
      );
    }

    // Check code uniqueness
    const existingCode = await prisma.tenant.findUnique({
      where: { code: code.toLowerCase().trim() },
    });

    if (existingCode) {
      return NextResponse.json(
        { success: false, error: "A company with this code already exists" },
        { status: 400 }
      );
    }

    const result = await provisionTenant({
      name,
      code,
      industry,
      businessEmail,
      phone,
      website,
      address,
      country,
      currency,
      timezone,
      seatLimit: Number(seatLimit) || 10,
      planCode: planCode || "starter",
      adminName,
      adminEmail,
      adminPassword,
      createdById: session.user.id,
    });

    return NextResponse.json({
      success: true,
      message: "Client company provisioned successfully",
      data: {
        tenantId: result.tenant.id,
        tenantName: result.tenant.name,
        tenantCode: result.tenant.code,
        adminEmail: result.adminUser.email,
        invitationToken: result.invitationToken,
      },
    });
  } catch (err: any) {
    console.error("Provisioning error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to provision client" },
      { status: 500 }
    );
  }
}
