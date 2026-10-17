import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

export async function GET() {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    where: { tenantId: tenantCtx.tenant.id },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ success: true, data: products });
}

export async function POST(req: Request) {
  try {
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = tenantCtx.tenant.id;
    const body = await req.json();
    const { name, sku, description, unitPrice = 0, currency = "INR" } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: "Product name is required" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        tenantId,
        name,
        sku: sku || null,
        description: description || null,
        unitPrice: Number(unitPrice) || 0,
        currency,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, data: product });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
