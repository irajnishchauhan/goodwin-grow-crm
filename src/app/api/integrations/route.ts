import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

export async function GET() {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = tenantCtx.tenant.id;
  const settings = await prisma.tenantSettings.findUnique({
    where: { tenantId },
    select: { integrations: true },
  });

  return NextResponse.json({
    success: true,
    data: (settings?.integrations as any[]) || [],
  });
}

export async function POST(req: Request) {
  try {
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (tenantCtx.isClientUser) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const tenantId = tenantCtx.tenant.id;
    const body = await req.json();
    const { integrations } = body;

    if (!Array.isArray(integrations)) {
      return NextResponse.json({ success: false, error: "Integrations must be an array" }, { status: 400 });
    }

    await prisma.tenantSettings.upsert({
      where: { tenantId },
      update: { integrations },
      create: {
        tenantId,
        currency: "INR",
        timezone: "Asia/Kolkata",
        seatLimit: 10,
        integrations,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Integrations configuration synchronized to workspace database.",
      data: integrations,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

