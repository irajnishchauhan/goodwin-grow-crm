import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { ensureDatabaseSchema, ensureRubricPersonas } from "@/lib/db/auto-migrate";

export async function POST(req: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          success: false,
          error: "DATABASE_URL is not configured on Vercel. Please add your PostgreSQL connection string (from Supabase or Neon) in Vercel Project Settings > Environment Variables.",
        },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { email, password, targetTenantId } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Proactively ensure database schema is up-to-date with rubric columns
    await ensureDatabaseSchema();

    const normalizedEmail = email.toLowerCase().trim();

    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        memberships: {
          where: { status: "ACTIVE" },
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                code: true,
                status: true,
              },
            },
          },
        },
      },
    });

    // Auto-seed rubric personas if logging in with official demo personas
    if (
      !user &&
      (normalizedEmail.includes("goodwingrowai.com") ||
        normalizedEmail.includes("sapnawashing.in") ||
        normalizedEmail.includes("ambafurnishing.com"))
    ) {
      await ensureRubricPersonas();
      user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: {
          memberships: {
            where: { status: "ACTIVE" },
            include: {
              tenant: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  status: true,
                },
              },
            },
          },
        },
      });
    }

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Determine initial active tenant
    let resolvedTenantId: string | null = targetTenantId ?? null;

    if (resolvedTenantId && !user.isPlatformAdmin) {
      const hasMembership = user.memberships.some((m: any) => m.tenantId === resolvedTenantId);
      if (!hasMembership) {
        resolvedTenantId = user.memberships[0]?.tenantId ?? null;
      }
    }

    if (!resolvedTenantId) {
      if (user.memberships.length >= 1) {
        resolvedTenantId = user.memberships[0].tenantId;
      } else if (user.isPlatformAdmin) {
        const primaryTenant = await prisma.tenant.findFirst({
          where: { status: "ACTIVE" },
          orderBy: [{ code: "asc" }],
        });
        if (primaryTenant) {
          resolvedTenantId = primaryTenant.id;
        }
      }
    }

    const session = await createSession(
      user.id,
      resolvedTenantId,
      req.headers.get("user-agent") ?? undefined,
      req.headers.get("x-forwarded-for") ?? undefined
    );

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // Record login audit
    await prisma.auditLog.create({
      data: {
        tenantId: resolvedTenantId,
        userId: user.id,
        action: "USER_LOGIN",
        entityType: "User",
        entityId: user.id,
        ipAddress: req.headers.get("x-forwarded-for") ?? "127.0.0.1",
        userAgent: req.headers.get("user-agent"),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          isPlatformAdmin: user.isPlatformAdmin,
        },
        memberships: user.memberships.map((m: any) => ({
          tenantId: m.tenantId,
          tenantName: m.tenant?.name || "",
          tenantCode: m.tenant?.code || "",
          isOwner: m.isOwner,
        })),
        activeTenantId: resolvedTenantId,
        redirectTo: "/app/dashboard",
      },
    });
  } catch (err: any) {
    console.error("Login Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Authentication failed" },
      { status: 500 }
    );
  }
}
