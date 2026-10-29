import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

function canManageTeam(tenantCtx: NonNullable<Awaited<ReturnType<typeof getTenantContext>>>) {
  const isAdminOrOwner =
    tenantCtx.isPlatformAdmin ||
    tenantCtx.membership.isOwner ||
    tenantCtx.primaryRole === "Super Admin" ||
    tenantCtx.primaryRole === "Agency Admin" ||
    tenantCtx.roles.some((r) => ["super admin", "agency admin", "admin", "company admin", "company owner"].includes(r.toLowerCase().trim()));
  return (
    isAdminOrOwner ||
    tenantCtx.hasPermission("team:write") ||
    tenantCtx.hasPermission("team:manage")
  );
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (tenantCtx.isClientUser) {
    return NextResponse.json({ success: false, error: "Forbidden: Client users cannot access team member details" }, { status: 403 });
  }

  const tenantId = tenantCtx.tenant.id;

  // Resolve by membership ID or user ID
  const membership = await prisma.tenantMembership.findFirst({
    where: {
      tenantId,
      OR: [{ id }, { userId: id }],
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          avatarUrl: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              assignedLeads: { where: { tenantId } },
              assignedDeals: { where: { tenantId } },
              assignedTasks: { where: { tenantId } },
              performedActivities: { where: { tenantId } },
            },
          },
        },
      },
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
        },
      },
    },
  });

  if (!membership) {
    return NextResponse.json({ success: false, error: "Team member not found" }, { status: 404 });
  }

  const allPermissions = Array.from(
    new Set(
      membership.roles.flatMap((mr) =>
        mr.role.permissions.map((p) => p.permission.code)
      )
    )
  );

  return NextResponse.json({
    success: true,
    data: {
      membershipId: membership.id,
      userId: membership.user.id,
      fullName: membership.user.fullName,
      email: membership.user.email,
      phone: membership.user.phone,
      avatarUrl: membership.user.avatarUrl,
      isOwner: membership.isOwner,
      status: membership.status,
      createdAt: membership.createdAt,
      roles: membership.roles.map((r) => ({
        id: r.role.id,
        name: r.role.name,
        description: r.role.description,
      })),
      permissions: allPermissions,
      workload: {
        leads: membership.user._count.assignedLeads,
        deals: membership.user._count.assignedDeals,
        tasks: membership.user._count.assignedTasks,
        activities: membership.user._count.performedActivities,
      },
    },
  });
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
      return NextResponse.json({ success: false, error: "Forbidden: Client users cannot modify team members" }, { status: 403 });
    }

    if (!canManageTeam(tenantCtx)) {
      return NextResponse.json({ success: false, error: "Forbidden: Missing team:write or team:manage permission" }, { status: 403 });
    }

    const tenantId = tenantCtx.tenant.id;

    // Resolve membership
    const membership = await prisma.tenantMembership.findFirst({
      where: {
        tenantId,
        OR: [{ id }, { userId: id }],
      },
      include: { user: true },
    });

    if (!membership) {
      return NextResponse.json({ success: false, error: "Team member not found" }, { status: 404 });
    }

    const body = await req.json();
    const { fullName, phone, status, roleId, roleIds } = body;

    // Safeguard: Owner cannot be suspended
    if (membership.isOwner && status && status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "Cannot suspend or deactivate the workspace owner" },
        { status: 400 }
      );
    }

    // 1. Update user details
    if (fullName !== undefined || phone !== undefined) {
      await prisma.user.update({
        where: { id: membership.userId },
        data: {
          fullName: fullName !== undefined ? fullName : membership.user.fullName,
          phone: phone !== undefined ? phone : membership.user.phone,
        },
      });
    }

    // 2. Update membership status
    if (status && ["ACTIVE", "INVITED", "SUSPENDED"].includes(status)) {
      await prisma.tenantMembership.update({
        where: { id: membership.id },
        data: { status },
      });
    }

    // 3. Update assigned roles if specified
    const updatedRoleIds: string[] = [];
    if (Array.isArray(roleIds)) {
      updatedRoleIds.push(...roleIds);
    } else if (roleId) {
      updatedRoleIds.push(roleId);
    }

    if (updatedRoleIds.length > 0) {
      // Remove old role links
      await prisma.membershipRole.deleteMany({
        where: { membershipId: membership.id },
      });

      // Create new role links
      for (const rId of Array.from(new Set(updatedRoleIds))) {
        await prisma.membershipRole.create({
          data: {
            membershipId: membership.id,
            roleId: rId,
          },
        });
      }
    }

    // Fetch refreshed membership
    const refreshed = await prisma.tenantMembership.findUnique({
      where: { id: membership.id },
      include: {
        user: true,
        roles: { include: { role: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Team member updated successfully",
      data: refreshed,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  return PUT(req, context);
}

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
      return NextResponse.json({ success: false, error: "Forbidden: Client users cannot remove team members" }, { status: 403 });
    }

    if (!canManageTeam(tenantCtx)) {
      return NextResponse.json({ success: false, error: "Forbidden: Missing team:write or team:manage permission" }, { status: 403 });
    }

    const tenantId = tenantCtx.tenant.id;

    // Resolve membership
    const membership = await prisma.tenantMembership.findFirst({
      where: {
        tenantId,
        OR: [{ id }, { userId: id }],
      },
    });

    if (!membership) {
      return NextResponse.json({ success: false, error: "Team member not found in this workspace" }, { status: 404 });
    }

    // Safeguard: Cannot remove workspace owner
    if (membership.isOwner) {
      return NextResponse.json(
        { success: false, error: "Cannot remove the workspace owner from the organization" },
        { status: 400 }
      );
    }

    // Safeguard: Cannot remove oneself
    if (membership.userId === tenantCtx.user.id) {
      return NextResponse.json(
        { success: false, error: "Cannot remove your own membership. Ask another workspace administrator." },
        { status: 400 }
      );
    }

    // Delete membership
    await prisma.tenantMembership.delete({
      where: { id: membership.id },
    });

    return NextResponse.json({
      success: true,
      message: "Team member removed from workspace successfully",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
