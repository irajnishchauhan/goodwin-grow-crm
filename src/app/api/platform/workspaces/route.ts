import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { switchActiveTenant } from "@/lib/tenant/context";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Authentication required" },
        { status: 401 }
      );
    }

    const isPlatformAdmin = Boolean(session.user.isPlatformAdmin);
    const activeTenantId = session.activeTenantId;

    if (!isPlatformAdmin) {
      // Regular user: return active memberships
      const memberships = await prisma.tenantMembership.findMany({
        where: {
          userId: session.user.id,
          status: "ACTIVE",
        },
        include: {
          tenant: {
            include: {
              settings: true,
              subscription: { include: { plan: true } },
              _count: { select: { leads: true, deals: true, contacts: true, memberships: true } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      return NextResponse.json({
        success: true,
        isPlatformAdmin: false,
        activeTenantId,
        workspaces: memberships.map((m) => ({
          id: m.tenant.id,
          name: m.tenant.name,
          code: m.tenant.code,
          status: m.tenant.status,
          isOwner: m.isOwner,
          isCurrent: m.tenant.id === activeTenantId,
          planName: m.tenant.subscription?.plan?.name || "Standard",
          seatLimit: m.tenant.settings?.seatLimit || 10,
          stats: {
            members: m.tenant._count.memberships,
            leads: m.tenant._count.leads,
            deals: m.tenant._count.deals,
            contacts: m.tenant._count.contacts,
          },
        })),
      });
    }

    // Platform Super Admin OR Public View: return all client workspaces
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        settings: true,
        subscription: { include: { plan: true } },
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
      isPlatformAdmin,
      activeTenantId,
      workspaces: tenants.map((t) => ({
        id: t.id,
        name: t.name,
        code: t.code,
        status: t.status,
        createdAt: t.createdAt,
        isCurrent: t.id === activeTenantId,
        planName: t.subscription?.plan?.name || "Standard",
        planCode: t.subscription?.plan?.code || "starter",
        settings: t.settings,
        stats: {
          members: t._count.memberships,
          leads: t._count.leads,
          deals: t._count.deals,
          contacts: t._count.contacts,
        },
      })),
    });
  } catch (err: any) {
    console.error("Error fetching workspaces:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to load workspaces" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required to switch workspace" },
        { status: 401 }
      );
    }

    const body = await req.json();
    let targetTenantId = body.tenantId;

    if (!targetTenantId && body.code) {
      const found = await prisma.tenant.findUnique({
        where: { code: body.code.toLowerCase().trim() },
        select: { id: true },
      });
      if (found) targetTenantId = found.id;
    }

    if (!targetTenantId) {
      return NextResponse.json(
        { success: false, error: "Workspace tenantId or code is required" },
        { status: 400 }
      );
    }

    const result = await switchActiveTenant(session.user.id, targetTenantId, session.token);

    return NextResponse.json({
      success: true,
      message: `Active workspace switched to ${result.tenantName}`,
      data: {
        activeTenantId: targetTenantId,
        tenantName: result.tenantName,
        tenantCode: result.tenantCode,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to switch workspace" },
      { status: 400 }
    );
  }
}
