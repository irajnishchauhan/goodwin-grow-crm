import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";
import { SYSTEM_PERMISSIONS } from "@/lib/rbac/permissions";

export async function GET() {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = tenantCtx.tenant.id;

  const [roles, allPermissions] = await Promise.all([
    prisma.role.findMany({
      where: {
        OR: [{ tenantId }, { tenantId: null }],
      },
      include: {
        permissions: {
          include: { permission: true },
        },
        membershipRoles: {
          where: {
            membership: { tenantId },
          },
          include: {
            membership: {
              include: {
                user: { select: { id: true, fullName: true, email: true } },
              },
            },
          },
        },
      },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    }),
    prisma.permission.findMany({
      orderBy: [{ module: "asc" }, { code: "asc" }],
    }),
  ]);

  const formattedRoles = roles.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    isSystem: r.isSystem,
    tenantId: r.tenantId,
    isCustom: r.tenantId === tenantId,
    memberCount: r.membershipRoles.length,
    members: r.membershipRoles.map((mr) => ({
      userId: mr.membership.user.id,
      fullName: mr.membership.user.fullName,
      email: mr.membership.user.email,
    })),
    permissions: r.permissions.map((p) => ({
      id: p.permission.id,
      code: p.permission.code,
      module: p.permission.module,
      description: p.permission.description,
    })),
    permissionCodes: r.permissions.map((p) => p.permission.code),
  }));

  return NextResponse.json({
    success: true,
    data: {
      roles: formattedRoles,
      availablePermissions: allPermissions.length > 0 ? allPermissions : SYSTEM_PERMISSIONS,
    },
  });
}

export async function POST(req: Request) {
  try {
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!tenantCtx.hasPermission("team:manage") && !tenantCtx.hasPermission("settings:manage")) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Missing team:manage or settings:manage permission" },
        { status: 403 }
      );
    }

    const tenantId = tenantCtx.tenant.id;
    const body = await req.json();
    const { name, description, permissionCodes = [] } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ success: false, error: "Role name is required" }, { status: 400 });
    }

    const cleanName = name.trim();

    // Check duplicate name within tenant
    const existing = await prisma.role.findFirst({
      where: {
        tenantId,
        name: { equals: cleanName, mode: "insensitive" },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `A role named "${cleanName}" already exists in this workspace` },
        { status: 400 }
      );
    }

    // 1. Create Role
    const role = await prisma.role.create({
      data: {
        tenantId,
        name: cleanName,
        description: description?.trim() || null,
        isSystem: false,
      },
    });

    // 2. Attach permissions
    if (Array.isArray(permissionCodes) && permissionCodes.length > 0) {
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

    // 3. Return created role
    const completeRole = await prisma.role.findUnique({
      where: { id: role.id },
      include: {
        permissions: { include: { permission: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Role "${cleanName}" created successfully`,
      data: completeRole,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
