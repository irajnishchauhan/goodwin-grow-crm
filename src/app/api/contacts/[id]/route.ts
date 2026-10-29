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

  const contact = await prisma.contact.findFirst({
    where: { id, tenantId: tenantCtx.tenant.id },
    include: {
      company: true,
      assignedOwner: { select: { id: true, fullName: true, email: true } },
      deals: {
        include: { stage: true },
        orderBy: { createdAt: "desc" },
      },
      tasks: {
        orderBy: { dueDate: "asc" },
      },
      activities: {
        orderBy: { occurredAt: "desc" },
        include: { performedBy: { select: { fullName: true } } },
      },
      notes: {
        orderBy: { createdAt: "desc" },
        include: { createdBy: { select: { fullName: true } } },
      },
    },
  });

  if (!contact) {
    return NextResponse.json({ success: false, error: "Contact not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: contact });
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
    if (!tenantCtx.hasPermission("contacts:write")) {
      return NextResponse.json({ success: false, error: "Forbidden: Missing contacts:write permission" }, { status: 403 });
    }

    const tenantId = tenantCtx.tenant.id;
    const contact = await prisma.contact.findFirst({
      where: { id, tenantId },
    });

    if (!contact) {
      return NextResponse.json({ success: false, error: "Contact not found" }, { status: 404 });
    }

    const body = await req.json();
    const { firstName, lastName, companyId, email, phone, jobTitle, source, tags, assignedOwnerId } = body;

    if (companyId) {
      const validCompany = await prisma.company.findFirst({ where: { id: companyId, tenantId } });
      if (!validCompany) {
        return NextResponse.json({ success: false, error: "Invalid company for this tenant" }, { status: 400 });
      }
    }

    const updated = await prisma.contact.update({
      where: { id: contact.id },
      data: {
        firstName: firstName ?? contact.firstName,
        lastName: lastName ?? contact.lastName,
        companyId: companyId !== undefined ? companyId : contact.companyId,
        email: email !== undefined ? email : contact.email,
        phone: phone !== undefined ? phone : contact.phone,
        jobTitle: jobTitle !== undefined ? jobTitle : contact.jobTitle,
        source: source !== undefined ? source : contact.source,
        tags: Array.isArray(tags) ? tags : contact.tags,
        assignedOwnerId: assignedOwnerId !== undefined ? assignedOwnerId : contact.assignedOwnerId,
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
    if (!tenantCtx.hasPermission("contacts:delete")) {
      return NextResponse.json({ success: false, error: "Forbidden: Missing contacts:delete permission" }, { status: 403 });
    }

    const contact = await prisma.contact.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
    });

    if (!contact) {
      return NextResponse.json({ success: false, error: "Contact not found" }, { status: 404 });
    }

    await prisma.contact.delete({ where: { id: contact.id } });

    return NextResponse.json({ success: true, message: "Contact deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
