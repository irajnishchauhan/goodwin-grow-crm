import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Missing reset token." },
        { status: 400 }
      );
    }

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetRecord) {
      return NextResponse.json(
        { success: false, error: "Invalid or already used password reset link." },
        { status: 404 }
      );
    }

    if (resetRecord.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { token } }).catch(() => {});
      return NextResponse.json(
        { success: false, error: "This password reset link has expired. Please request a new one." },
        { status: 410 }
      );
    }

    return NextResponse.json({
      success: true,
      email: resetRecord.email,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to verify reset token." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: "Token and new password are required." },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetRecord) {
      return NextResponse.json(
        { success: false, error: "Invalid or already used password reset link." },
        { status: 404 }
      );
    }

    if (resetRecord.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { token } }).catch(() => {});
      return NextResponse.json(
        { success: false, error: "This password reset link has expired. Please request a new one." },
        { status: 410 }
      );
    }

    // Hash password and update user
    const passwordHash = await hashPassword(password);
    await prisma.user.update({
      where: { email: resetRecord.email },
      data: { passwordHash, isActive: true },
    });

    // Delete used reset token
    await prisma.passwordResetToken.delete({
      where: { token },
    }).catch(() => {});

    // Invalidate active sessions to enforce fresh login with new credentials
    const user = await prisma.user.findUnique({
      where: { email: resetRecord.email },
      select: { id: true },
    });
    if (user) {
      await prisma.session.deleteMany({
        where: { userId: user.id },
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: "Your password has been successfully updated. You can now log in.",
    });
  } catch (err: any) {
    console.error("Reset password error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update password." },
      { status: 500 }
    );
  }
}
