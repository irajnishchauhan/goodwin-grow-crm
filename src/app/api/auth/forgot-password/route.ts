import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { sendEmail, generatePasswordResetEmailHtml } from "@/lib/email/sender";

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

    const origin = req.headers.get("origin") || req.headers.get("host") || "https://goodwin-grow-crm-sigma.vercel.app";
    const fullOrigin = origin.startsWith("http") ? origin : `https://${origin}`;
    const resetUrl = `${fullOrigin}/forgot-password?token=${token}`;

    await sendEmail({
      to: cleanEmail,
      subject: "Reset your Goodwin CRM Password",
      html: generatePasswordResetEmailHtml(user.fullName, resetUrl),
    }).catch((err) => console.error("Error sending reset email:", err));

    return NextResponse.json({
      success: true,
      message: `Password reset link sent to ${cleanEmail}. Check your inbox or use the link below.`,
      resetUrl: `/forgot-password?token=${token}`,
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
