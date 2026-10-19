import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const expense = await prisma.agencyExpense.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
      include: { client: true },
    });

    if (!expense) {
      return NextResponse.json({ success: false, error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: expense });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.agencyExpense.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Expense not found" }, { status: 404 });
    }

    const body = await req.json();
    const { category, description, amount, date, isBillable, clientId } = body;

    const updated = await prisma.agencyExpense.update({
      where: { id },
      data: {
        category: category !== undefined ? category : existing.category,
        description: description !== undefined ? description : existing.description,
        amount: amount !== undefined ? amount : existing.amount,
        date: date !== undefined ? new Date(date) : existing.date,
        isBillable: isBillable !== undefined ? Boolean(isBillable) : existing.isBillable,
        clientId: clientId !== undefined ? (clientId || null) : existing.clientId,
      },
      include: { client: true },
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

    const existing = await prisma.agencyExpense.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Expense not found" }, { status: 404 });
    }

    await prisma.agencyExpense.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Expense deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
