import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

export async function GET(req: Request) {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (tenantCtx.isClientUser) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const filterType = searchParams.get("type"); // "free" | "paid" | "all"
  const tenantId = tenantCtx.tenant.id;

  const whereClause: any = { tenantId };
  if (filterType === "free") {
    whereClause.unitPrice = 0;
  } else if (filterType === "paid") {
    whereClause.unitPrice = { gt: 0 };
  }

  const products = await prisma.product.findMany({
    where: whereClause,
    orderBy: [{ unitPrice: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(
    { success: true, data: products },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
  );
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
    if (!tenantCtx.hasPermission("products:write")) {
      return NextResponse.json({ success: false, error: "Forbidden: Missing products:write permission" }, { status: 403 });
    }

    const tenantId = tenantCtx.tenant.id;
    const body = await req.json();
    const { name, sku, description, unitPrice = 0, currency = "INR", isActive = true } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ success: false, error: "Product name is required" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        tenantId,
        name: name.trim(),
        sku: sku ? String(sku).trim() : null,
        description: description ? String(description).trim() : null,
        unitPrice: Number(unitPrice) || 0,
        currency: currency || "INR",
        isActive: Boolean(isActive),
      },
    });

    return NextResponse.json({ success: true, data: product });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (tenantCtx.isClientUser) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    if (!tenantCtx.hasPermission("products:write")) {
      return NextResponse.json({ success: false, error: "Forbidden: Missing products:write permission" }, { status: 403 });
    }

    const tenantId = tenantCtx.tenant.id;
    const body = await req.json();
    const { ids, isActive, unitPrice } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: "Valid array of product IDs required" }, { status: 400 });
    }

    const dataToUpdate: any = {};
    if (isActive !== undefined) dataToUpdate.isActive = Boolean(isActive);
    if (unitPrice !== undefined) dataToUpdate.unitPrice = Number(unitPrice);

    await prisma.product.updateMany({
      where: {
        id: { in: ids },
        tenantId,
      },
      data: dataToUpdate,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${ids.length} products`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (tenantCtx.isClientUser) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    if (!tenantCtx.hasPermission("products:delete") && !tenantCtx.hasPermission("products:write")) {
      return NextResponse.json({ success: false, error: "Forbidden: Missing products:delete permission" }, { status: 403 });
    }

    const tenantId = tenantCtx.tenant.id;
    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: "Valid array of product IDs required" }, { status: 400 });
    }

    const deleted = await prisma.product.deleteMany({
      where: {
        id: { in: ids },
        tenantId,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deleted.count} products`,
      deletedCount: deleted.count,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
