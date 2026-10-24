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

  const client = await prisma.agencyClient.findFirst({
    where: { id, tenantId: tenantCtx.tenant.id },
    include: {
      projects: { orderBy: { createdAt: "desc" } },
      tasks: { orderBy: { createdAt: "desc" } },
      contentPosts: { orderBy: { scheduledDate: "desc" } },
      creativeAssets: { orderBy: { createdAt: "desc" } },
      adCampaigns: { orderBy: { createdAt: "desc" } },
      seoTrackers: { orderBy: { currentRank: "asc" } },
      invoices: { orderBy: { issueDate: "desc" } },
      expenses: { orderBy: { date: "desc" } },
    },
  });

  if (!client) {
    return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
  }

  // Client Isolation: One client must NEVER access another client's reports or workspace
  if (tenantCtx.isClientUser && client.id !== tenantCtx.agencyClientId) {
    return NextResponse.json(
      { success: false, error: "Forbidden: Access to another client's workspace is strictly prohibited" },
      { status: 403 }
    );
  }

  return NextResponse.json({ success: true, data: client });
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
      return NextResponse.json(
        { success: false, error: "Forbidden: Client users cannot modify agency client configurations" },
        { status: 403 }
      );
    }

    const existing = await prisma.agencyClient.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
    }

    const body = await req.json();
    const updated = await prisma.agencyClient.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        brandName: body.brandName !== undefined ? body.brandName : existing.brandName,
        industry: body.industry !== undefined ? body.industry : existing.industry,
        website: body.website !== undefined ? body.website : existing.website,
        phone: body.phone !== undefined ? body.phone : existing.phone,
        email: body.email !== undefined ? body.email : existing.email,
        city: body.city !== undefined ? body.city : existing.city,
        state: body.state !== undefined ? body.state : existing.state,
        activePackage: body.activePackage ?? existing.activePackage,
        monthlyRetainer: body.monthlyRetainer !== undefined ? Number(body.monthlyRetainer) : existing.monthlyRetainer,
        status: body.status ?? existing.status,
        onboardingProgress: body.onboardingProgress !== undefined ? Number(body.onboardingProgress) : existing.onboardingProgress,
        postsPlanned: body.postsPlanned !== undefined ? Number(body.postsPlanned) : existing.postsPlanned,
        postsCompleted: body.postsCompleted !== undefined ? Number(body.postsCompleted) : existing.postsCompleted,
        accountManagerName: body.accountManagerName ?? existing.accountManagerName,
        leadDesignerName: body.leadDesignerName ?? existing.leadDesignerName,
        contentWriterName: body.contentWriterName ?? existing.contentWriterName,
        mediaBuyerName: body.mediaBuyerName ?? existing.mediaBuyerName,
        brandGuidelines: body.brandGuidelines ?? existing.brandGuidelines,
        contractRenewalDate: body.contractRenewalDate ? new Date(body.contractRenewalDate) : existing.contractRenewalDate,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update client" },
      { status: 500 }
    );
  }
}

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
      return NextResponse.json(
        { success: false, error: "Forbidden: Client users cannot delete client workspaces" },
        { status: 403 }
      );
    }

    const existing = await prisma.agencyClient.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
    }

    // Cascaded safe cleanup of related records before deleting client
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "client_deliverables" WHERE "client_id" = $1;`, id).catch(() => {});
      await prisma.$executeRawUnsafe(`DELETE FROM "client_reports" WHERE "client_id" = $1;`, id).catch(() => {});
      
      // Clean up creative assets versions & comments first
      const assets = await prisma.creativeAsset.findMany({ where: { clientId: id }, select: { id: true } });
      const assetIds = assets.map((a) => a.id);
      if (assetIds.length > 0) {
        await prisma.creativeComment.deleteMany({ where: { assetId: { in: assetIds } } }).catch(() => {});
        await prisma.creativeVersion.deleteMany({ where: { assetId: { in: assetIds } } }).catch(() => {});
        await prisma.creativeAsset.deleteMany({ where: { id: { in: assetIds } } }).catch(() => {});
      }

      await prisma.contentPost.deleteMany({ where: { clientId: id } }).catch(() => {});
      await prisma.adCampaign.deleteMany({ where: { clientId: id } }).catch(() => {});
      await prisma.seoTracker.deleteMany({ where: { clientId: id } }).catch(() => {});
      await prisma.agencyInvoice.deleteMany({ where: { clientId: id } }).catch(() => {});
      await prisma.agencyExpense.deleteMany({ where: { clientId: id } }).catch(() => {});
      await prisma.agencyTask.deleteMany({ where: { clientId: id } }).catch(() => {});
      await prisma.agencyProject.deleteMany({ where: { clientId: id } }).catch(() => {});

      // Disassociate crm tasks, leads, and memberships
      await prisma.task.updateMany({ where: { clientId: id }, data: { clientId: null } }).catch(() => {});
      await prisma.lead.updateMany({ where: { clientId: id }, data: { clientId: null } }).catch(() => {});
      await prisma.tenantMembership.updateMany({ where: { agencyClientId: id }, data: { agencyClientId: null } }).catch(() => {});
    } catch (cleanupErr: any) {
      console.warn("Notice: Client pre-delete cleanup warning:", cleanupErr.message);
    }

    await prisma.agencyClient.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Client deleted successfully" });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete client" },
      { status: 500 }
    );
  }
}
