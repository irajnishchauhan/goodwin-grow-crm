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

  const whereClause: any = {
    tenantId: tenantCtx.tenant.id,
  };

  if (status && status !== "ALL") {
    whereClause.status = status;
  }

  if (priority && priority !== "ALL") {
    whereClause.priority = priority;
  }

  if (q) {
    whereClause.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { companyName: { contains: q, mode: "insensitive" } },
    ];
  }

  const leads = await prisma.lead.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      assignedOwner: {
        select: { id: true, fullName: true, email: true },
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

    // Defense-in-depth: Tenant ID is strictly derived from session context
    const lead = await prisma.lead.create({
      data: {
        tenantId: tenantCtx.tenant.id,
        firstName,
        lastName,
        companyName,
        email,
        phone,
        status,
        source,
        priority,
        score: Number(score) || 0,
        tags: Array.isArray(tags) ? tags : [],
        assignedOwnerId: assignedOwnerId || tenantCtx.user.id,
      },
    });

    // Log Activity
    await prisma.activity.create({
      data: {
        tenantId: tenantCtx.tenant.id,
        type: "NOTE",
        title: "Lead Created",
        description: `Lead created for ${firstName} ${lastName} (${companyName || "No Company"})`,
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
