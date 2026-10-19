import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { getTenantContext } from "@/lib/tenant/context";

export async function GET() {
  const session = await getCurrentSession();

  if (!session || !session.user) {
    return NextResponse.json(
      { success: false, data: null, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const tenantCtx = await getTenantContext();

  let memberships = session.user.memberships.map((m: any) => ({
    tenantId: m.tenantId,
    tenantName: m.tenant?.name || "",
    tenantCode: m.tenant?.code || "",
    isOwner: m.isOwner,
  }));

  if (session.user.isPlatformAdmin) {
    const allTenants = await prisma.tenant.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    });
    memberships = allTenants.map((t) => ({
      tenantId: t.id,
      tenantName: t.name,
      tenantCode: t.code,
      isOwner: true,
    }));
  }

  return NextResponse.json({
    success: true,
    data: {
      user: {
        id: session.user.id,
        email: session.user.email,
        fullName: session.user.fullName,
        isPlatformAdmin: session.user.isPlatformAdmin,
      },
      activeTenant: tenantCtx ? tenantCtx.tenant : null,
      roles: tenantCtx ? tenantCtx.roles : [],
      permissions: tenantCtx ? tenantCtx.permissions : [],
      memberships,
    },
  });
}
