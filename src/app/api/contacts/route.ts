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
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const contacts = await prisma.contact.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      company: { select: { id: true, name: true } },
      assignedOwner: { select: { id: true, fullName: true, email: true } },
      _count: { select: { deals: true, tasks: true, activities: true } },
    },
  });

  return NextResponse.json({ success: true, data: contacts });
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
    if (!tenantCtx.hasPermission("contacts:write")) {
      return NextResponse.json({ success: false, error: "Forbidden: Missing contacts:write permission" }, { status: 403 });
    }

    const tenantId = tenantCtx.tenant.id;
    const body = await req.json();
    const {
      firstName,
      lastName,
      companyId,
      email,
      phone,
      jobTitle,
      source,
      tags = [],
      assignedOwnerId,
    } = body;

    if (!firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: "First Name and Last Name are required" },
        { status: 400 }
      );
    }

    if (companyId) {
      const validCompany = await prisma.company.findFirst({ where: { id: companyId, tenantId } });
      if (!validCompany) {
        return NextResponse.json({ success: false, error: "Invalid company for this tenant" }, { status: 400 });
      }
    }

    const contact = await prisma.contact.create({
      data: {
        tenantId,
        firstName,
        lastName,
        companyId: companyId || null,
        email: email || null,
        phone: phone || null,
        jobTitle: jobTitle || null,
        source: source || null,
        tags: Array.isArray(tags) ? tags : [],
        assignedOwnerId: assignedOwnerId || tenantCtx.user.id,
      },
    });

    return NextResponse.json({ success: true, data: contact });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create contact" },
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
    if (!tenantCtx.hasPermission("contacts:delete") && !tenantCtx.hasPermission("contacts:write")) {
      return NextResponse.json({ success: false, error: "Forbidden: Missing contacts:delete permission" }, { status: 403 });
    }

    const tenantId = tenantCtx.tenant.id;
    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: "Valid array of contact IDs required" }, { status: 400 });
    }

    await prisma.activity.deleteMany({ where: { contactId: { in: ids }, tenantId } }).catch(() => {});
    await prisma.note.deleteMany({ where: { contactId: { in: ids }, tenantId } }).catch(() => {});

    const deleted = await prisma.contact.deleteMany({
      where: {
        id: { in: ids },
        tenantId,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${deleted.count} contacts`,
      deletedCount: deleted.count,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
