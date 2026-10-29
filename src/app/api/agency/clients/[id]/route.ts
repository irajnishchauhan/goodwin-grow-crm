import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";
import { verifyClientConfidentialAccess } from "@/lib/agency/auth-guard";

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
      _count: {
        select: {
          notes: true,
          credentials: true,
          projects: true,
          tasks: true,
          contentPosts: true,
          creativeAssets: true,
          adCampaigns: true,
          invoices: true,
        },
      },
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

  // Check confidential access permission for notes & records
  const access = verifyClientConfidentialAccess(tenantCtx, client);

  return NextResponse.json({
    success: true,
    data: {
      ...client,
      confidentialAccess: {
        canAccessNotes: access.canAccessConfidentialNotes,
        isSuperAdmin: access.isSuperAdmin,
        isAssignedAdmin: access.isAssignedAdmin,
        roleDescription: access.roleDescription,
      },
    },
  });
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
    let parsedAddOnServices = existing.addOnServices;
    if (body.addOnServices !== undefined) {
      if (typeof body.addOnServices === "string") {
        try {
          parsedAddOnServices = JSON.parse(body.addOnServices);
        } catch {
          parsedAddOnServices = [body.addOnServices];
        }
      } else {
        parsedAddOnServices = body.addOnServices;
      }
    }

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
        accountManagerId: body.accountManagerId !== undefined ? body.accountManagerId : existing.accountManagerId,
        leadDesignerName: body.leadDesignerName ?? existing.leadDesignerName,
        contentWriterName: body.contentWriterName ?? existing.contentWriterName,
        mediaBuyerName: body.mediaBuyerName ?? existing.mediaBuyerName,
        brandGuidelines: body.brandGuidelines ?? existing.brandGuidelines,
        contractStartDate: body.contractStartDate ? new Date(body.contractStartDate) : existing.contractStartDate,
        contractRenewalDate: body.contractRenewalDate ? new Date(body.contractRenewalDate) : existing.contractRenewalDate,
        contractEndDate: body.contractEndDate ? new Date(body.contractEndDate) : existing.contractEndDate,
        billingCycle: body.billingCycle ?? existing.billingCycle,
        packageStatus: body.packageStatus ?? existing.packageStatus,
        addOnServices: parsedAddOnServices as any,
        customPricing: body.customPricing !== undefined ? Boolean(body.customPricing) : existing.customPricing,
        estimatedDeliveryCost: body.estimatedDeliveryCost !== undefined ? Number(body.estimatedDeliveryCost) : existing.estimatedDeliveryCost,
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
      return NextResponse.json(
        { success: false, error: "Forbidden: Client users cannot delete client workspaces" },
        { status: 403 }
      );
    }

    const canDelete =
      tenantCtx.isPlatformAdmin ||
      tenantCtx.membership.isOwner ||
      tenantCtx.roles.includes("Agency Admin") ||
      tenantCtx.roles.includes("Super Admin") ||
      tenantCtx.hasPermission("clients:write");

    if (!canDelete) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Admin/Owner or clients:write permission required to delete clients" },
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
      await prisma.$executeRawUnsafe(
        `DELETE FROM "client_deliverables" WHERE "client_id" = $1 AND "tenant_id" = $2;`,
        id,
        tenantCtx.tenant.id
      ).catch(() => {});
      await prisma.$executeRawUnsafe(
        `DELETE FROM "client_reports" WHERE "client_id" = $1 AND "tenant_id" = $2;`,
        id,
        tenantCtx.tenant.id
      ).catch(() => {});
      
      // Clean up creative assets versions & comments first
      const assets = await prisma.creativeAsset.findMany({ where: { clientId: id, tenantId: tenantCtx.tenant.id }, select: { id: true } });
      const assetIds = assets.map((a) => a.id);
      if (assetIds.length > 0) {
        await prisma.creativeComment.deleteMany({ where: { assetId: { in: assetIds } } }).catch(() => {});
        await prisma.creativeVersion.deleteMany({ where: { assetId: { in: assetIds } } }).catch(() => {});
        await prisma.creativeAsset.deleteMany({ where: { id: { in: assetIds } } }).catch(() => {});
      }

      await prisma.agencyClientNote.deleteMany({ where: { clientId: id, tenantId: tenantCtx.tenant.id } }).catch(() => {});
      await prisma.agencyClientCredential.deleteMany({ where: { clientId: id, tenantId: tenantCtx.tenant.id } }).catch(() => {});
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
