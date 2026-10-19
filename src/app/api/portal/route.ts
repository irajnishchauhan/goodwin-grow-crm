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
