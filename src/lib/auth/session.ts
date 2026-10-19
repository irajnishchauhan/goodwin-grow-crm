import crypto from "crypto";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export const SESSION_COOKIE_NAME = "gg_crm_session";
export const SESSION_DURATION_DAYS = 30;

export async function createSession(
  userId: string,
  activeTenantId?: string | null,
  userAgent?: string,
  ipAddress?: string
) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  const session = await prisma.session.create({
    data: {
      userId,
      activeTenantId: activeTenantId ?? null,
      token,
      expiresAt,
      userAgent: userAgent ?? null,
      ipAddress: ipAddress ?? null,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          isPlatformAdmin: true,
          isActive: true,
        },
      },
    },
  });

  return session;
}

export async function getSessionByToken(token: string) {
  if (!token || !process.env.DATABASE_URL) return null;

  try {
    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
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
                roles: {
                  include: {
                    role: {
                      include: {
                        permissions: {
                          include: {
                            permission: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!session) return null;
    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { token } }).catch(() => {});
      return null;
    }
    if (!session.user.isActive) {
      return null;
    }

    return session;
  } catch (error) {
    console.error("Session verification error (database unavailable):", error);
    return null;
  }
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return getSessionByToken(token);
}

export async function destroySession(token: string) {
  try {
    await prisma.session.delete({ where: { token } });
  } catch {
    // Already deleted or invalid
  }
}

export async function updateSessionActiveTenant(token: string, newTenantId: string) {
  return prisma.session.update({
    where: { token },
    data: { activeTenantId: newTenantId },
  });
}
