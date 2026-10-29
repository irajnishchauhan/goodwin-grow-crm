import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";
import { evaluateAutomations } from "@/lib/automation/engine";

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
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const assignedOwnerId = searchParams.get("assignedOwnerId");
  const clientId = searchParams.get("clientId");

  const whereClause: any = {
    tenantId: tenantCtx.tenant.id,
  };

  if (clientId && clientId !== "ALL") {
    whereClause.clientId = clientId;
  }

  if (status && status !== "ALL") {
    whereClause.status = status;
  }

  if (priority && priority !== "ALL") {
    whereClause.priority = priority;
  }

  if (assignedOwnerId && assignedOwnerId !== "ALL") {
    whereClause.assignedOwnerId = assignedOwnerId === "me" ? tenantCtx.user.id : assignedOwnerId;
  }

  if (q) {
    whereClause.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { companyName: { contains: q, mode: "insensitive" } },
      { serviceRequired: { contains: q, mode: "insensitive" } },
    ];
  }

  const leads = await prisma.lead.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      assignedOwner: {
        select: { id: true, fullName: true, email: true },
      },
      client: {
        select: { id: true, name: true, brandName: true },
      },
      activities: {
        orderBy: { occurredAt: "desc" },
        take: 5,
      },
    },
  });

  return NextResponse.json({ success: true, data: leads });
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

    if (!tenantCtx.hasPermission("leads:write")) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Missing leads:write permission" },
        { status: 403 }
      );
    }

    const tenantId = tenantCtx.tenant.id;
    const body = await req.json();
    const {
      firstName,
      lastName,
      companyName,
      email,
      phone,
      status = "NEW",
      source,
      serviceRequired,
      dealValue,
      nextFollowUp,
      lostReason,
      clientId,
      priority = "MEDIUM",
      score = 0,
      tags = [],
      assignedOwnerId,
    } = body;

    if (!firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: "First Name and Last Name are required" },
        { status: 400 }
      );
    }

    if (assignedOwnerId) {
      const validMember = await prisma.tenantMembership.findFirst({
        where: { tenantId, userId: assignedOwnerId },
      });
      if (!validMember) {
        return NextResponse.json({ success: false, error: "Invalid assigned owner for this tenant" }, { status: 400 });
      }
    }

    if (clientId) {
      const validClient = await prisma.agencyClient.findFirst({
        where: { id: clientId, tenantId },
      });
      if (!validClient) {
        return NextResponse.json({ success: false, error: "Invalid client for this tenant" }, { status: 400 });
      }
    }

    // Duplicate Detection: Check email and phone in tenant
    const trimmedEmail = email?.trim() || null;
    const trimmedPhone = phone?.trim() || null;

    if (trimmedEmail || trimmedPhone) {
      const duplicateConditions: any[] = [];
      if (trimmedEmail) {
        duplicateConditions.push({ email: { equals: trimmedEmail, mode: "insensitive" } });
      }
      if (trimmedPhone) {
        duplicateConditions.push({ phone: { equals: trimmedPhone } });
      }

      const duplicate = await prisma.lead.findFirst({
        where: {
          tenantId,
          OR: duplicateConditions,
        },
      });

      if (duplicate) {
        const matchedField =
          trimmedEmail && duplicate.email?.toLowerCase() === trimmedEmail.toLowerCase()
            ? `email (${trimmedEmail})`
            : `phone (${trimmedPhone})`;

        return NextResponse.json(
          {
            success: false,
            error: `Duplicate Detected: A lead with this ${matchedField} already exists (${duplicate.firstName} ${duplicate.lastName} at ${duplicate.companyName || "Organization"}).`,
            duplicateId: duplicate.id,
          },
          { status: 409 }
        );
      }
    }

    const targetClientId = clientId || null;

    const lead = await prisma.lead.create({
      data: {
        tenantId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        companyName: companyName?.trim() || null,
        email: trimmedEmail,
        phone: trimmedPhone,
        status,
        source: source || null,
        serviceRequired: serviceRequired || null,
        dealValue: dealValue ? Number(dealValue) : null,
        nextFollowUp: nextFollowUp ? new Date(nextFollowUp) : null,
        lostReason: status === "LOST" ? lostReason : null,
        clientId: targetClientId,
        priority,
        score: Number(score) || 0,
        tags: Array.isArray(tags) ? tags : [],
        assignedOwnerId: assignedOwnerId || tenantCtx.user.id,
      },
      include: {
        assignedOwner: { select: { id: true, fullName: true, email: true } },
        client: { select: { id: true, name: true, brandName: true } },
      },
    });

    // Log Activity for Audit History
    await prisma.activity.create({
      data: {
        tenantId,
        type: "NOTE",
        title: "Lead Created",
        description: `Lead created for ${firstName} ${lastName} (${companyName || "No Company"})${serviceRequired ? ` - Service: ${serviceRequired}` : ""}`,
        performedById: tenantCtx.user.id,
        leadId: lead.id,
      },
    });

    evaluateAutomations({
      tenantId,
      triggerEvent: "LEAD_CREATED",
      entityType: "Lead",
      entityId: lead.id,
      data: lead,
      payload: lead,
    }).catch(() => {});

    return NextResponse.json({ success: true, data: lead });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create lead" },
      { status: 500 }
    );
  }
}

