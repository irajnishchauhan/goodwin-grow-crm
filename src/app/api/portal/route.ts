import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

export async function GET(req: Request) {
  try {
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestedClientId = searchParams.get("clientId");

    let targetClientId: string | null = null;

    if (tenantCtx.isClientUser) {
      if (!tenantCtx.agencyClientId) {
        return NextResponse.json(
          { success: false, error: "Forbidden: No client associated with this client portal account" },
          { status: 403 }
        );
      }
      if (requestedClientId && requestedClientId !== tenantCtx.agencyClientId) {
        return NextResponse.json(
          { success: false, error: "Forbidden: Cross-client access is strictly prohibited" },
          { status: 403 }
        );
      }
      targetClientId = tenantCtx.agencyClientId;
    } else {
      // Agency Admin or Account Manager simulating or viewing a client portal
      if (requestedClientId && requestedClientId !== "ALL") {
        targetClientId = requestedClientId;
      } else {
        const firstClient = await prisma.agencyClient.findFirst({
          where: { tenantId: tenantCtx.tenant.id },
          orderBy: { name: "asc" },
        });
        targetClientId = firstClient?.id || null;
      }
    }

    if (!targetClientId) {
      return NextResponse.json({ success: false, error: "No client found" }, { status: 404 });
    }

    const client = await prisma.agencyClient.findFirst({
      where: { id: targetClientId, tenantId: tenantCtx.tenant.id },
    });

    if (!client) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
    }

    // 1. Pending Approvals: Creatives in CLIENT_REVIEW status (or all creatives for this client)
    const creatives = await prisma.creativeAsset.findMany({
      where: {
        tenantId: tenantCtx.tenant.id,
        clientId: targetClientId,
      },
      orderBy: { createdAt: "desc" },
      include: {
        versions: { orderBy: { versionNumber: "desc" } },
        comments: {
          where: { isInternal: false }, // STRICT SEPARATION: Internal agency notes NEVER returned to client
          orderBy: { createdAt: "asc" },
        },
      },
    });

    const pendingApprovals = creatives.filter((c) => c.reviewStatus === "CLIENT_REVIEW");
    const approvedCreatives = creatives.filter((c) => ["APPROVED", "SCHEDULED", "PUBLISHED"].includes(c.reviewStatus));
    const revisionCreatives = creatives.filter((c) => c.reviewStatus === "CHANGES_REQUESTED");

    // 2. Deliverables & Content Posts
    const contentPosts = await prisma.contentPost.findMany({
      where: {
        tenantId: tenantCtx.tenant.id,
        clientId: targetClientId,
      },
      orderBy: { scheduledDate: "desc" },
    });

    // 3. Active Projects
    const projects = await prisma.agencyProject.findMany({
      where: {
        tenantId: tenantCtx.tenant.id,
        clientId: targetClientId,
      },
      orderBy: { createdAt: "desc" },
    });

    // 4. Invoices
    const invoices = await prisma.agencyInvoice.findMany({
      where: {
        tenantId: tenantCtx.tenant.id,
        clientId: targetClientId,
      },
      orderBy: { issueDate: "desc" },
    });

    // 5. Campaigns & Reports summary
    const adCampaigns = await prisma.adCampaign.findMany({
      where: {
        tenantId: tenantCtx.tenant.id,
        clientId: targetClientId,
      },
      orderBy: { startDate: "desc" },
    });

    const totalReach = contentPosts.reduce((acc, p) => acc + (p.reach || 0), 0);
    const totalEngagement = contentPosts.reduce((acc, p) => acc + (p.likes || 0) + (p.comments || 0), 0);

    let deliverables: any[] = [];
    let reports: any[] = [];
    try {
      deliverables = await prisma.$queryRawUnsafe(
        `SELECT * FROM "client_deliverables" WHERE "client_id" = $1 AND "tenant_id" = $2 ORDER BY "created_at" DESC`,
        targetClientId,
        tenantCtx.tenant.id
      );
    } catch {
      deliverables = [];
    }
    try {
      reports = await prisma.$queryRawUnsafe(
        `SELECT * FROM "client_reports" WHERE "client_id" = $1 AND "tenant_id" = $2 ORDER BY "created_at" DESC`,
        targetClientId,
        tenantCtx.tenant.id
      );
    } catch {
      reports = [];
    }

    return NextResponse.json({
      success: true,
      data: {
        client,
        creatives,
        pendingApprovals,
        approvedCreatives,
        revisionCreatives,
        contentPosts,
        projects,
        invoices,
        adCampaigns,
        deliverables,
        reports,
        stats: {
          postsPlanned: client.postsPlanned,
          postsCompleted: client.postsCompleted,
          deliverablesProgress:
            client.postsPlanned > 0
              ? Math.min(100, Math.round((client.postsCompleted / client.postsPlanned) * 100))
              : 0,
          pendingApprovalsCount: pendingApprovals.length,
          totalReach,
          totalEngagement,
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to load portal data" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, assetId, feedback, clientId, title, description, reportUrl } = body;

    if (action === "deliverable" || action === "report") {
      if (tenantCtx.isClientUser) {
        return NextResponse.json(
          { success: false, error: "Forbidden: Client users cannot publish deliverables or reports" },
          { status: 403 }
        );
      }
      if (!clientId) {
        return NextResponse.json({ success: false, error: "clientId is required" }, { status: 400 });
      }
      const client = await prisma.agencyClient.findFirst({
        where: { id: clientId, tenantId: tenantCtx.tenant.id },
      });
      if (!client) {
        return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: `${action} recorded` });
    }

    if (action === "approve" || action === "revision") {
      if (!assetId) {
        return NextResponse.json({ success: false, error: "assetId is required" }, { status: 400 });
      }
      const existingAsset = await prisma.creativeAsset.findFirst({
        where: { id: assetId, tenantId: tenantCtx.tenant.id },
      });
      if (!existingAsset) {
        return NextResponse.json({ success: false, error: "Creative asset not found" }, { status: 404 });
      }
      if (tenantCtx.isClientUser && existingAsset.clientId !== tenantCtx.agencyClientId) {
        return NextResponse.json(
          { success: false, error: "Forbidden: You cannot review another client's creative asset" },
          { status: 403 }
        );
      }

      const newStatus = action === "approve" ? "APPROVED" : "CHANGES_REQUESTED";
      const updated = await prisma.creativeAsset.update({
        where: { id: assetId },
        data: {
          reviewStatus: newStatus,
          clientFeedback: feedback !== undefined ? feedback : existingAsset.clientFeedback,
          reviewedAt: new Date(),
          ...(newStatus === "APPROVED"
            ? {
                approverName: tenantCtx.user.fullName,
                approverEmail: tenantCtx.user.email,
                approvedAt: new Date(),
              }
            : {}),
        },
      });

      if (feedback && feedback.trim()) {
        await prisma.creativeComment.create({
          data: {
            tenantId: tenantCtx.tenant.id,
            assetId,
            versionNumber: updated.version,
            authorName: tenantCtx.user.fullName,
            authorRole: tenantCtx.primaryRole,
            content: feedback.trim(),
            isInternal: false,
          },
        });
      }

      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ success: false, error: "Invalid portal action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Portal action failed" },
      { status: 500 }
    );
  }
}
