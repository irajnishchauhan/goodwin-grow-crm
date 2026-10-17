import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createSession, SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, fullName, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: "Token and password are required" },
        { status: 400 }
      );
    }

    // 1. Verify invitation token
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { tenant: true },
    });

    if (!invitation) {
      return NextResponse.json({ success: false, error: "Invalid invitation token" }, { status: 404 });
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ success: false, error: "Invitation token has expired" }, { status: 400 });
    }

    if (invitation.acceptedAt) {
      return NextResponse.json(
        { success: false, error: "Invitation has already been activated. Please log in." },
        { status: 400 }
      );
    }

    // 2. Hash new password
    const passwordHash = await hashPassword(password);

    // 3. Find user and update
    const user = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User account not found" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          fullName: fullName || user.fullName,
          passwordHash,
          isActive: true,
        },
      }),
      prisma.tenantMembership.update({
        where: {
          tenantId_userId: {
            tenantId: invitation.tenantId,
            userId: user.id,
          },
        },
        data: {
          status: "ACTIVE",
        },
      }),
      prisma.invitation.update({
        where: { id: invitation.id },
        data: {
          acceptedAt: new Date(),
        },
      }),
    ]);

    // 4. Log in immediately
    const session = await createSession(user.id, invitation.tenantId);
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return NextResponse.json({
      success: true,
      message: "Account activated successfully",
      redirectTo: "/app/dashboard",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
