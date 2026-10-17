import { NextResponse } from "next/server";
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
      memberships: session.user.memberships.map((m) => ({
        tenantId: m.tenantId,
        tenantName: m.tenant.name,
        tenantCode: m.tenant.code,
        isOwner: m.isOwner,
      })),
    },
  });
}
