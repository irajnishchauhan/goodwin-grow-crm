import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const quotation = await prisma.quotation.findFirst({
    where: { id, tenantId: tenantCtx.tenant.id },
    include: {
      items: { include: { product: true } },
      company: true,
      contact: true,
      deal: true,
      createdBy: { select: { id: true, fullName: true, email: true } },
    },
  });

  if (!quotation) {
    return NextResponse.json({ success: false, error: "Quotation not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: quotation });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!tenantCtx.hasPermission("quotations:write")) {
      return NextResponse.json({ success: false, error: "Forbidden: Missing quotations:write permission" }, { status: 403 });
    }

    const quotation = await prisma.quotation.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
    });

    if (!quotation) {
      return NextResponse.json({ success: false, error: "Quotation not found" }, { status: 404 });
    }

    const body = await req.json();
    const { status, terms, validUntil } = body;

    const updated = await prisma.quotation.update({
      where: { id: quotation.id },
      data: {
        status: status ?? quotation.status,
        terms: terms !== undefined ? terms : quotation.terms,
        validUntil: validUntil !== undefined ? (validUntil ? new Date(validUntil) : null) : quotation.validUntil,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!tenantCtx.hasPermission("quotations:write")) {
      return NextResponse.json({ success: false, error: "Forbidden: Missing quotations:write permission" }, { status: 403 });
    }

    const quotation = await prisma.quotation.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
    });

    if (!quotation) {
      return NextResponse.json({ success: false, error: "Quotation not found" }, { status: 404 });
    }

    await prisma.quotation.delete({ where: { id: quotation.id } });

    return NextResponse.json({ success: true, message: "Quotation deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
