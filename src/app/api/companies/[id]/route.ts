import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (tenantCtx.isClientUser) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const company = await prisma.company.findFirst({
    where: { id, tenantId: tenantCtx.tenant.id },
    include: {
      assignedOwner: { select: { id: true, fullName: true, email: true } },
      contacts: {
        orderBy: { createdAt: "desc" },
      },
      deals: {
        include: { stage: true },
        orderBy: { createdAt: "desc" },
      },
      quotations: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!company) {
    return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: company });
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
    if (tenantCtx.isClientUser) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    if (!tenantCtx.hasPermission("companies:write")) {
      return NextResponse.json({ success: false, error: "Forbidden: Missing companies:write permission" }, { status: 403 });
    }

    const company = await prisma.company.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
    });

    if (!company) {
      return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, industry, website, phone, email, address, city, state, country, assignedOwnerId } = body;

    const updated = await prisma.company.update({
      where: { id: company.id },
      data: {
        name: name ?? company.name,
        industry: industry !== undefined ? industry : company.industry,
        website: website !== undefined ? website : company.website,
        phone: phone !== undefined ? phone : company.phone,
        email: email !== undefined ? email : company.email,
        address: address !== undefined ? address : company.address,
        city: city !== undefined ? city : company.city,
        state: state !== undefined ? state : company.state,
        country: country !== undefined ? country : company.country,
        assignedOwnerId: assignedOwnerId !== undefined ? assignedOwnerId : company.assignedOwnerId,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export const PATCH = PUT;

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
    if (tenantCtx.isClientUser) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    if (!tenantCtx.hasPermission("companies:delete")) {
      return NextResponse.json({ success: false, error: "Forbidden: Missing companies:delete permission" }, { status: 403 });
    }

    const company = await prisma.company.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
    });

    if (!company) {
      return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
    }

    await prisma.company.delete({ where: { id: company.id } });

    return NextResponse.json({ success: true, message: "Company deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
