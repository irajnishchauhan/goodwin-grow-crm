import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Please provide a valid work email address." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: { id: true, email: true, fullName: true, isActive: true },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "No account found with this work email. Please check the spelling or contact your workspace administrator.",
        },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: "This account has been deactivated. Please contact your workspace administrator.",
        },
        { status: 403 }
      );
    }

    // Clean up any existing tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email: cleanEmail },
    }).catch(() => {});

    // Generate secure random token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity

    await prisma.passwordResetToken.create({
      data: {
        email: cleanEmail,
        token,
        expiresAt,
      },
    });

    const resetUrl = `/forgot-password?token=${token}`;

    return NextResponse.json({
      success: true,
      message: `Password reset request authorized for ${user.fullName}. Use the link below to set your new password.`,
      resetUrl,
      email: cleanEmail,
    });
  } catch (err: any) {
    console.error("Forgot password error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process password reset request." },
      { status: 500 }
    );
  }
}
