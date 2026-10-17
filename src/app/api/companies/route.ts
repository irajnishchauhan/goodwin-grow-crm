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
