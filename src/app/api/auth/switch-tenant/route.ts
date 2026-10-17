import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { switchActiveTenant } from "@/lib/tenant/context";

export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { tenantId } = await req.json();
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "tenantId is required" },
        { status: 400 }
      );
    }

    await switchActiveTenant(session.user.id, tenantId, session.token);

    return NextResponse.json({
      success: true,
      message: "Workspace switched successfully",
      activeTenantId: tenantId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to switch workspace" },
      { status: 400 }
    );
  }
}
