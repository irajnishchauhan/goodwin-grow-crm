import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

function canManageRoles(tenantCtx: NonNullable<Awaited<ReturnType<typeof getTenantContext>>>) {
  const isAdminOrOwner =
    tenantCtx.isPlatformAdmin ||
    tenantCtx.membership.isOwner ||
    tenantCtx.primaryRole === "Super Admin" ||
    tenantCtx.primaryRole === "Agency Admin" ||
    tenantCtx.roles.some((r) => ["super admin", "agency admin", "admin", "company admin", "company owner"].includes(r.toLowerCase().trim()));
  return (
    isAdminOrOwner ||
    tenantCtx.hasPermission("roles:manage") ||
    tenantCtx.hasPermission("team:manage") ||
    tenantCtx.hasPermission("settings:manage")
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
    return NextResponse.json({ success: false, error: "Forbidden: Client users cannot access roles" }, { status: 403 });
  }

  const tenantId = tenantCtx.tenant.id;

  const role = await prisma.role.findFirst({
    where: {
      id,
      OR: [{ tenantId }, { tenantId: null }],
    },
    include: {
      permissions: { include: { permission: true } },
      membershipRoles: {
        where: { membership: { tenantId } },
        include: {
          membership: {
            include: { user: { select: { id: true, fullName: true, email: true } } },
          },
        },
      },
    },
  });

  if (!role) {
    return NextResponse.json({ success: false, error: "Role not found" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: {
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      isCustom: role.tenantId === tenantId,
      permissions: role.permissions.map((p) => ({
        id: p.permission.id,
        code: p.permission.code,
        module: p.permission.module,
        description: p.permission.description,
      })),
      permissionCodes: role.permissions.map((p) => p.permission.code),
      members: role.membershipRoles.map((mr) => ({
        userId: mr.membership.user.id,
        fullName: mr.membership.user.fullName,
        email: mr.membership.user.email,
      })),
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
      return NextResponse.json({ success: false, error: "Forbidden: Client users cannot modify roles" }, { status: 403 });
    }

    if (!canManageRoles(tenantCtx)) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Missing roles:manage permission" },
        { status: 403 }
      );
    }

    const tenantId = tenantCtx.tenant.id;

    const role = await prisma.role.findFirst({
      where: {
        id,
        OR: [{ tenantId }, { tenantId: null }],
      },
    });

    if (!role) {
      return NextResponse.json({ success: false, error: "Role not found" }, { status: 404 });
    }

    if (role.tenantId === null) {
      return NextResponse.json(
        { success: false, error: "Cannot modify global system default roles. Create a custom workspace role instead." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, description, permissionCodes } = body;

    const isRootOwnerRole =
      role.name.toLowerCase().trim() === "company owner" ||
      role.name.toLowerCase().trim() === "super admin";

    // Prevent stripping all administrative permissions from root owner
    if (isRootOwnerRole && Array.isArray(permissionCodes) && permissionCodes.length === 0) {
      return NextResponse.json(
        { success: false, error: `Root "${role.name}" role must retain administrative privileges.` },
        { status: 400 }
      );
    }

    // 1. Update Role fields
    const updatedRole = await prisma.role.update({
      where: { id: role.id },
      data: {
        name: name !== undefined ? name.trim() : role.name,
        description: description !== undefined ? (description ? description.trim() : null) : role.description,
      },
    });

    // 2. Update permissions if supplied
    if (Array.isArray(permissionCodes)) {
      // Clear existing
      await prisma.rolePermission.deleteMany({
        where: { roleId: role.id },
      });

      // Find matching permissions
      const perms = await prisma.permission.findMany({
        where: { code: { in: permissionCodes } },
      });

      for (const p of perms) {
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: p.id,
          },
        });
      }
    }

    // 3. Return updated role
    const complete = await prisma.role.findUnique({
      where: { id: role.id },
      include: {
        permissions: { include: { permission: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Role "${updatedRole.name}" updated successfully`,
      data: complete,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
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
      return NextResponse.json({ success: false, error: "Forbidden: Client users cannot delete roles" }, { status: 403 });
    }

    if (!canManageRoles(tenantCtx)) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Missing roles:manage permission" },
        { status: 403 }
      );
    }

    const tenantId = tenantCtx.tenant.id;

    const role = await prisma.role.findFirst({
      where: {
        id,
        OR: [{ tenantId }, { tenantId: null }],
      },
    });

    if (!role) {
      return NextResponse.json(
        { success: false, error: "Role not found" },
        { status: 404 }
      );
    }

    const isRootOwnerRole =
      role.name.toLowerCase().trim() === "company owner" ||
      role.name.toLowerCase().trim() === "super admin";

    if (isRootOwnerRole) {
      return NextResponse.json(
        { success: false, error: `Cannot delete primary workspace role "${role.name}".` },
        { status: 400 }
      );
    }

    // Automatically unassign any team members who had this role
    await prisma.membershipRole.deleteMany({
      where: { roleId: role.id },
    }).catch(() => {});

    // Clear any invitations referencing this role
    await prisma.invitation.deleteMany({
      where: { roleId: role.id },
    }).catch(() => {});

    // Delete role permissions
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id },
    }).catch(() => {});

    // Delete role
    await prisma.role.delete({
      where: { id: role.id },
    });

    return NextResponse.json({
      success: true,
      message: `Role "${role.name}" deleted successfully`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
