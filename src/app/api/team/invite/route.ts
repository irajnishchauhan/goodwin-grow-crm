import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";
import { hashPassword } from "@/lib/auth/password";

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

export async function POST(req: Request) {
  try {
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (tenantCtx.isClientUser) {
      return NextResponse.json({ success: false, error: "Forbidden: Client users cannot invite team members" }, { status: 403 });
    }

    if (!canManageTeam(tenantCtx)) {
      return NextResponse.json({ success: false, error: "Forbidden: Missing team:write or team:manage permission" }, { status: 403 });
    }

    const tenantId = tenantCtx.tenant.id;
    const body = await req.json();
    const { email, roleName = "Sales Executive", fullName, password } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    // 1. Enforce Seat Limits
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
          error: `Seat limit reached (${currentSeats}/${seatLimit}). Please upgrade your subscription plan to invite more team members.`,
        },
        { status: 400 }
      );
    }

    // 2. Resolve Role
    let role = await prisma.role.findFirst({
      where: { tenantId, name: roleName },
    });

    if (!role) {
      role = await prisma.role.findFirst({
        where: { tenantId, name: "Sales Executive" },
      });
    }

    if (!role) {
      return NextResponse.json({ success: false, error: "Invalid role specified" }, { status: 400 });
    }

    // 3. Find or create user
    const cleanEmail = email.toLowerCase().trim();
    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      const passwordToHash = password || crypto.randomBytes(16).toString("hex");
      const placeholderHash = await hashPassword(passwordToHash);
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          fullName: fullName || cleanEmail.split("@")[0],
          passwordHash: placeholderHash,
          isActive: true,
        },
      });
    } else if (password || fullName) {
      const updateData: any = {};
      if (fullName) updateData.fullName = fullName;
      if (password) updateData.passwordHash = await hashPassword(password);
      user = await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });
    }

    // 4. Check if already a member
    const existingMembership = await prisma.tenantMembership.findUnique({
      where: { tenantId_userId: { tenantId, userId: user.id } },
    });

    if (existingMembership) {
      return NextResponse.json(
        { success: false, error: "User is already a member of this workspace" },
        { status: 400 }
      );
    }

    // 5. Create Membership (INVITED) and Invitation token
    const membership = await prisma.tenantMembership.create({
      data: {
        tenantId,
        userId: user.id,
        isOwner: false,
        status: "INVITED",
      },
    });

    await prisma.membershipRole.create({
      data: {
        membershipId: membership.id,
        roleId: role.id,
      },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 3); // 72 hours

    const invitation = await prisma.invitation.create({
      data: {
        tenantId,
        email: cleanEmail,
        roleId: role.id,
        token,
        invitedById: tenantCtx.user.id,
        expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Invitation generated for ${cleanEmail}`,
      data: {
        invitationToken: token,
        inviteUrl: `/activate?token=${token}`,
        email: cleanEmail,
        role: role.name,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
