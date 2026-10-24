import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = tenantCtx.tenant.id;

  try {
    const body = await req.json();
    const { date, title, tag, desc } = body;

    const existing: any[] = await prisma.$queryRawUnsafe(
      `SELECT "id" FROM "marketing_festivals" WHERE "id" = $1 AND "tenant_id" = $2`,
      id,
      tenantId
    );

    if (existing.length === 0) {
      return NextResponse.json({ success: false, error: "Festival event not found" }, { status: 404 });
    }

    await prisma.$executeRawUnsafe(
      `UPDATE "marketing_festivals"
       SET "date" = COALESCE($1, "date"),
           "title" = COALESCE($2, "title"),
           "tag" = COALESCE($3, "tag"),
           "desc" = COALESCE($4, "desc"),
           "updated_at" = NOW()
       WHERE "id" = $5 AND "tenant_id" = $6`,
      date ?? null,
      title ?? null,
      tag ?? null,
      desc ?? null,
      id,
      tenantId
    );

    const updated: any[] = await prisma.$queryRawUnsafe(
      `SELECT "id", "date", "title", "tag", "desc", "created_at" as "createdAt", "updated_at" as "updatedAt"
       FROM "marketing_festivals"
       WHERE "id" = $1 AND "tenant_id" = $2`,
      id,
      tenantId
    );

    return NextResponse.json({
      success: true,
      message: "Festival event updated successfully",
      data: updated[0],
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = tenantCtx.tenant.id;

  try {
    const existing: any[] = await prisma.$queryRawUnsafe(
      `SELECT "id" FROM "marketing_festivals" WHERE "id" = $1 AND "tenant_id" = $2`,
      id,
      tenantId
    );

    if (existing.length === 0) {
      return NextResponse.json({ success: false, error: "Festival event not found" }, { status: 404 });
    }

    await prisma.$executeRawUnsafe(
      `DELETE FROM "marketing_festivals" WHERE "id" = $1 AND "tenant_id" = $2`,
      id,
      tenantId
    );

    return NextResponse.json({
      success: true,
      message: "Festival event deleted successfully from calendar",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
