import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

export async function GET(req: Request) {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  const whereClause: any = { tenantId: tenantCtx.tenant.id };
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
