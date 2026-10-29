import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { switchActiveTenant } from "@/lib/tenant/context";

export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Please log in to switch workspaces" },
        { status: 401 }
      );
    }

    const body = await req.json();
    let targetTenantId = body.tenantId;

    if (!targetTenantId && body.code) {
      const tenant = await prisma.tenant.findUnique({
        where: { code: body.code.toLowerCase().trim() },
        select: { id: true },
      });
      if (tenant) {
        targetTenantId = tenant.id;
      }
    }

    if (!targetTenantId) {
      return NextResponse.json(
        { success: false, error: "Valid tenantId or code is required" },
        { status: 400 }
      );
    }

    const result = await switchActiveTenant(session.user.id, targetTenantId, session.token);

    const response = NextResponse.json({
      success: true,
      message: `Switched to workspace: ${result.tenantName}`,
      data: {
        activeTenantId: targetTenantId,
        tenantName: result.tenantName,
        tenantCode: result.tenantCode,
      },
    });

    response.cookies.set("gg_crm_active_tenant", targetTenantId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to switch workspace" },
      { status: 400 }
    );
  }
}

