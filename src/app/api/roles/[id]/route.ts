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

    const isProtectedAdminRole =
      role.isSystem &&
      ["super admin", "agency admin"].includes(role.name.toLowerCase().trim());

    if (role.isSystem && name && name.trim().toLowerCase() !== role.name.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: "Cannot rename built-in system roles." },
        { status: 400 }
      );
    }

    if (isProtectedAdminRole && Array.isArray(permissionCodes)) {
      return NextResponse.json(
        { success: false, error: `Cannot strip or modify permissions of built-in "${role.name}" role.` },
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
        tenantId, // Must belong to this tenant (cannot delete global system roles)
      },
    });

    if (!role) {
      return NextResponse.json(
        { success: false, error: "Role not found or cannot delete global system role" },
        { status: 404 }
      );
    }

    if (role.isSystem) {
      return NextResponse.json(
        { success: false, error: "Cannot delete built-in system role" },
        { status: 400 }
      );
    }

    // Check if role is currently assigned to any team member in this workspace
    const assignedCount = await prisma.membershipRole.count({
      where: {
        roleId: role.id,
        membership: { tenantId },
      },
    });

    if (assignedCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete role "${role.name}" because it is currently assigned to ${assignedCount} team member(s). Reassign them first.`,
        },
        { status: 400 }
      );
    }

    // Delete role (cascade deletes role_permissions)
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
