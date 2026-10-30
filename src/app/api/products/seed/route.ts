import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";
import { GOODWIN_GROW_AI_CATALOG } from "@/lib/constants/market-catalog";
import { GOODWIN_BATTERIES_CATALOG } from "@/lib/constants/battery-catalog";

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
    const isBattery = tenantCtx.tenant.code?.toLowerCase().includes("battery");
    let seededCount = 0;

    if (isBattery) {
      // Seed Goodwin Batteries Official SKUs
      for (const item of GOODWIN_BATTERIES_CATALOG) {
        const fullDesc = `[${item.category}] [PAID] Scope: ${item.warrantyMonths}-Month Warranty | High Duty Cycle. ${item.description}`;
        const existing = await prisma.product.findFirst({
          where: { tenantId, sku: item.sku },
        });

        if (existing) {
          await prisma.product.update({
            where: { id: existing.id },
            data: {
              name: item.name,
              description: fullDesc,
              unitPrice: item.unitPrice,
              currency: "INR",
              isActive: true,
            },
          });
        } else {
          await prisma.product.create({
            data: {
              tenantId,
              name: item.name,
              sku: item.sku,
              description: fullDesc,
              unitPrice: item.unitPrice,
              currency: "INR",
              isActive: true,
            },
          });
        }
        seededCount++;
      }
    } else {
      // Remove old preliminary demo SKUs that were superseded by official 2026 catalogue
      const officialSkus = GOODWIN_GROW_AI_CATALOG.map((i) => i.sku);
      await prisma.product.deleteMany({
        where: {
          tenantId,
          sku: { notIn: officialSkus, startsWith: "GGA-" },
        },
      }).catch(() => {});

      for (const item of GOODWIN_GROW_AI_CATALOG) {
        const fullDescription = `[${item.category}] [${item.status}] Scope: ${item.scope} | 2026 Market Range: ${item.marketRange}. ${item.description}`;
        const existing = await prisma.product.findFirst({
          where: { tenantId, sku: item.sku },
        });

        if (existing) {
          await prisma.product.update({
            where: { id: existing.id },
            data: {
              name: item.name,
              description: fullDescription,
              unitPrice: item.goodwinPrice,
              currency: "INR",
              isActive: true,
            },
          });
        } else {
          await prisma.product.create({
            data: {
              tenantId,
              name: item.name,
              sku: item.sku,
              description: fullDescription,
              unitPrice: item.goodwinPrice,
              currency: "INR",
              isActive: true,
            },
          });
        }
        seededCount++;
      }
    }

    const products = await prisma.product.findMany({
      where: { tenantId },
      orderBy: [{ unitPrice: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({
      success: true,
      message: isBattery
        ? `Successfully synchronized ${seededCount} commercial battery SKUs into your catalog!`
        : `Successfully loaded ${seededCount} market-standard products and services into your catalog!`,
      data: products,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
