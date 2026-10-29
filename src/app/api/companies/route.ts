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
  const q = searchParams.get("q");
  const assignedOwnerId = searchParams.get("assignedOwnerId");

  const whereClause: any = { tenantId: tenantCtx.tenant.id };

  if (assignedOwnerId && assignedOwnerId !== "ALL") {
    whereClause.assignedOwnerId = assignedOwnerId === "me" ? tenantCtx.user.id : assignedOwnerId;
  }

  if (q) {
    whereClause.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { industry: { contains: q, mode: "insensitive" } },
    ];
  }

  const companies = await prisma.company.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      assignedOwner: { select: { id: true, fullName: true, email: true } },
      _count: { select: { contacts: true, deals: true } },
    },
  });

  return NextResponse.json({ success: true, data: companies });
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
    if (!tenantCtx.hasPermission("companies:write")) {
      return NextResponse.json({ success: false, error: "Forbidden: Missing companies:write permission" }, { status: 403 });
    }

    const tenantId = tenantCtx.tenant.id;
    const body = await req.json();
    const { name, industry, website, phone, email, address, city, state, country, assignedOwnerId } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: "Company name is required" }, { status: 400 });
    }

    const company = await prisma.company.create({
      data: {
        tenantId,
        name,
        industry: industry || null,
        website: website || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        city: city || null,
        state: state || null,
        country: country || "India",
        assignedOwnerId: assignedOwnerId || tenantCtx.user.id,
      },
    });

    return NextResponse.json({ success: true, data: company });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create company" },
      { status: 500 }
    );
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
    if (!tenantCtx.hasPermission("companies:delete") && !tenantCtx.hasPermission("companies:write")) {
      return NextResponse.json({ success: false, error: "Forbidden: Missing companies:delete permission" }, { status: 403 });
    }

    const tenantId = tenantCtx.tenant.id;
    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: "Valid array of company IDs required" }, { status: 400 });
    }

    await prisma.deal.updateMany({ where: { companyId: { in: ids }, tenantId }, data: { companyId: null } }).catch(() => {});
    await prisma.contact.updateMany({ where: { companyId: { in: ids }, tenantId }, data: { companyId: null } }).catch(() => {});

    const deleted = await prisma.company.deleteMany({
      where: {
        id: { in: ids },
        tenantId,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${deleted.count} companies`,
      deletedCount: deleted.count,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
