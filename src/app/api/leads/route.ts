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
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const assignedOwnerId = searchParams.get("assignedOwnerId");
  const clientId = searchParams.get("clientId");

  // Client Isolation: One client must NEVER access another client's leads
  if (tenantCtx.isClientUser) {
    if (!tenantCtx.agencyClientId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: No client workspace associated with account" },
        { status: 403 }
      );
    }
    if (clientId && clientId !== tenantCtx.agencyClientId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Cross-client leads access is strictly prohibited" },
        { status: 403 }
      );
    }
  }

  const whereClause: any = {
    tenantId: tenantCtx.tenant.id,
  };

  if (tenantCtx.isClientUser) {
    whereClause.clientId = tenantCtx.agencyClientId;
  } else if (clientId && clientId !== "ALL") {
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

    if (!tenantCtx.hasPermission("leads:write")) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Missing leads:write permission" },
        { status: 403 }
      );
    }

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
          tenantId: tenantCtx.tenant.id,
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

    const targetClientId = tenantCtx.isClientUser ? tenantCtx.agencyClientId : (clientId || null);

    const lead = await prisma.lead.create({
      data: {
        tenantId: tenantCtx.tenant.id,
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
        tenantId: tenantCtx.tenant.id,
        type: "NOTE",
        title: "Lead Created",
        description: `Lead created for ${firstName} ${lastName} (${companyName || "No Company"})${serviceRequired ? ` - Service: ${serviceRequired}` : ""}`,
        performedById: tenantCtx.user.id,
        leadId: lead.id,
      },
    });

    return NextResponse.json({ success: true, data: lead });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create lead" },
      { status: 500 }
    );
  }
}

