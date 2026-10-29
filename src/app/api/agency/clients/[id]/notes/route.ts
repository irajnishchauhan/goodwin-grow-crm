import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";
import { verifyClientConfidentialAccess } from "@/lib/agency/auth-guard";

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
    if (tenantCtx.isClientUser) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Client users cannot access confidential notes" },
        { status: 403 }
      );
    }

    const client = await prisma.agencyClient.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
      select: {
        id: true,
        name: true,
        accountManagerId: true,
        accountManagerName: true,
        email: true,
      },
    });

    if (!client) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
    }

    // RBAC: Restricted to Super Admin and the admin assigned to that particular client
    const access = verifyClientConfidentialAccess(tenantCtx, client);
    if (!access.canAccessConfidentialNotes) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: Confidential client notes are restricted to Super Admins and the client's assigned Account Manager.",
          accessGranted: false,
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const whereClause: any = {
      tenantId: tenantCtx.tenant.id,
      clientId: id,
    };

    if (category && category !== "ALL") {
      whereClause.category = category;
    }

    const notes = await prisma.agencyClientNote.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: notes,
      accessInfo: {
        isSuperAdmin: access.isSuperAdmin,
        isAssignedAdmin: access.isAssignedAdmin,
        role: access.roleDescription,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch client notes" },
      { status: 500 }
    );
  }
}

export async function POST(
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
      return NextResponse.json(
        { success: false, error: "Forbidden: Client users cannot access confidential notes" },
        { status: 403 }
      );
    }

    const client = await prisma.agencyClient.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
      select: {
        id: true,
        name: true,
        accountManagerId: true,
        accountManagerName: true,
        email: true,
      },
    });

    if (!client) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
    }

    // RBAC: Restricted to Super Admin and the admin assigned to that particular client
    const access = verifyClientConfidentialAccess(tenantCtx, client);
    if (!access.canAccessConfidentialNotes) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: Only Super Admins and the designated Account Manager can create notes for this client.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, content, category, isConfidential } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: "Note title is required" }, { status: 400 });
    }

    if (!content || !content.trim()) {
      return NextResponse.json({ success: false, error: "Note content is required" }, { status: 400 });
    }

    const validCategories = ["REQUIREMENT", "MEETING_NOTE", "STRATEGY", "FOLLOW_UP", "IMPORTANT_INFO"];
    const targetCategory = validCategories.includes(category) ? category : "IMPORTANT_INFO";

    const note = await prisma.agencyClientNote.create({
      data: {
        tenantId: tenantCtx.tenant.id,
        clientId: id,
        title: title.trim(),
        content: content.trim(),
        category: targetCategory as any,
        isConfidential: isConfidential !== undefined ? Boolean(isConfidential) : true,
        createdById: tenantCtx.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: note }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create client note" },
      { status: 500 }
    );
  }
}
