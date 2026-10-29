import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";
import { GOODWIN_GROW_AI_CATALOG } from "@/lib/constants/market-catalog";

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
    let seededCount = 0;

    for (const item of GOODWIN_GROW_AI_CATALOG) {
      const existing = await prisma.product.findFirst({
        where: { tenantId, sku: item.sku },
      });

      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            name: item.name,
            description: item.description,
            unitPrice: item.unitPrice,
            currency: item.currency,
            isActive: true,
          },
        });
      } else {
        await prisma.product.create({
          data: {
            tenantId,
            name: item.name,
            sku: item.sku,
            description: item.description,
            unitPrice: item.unitPrice,
            currency: item.currency,
            isActive: true,
          },
        });
      }
      seededCount++;
    }

    const products = await prisma.product.findMany({
      where: { tenantId },
      orderBy: [{ unitPrice: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({
      success: true,
      message: `Successfully loaded ${seededCount} market-standard products and services into your catalog!`,
      data: products,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

