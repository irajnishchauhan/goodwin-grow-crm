import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";
import { hashPassword } from "@/lib/auth/password";

export async function GET(req: Request) {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = tenantCtx.tenant.id;
  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status");
  const activeOnly = url.searchParams.get("activeOnly");

  const whereClause: any = { tenantId };
  if (activeOnly === "true") {
    whereClause.status = "ACTIVE";
  } else if (statusParam && ["ACTIVE", "INVITED", "SUSPENDED"].includes(statusParam.toUpperCase())) {
    whereClause.status = statusParam.toUpperCase();
  }

  const memberships = await prisma.tenantMembership.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          avatarUrl: true,
          isActive: true,
          _count: {
            select: {
              assignedLeads: { where: { tenantId } },
              assignedDeals: { where: { tenantId } },
              assignedTasks: { where: { tenantId } },
            },
          },
        },
      },
      roles: {
        include: {
          role: { select: { id: true, name: true, description: true } },
        },
      },
    },
    orderBy: [{ isOwner: "desc" }, { createdAt: "asc" }],
  });

  const fakePersonaEmails = [
    "pooja@goodwingrowai.com",
    "kunal@goodwingrowai.com",
    "client@sapnawashing.in",
    "client@ambafurnishing.com",
    "admin@sapnawashing.com",
  ];

  const teamMembers = memberships
    .filter((m) => {
      const email = m.user.email.toLowerCase();
      const name = m.user.fullName.toLowerCase();
      if (fakePersonaEmails.includes(email)) return false;
      if (name.includes("pooja verma") || name.includes("aman gupta") || name.includes("kunal sharma")) return false;
      return true;
    })
    .map((m) => ({
      id: m.user.id,
    userId: m.user.id,
    membershipId: m.id,
    fullName: m.user.fullName,
    email: m.user.email,
    phone: m.user.phone || null,
    avatarUrl: m.user.avatarUrl,
    isOwner: m.isOwner,
    status: m.status,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
    roles: m.roles.map((r) => r.role.name),
    roleObjects: m.roles.map((r) => ({ id: r.role.id, name: r.role.name, description: r.role.description })),
    roleIds: m.roles.map((r) => r.role.id),
    primaryRole: m.roles[0]?.role.name || (m.isOwner ? "Company Owner" : "Member"),
    workload: {
      leads: m.user._count.assignedLeads,
      deals: m.user._count.assignedDeals,
      tasks: m.user._count.assignedTasks,
    },
  }));

  return NextResponse.json({ success: true, data: teamMembers });
}

export async function POST(req: Request) {
  try {
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!tenantCtx.hasPermission("team:manage")) {
      return NextResponse.json({ success: false, error: "Forbidden: Missing team:manage permission" }, { status: 403 });
    }

    const tenantId = tenantCtx.tenant.id;
    const body = await req.json();
    const { email, fullName, phone, roleId, roleIds = [], initialPassword, status = "ACTIVE" } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Enforce Seat Limit
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
    });
    const seatLimit = settings?.seatLimit || 10;
    const currentSeats = await prisma.tenantMembership.count({
      where: { tenantId, status: { in: ["ACTIVE", "INVITED"] } },
    });

    if (currentSeats >= seatLimit) {
      return NextResponse.json(
        {
          success: false,
          error: `Workspace seat limit reached (${currentSeats}/${seatLimit}). Please upgrade plan to add more members.`,
        },
        { status: 400 }
      );
    }

    // 2. Find or create user
    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      const passwordToHash = initialPassword || "Goodwin@2026!";
      const passwordHash = await hashPassword(passwordToHash);
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          fullName: fullName || cleanEmail.split("@")[0],
          phone: phone || null,
          passwordHash,
          isActive: true,
        },
      });
    } else if (phone || fullName) {
      // Update phone/name if missing
      await prisma.user.update({
        where: { id: user.id },
        data: {
          fullName: fullName || user.fullName,
          phone: phone || user.phone,
        },
      });
    }

    // 3. Check existing membership
    const existingMembership = await prisma.tenantMembership.findUnique({
      where: { tenantId_userId: { tenantId, userId: user.id } },
    });

    if (existingMembership) {
      return NextResponse.json(
        { success: false, error: "User is already a member of this workspace" },
        { status: 400 }
      );
    }

    // 4. Resolve roles
    const selectedRoleIds: string[] = [];
    if (roleId) selectedRoleIds.push(roleId);
    if (Array.isArray(roleIds)) {
      for (const rId of roleIds) {
        if (!selectedRoleIds.includes(rId)) selectedRoleIds.push(rId);
      }
    }

    if (selectedRoleIds.length === 0) {
      // Default to Sales Executive or Viewer
      const defaultRole = await prisma.role.findFirst({
        where: { tenantId, name: { in: ["Sales Executive", "Sales Rep", "Viewer"] } },
      });
      if (defaultRole) selectedRoleIds.push(defaultRole.id);
    }

    // 5. Create membership
    const membership = await prisma.tenantMembership.create({
      data: {
        tenantId,
        userId: user.id,
        status: status === "INVITED" ? "INVITED" : "ACTIVE",
        isOwner: false,
      },
    });

    // 6. Assign roles
    for (const rId of selectedRoleIds) {
      await prisma.membershipRole.create({
        data: {
          membershipId: membership.id,
          roleId: rId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Team member added successfully",
      data: {
        membershipId: membership.id,
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
        status: membership.status,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
