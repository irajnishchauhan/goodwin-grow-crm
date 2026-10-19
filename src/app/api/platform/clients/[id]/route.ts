import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const session = await getCurrentSession();
    if (!session || !session.user.isPlatformAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Platform Super Admin access required. CRUD is restricted to Super Admin." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        settings: true,
        subscription: {
          include: { plan: true },
        },
        _count: {
          select: {
            memberships: true,
            leads: true,
            deals: true,
            contacts: true,
          },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Client company workspace not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: tenant.id,
        name: tenant.name,
        code: tenant.code,
        status: tenant.status,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
        settings: tenant.settings,
        subscription: tenant.subscription
          ? {
              planName: tenant.subscription.plan.name,
              planCode: tenant.subscription.plan.code,
              status: tenant.subscription.status,
              currentPeriodEnd: tenant.subscription.currentPeriodEnd,
            }
          : null,
        stats: {
          membersCount: tenant._count.memberships,
          leadsCount: tenant._count.leads,
          dealsCount: tenant._count.deals,
          contactsCount: tenant._count.contacts,
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch client workspace" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const session = await getCurrentSession();
    if (!session || !session.user.isPlatformAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Platform Super Admin access required. CRUD operations are restricted to Super Admin only." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existing = await prisma.tenant.findUnique({
      where: { id },
      include: { settings: true, subscription: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Client company workspace not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const {
      name,
      code,
      status,
      seatLimit,
      planCode,
      industry,
      businessEmail,
      phone,
      website,
      address,
      currency,
      timezone,
    } = body;

    // Check code uniqueness if changing code
    if (code && code.toLowerCase().trim() !== existing.code) {
      const duplicate = await prisma.tenant.findUnique({
        where: { code: code.toLowerCase().trim() },
      });
      if (duplicate && duplicate.id !== id) {
        return NextResponse.json(
          { success: false, error: "Workspace code is already in use by another organization" },
          { status: 400 }
        );
      }
    }

    // 1. Update Tenant core fields
    const updatedTenant = await prisma.tenant.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(code ? { code: code.toLowerCase().trim() } : {}),
        ...(status ? { status } : {}),
      },
    });

    // 2. Update TenantSettings
    if (existing.settings) {
      await prisma.tenantSettings.update({
        where: { tenantId: id },
        data: {
          ...(seatLimit !== undefined ? { seatLimit: Number(seatLimit) } : {}),
          ...(industry !== undefined ? { website: website || existing.settings.website } : {}),
          ...(businessEmail !== undefined ? { businessEmail } : {}),
          ...(phone !== undefined ? { phone } : {}),
          ...(website !== undefined ? { website } : {}),
          ...(address !== undefined ? { address } : {}),
          ...(currency !== undefined ? { currency } : {}),
          ...(timezone !== undefined ? { timezone } : {}),
        },
      });
    } else {
      await prisma.tenantSettings.create({
        data: {
          tenantId: id,
          seatLimit: Number(seatLimit) || 10,
          businessEmail: businessEmail || null,
          phone: phone || null,
          website: website || null,
          address: address || null,
          currency: currency || "INR",
          timezone: timezone || "Asia/Kolkata",
        },
      });
    }

    // 3. Update Subscription if planCode changed
    if (planCode) {
      const plan = await prisma.subscriptionPlan.findUnique({
        where: { code: planCode },
      });
      if (plan) {
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);

        if (existing.subscription) {
          await prisma.subscription.update({
            where: { tenantId: id },
            data: { planId: plan.id, status: "ACTIVE" },
          });
        } else {
          await prisma.subscription.create({
            data: {
              tenantId: id,
              planId: plan.id,
              status: "ACTIVE",
              currentPeriodStart: new Date(),
              currentPeriodEnd: nextYear,
            },
          });
        }
      }
    }

    // Record audit log
    await prisma.auditLog.create({
      data: {
        tenantId: id,
        userId: session.user.id,
        action: "TENANT_UPDATED",
        entityType: "Tenant",
        entityId: id,
        metadata: { updatedFields: body, updatedBy: session.user.email },
      },
    });

    const refreshed = await prisma.tenant.findUnique({
      where: { id },
      include: {
        settings: true,
        subscription: { include: { plan: true } },
        _count: { select: { memberships: true, leads: true, deals: true, contacts: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Client workspace "${refreshed?.name}" updated successfully`,
      data: refreshed,
    });
  } catch (err: any) {
    console.error("Error updating client workspace:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update client workspace" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const session = await getCurrentSession();
    if (!session || !session.user.isPlatformAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Platform Super Admin access required. CRUD operations are restricted to Super Admin only." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existing = await prisma.tenant.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Client company workspace not found" },
        { status: 404 }
      );
    }

    // Safety: Prevent deleting root platform tenant
    if (existing.code === "goodwin-grow-ai") {
      return NextResponse.json(
        { success: false, error: "Protected Entity: Cannot delete the root Goodwin Grow AI platform workspace" },
        { status: 400 }
      );
    }

    // Safe deletion with cascading clean-up
    await prisma.$transaction(async (tx) => {
      // Clean up tenant-bound records
      await tx.activity.deleteMany({ where: { tenantId: id } });
      await tx.task.deleteMany({ where: { tenantId: id } });
      await tx.dealStageHistory.deleteMany({ where: { tenantId: id } });
      await tx.deal.deleteMany({ where: { tenantId: id } });
      await tx.pipelineStage.deleteMany({ where: { tenantId: id } });
      await tx.pipeline.deleteMany({ where: { tenantId: id } });
      await tx.lead.deleteMany({ where: { tenantId: id } });
      await tx.contact.deleteMany({ where: { tenantId: id } });
      await tx.company.deleteMany({ where: { tenantId: id } });
      await tx.quotation.deleteMany({ where: { tenantId: id } });
      await tx.product.deleteMany({ where: { tenantId: id } });
      await tx.note.deleteMany({ where: { tenantId: id } });
      await tx.subscription.deleteMany({ where: { tenantId: id } });
      await tx.tenantSettings.deleteMany({ where: { tenantId: id } });
      await tx.membershipRole.deleteMany({ where: { membership: { tenantId: id } } });
      await tx.tenantMembership.deleteMany({ where: { tenantId: id } });
      await tx.invitation.deleteMany({ where: { tenantId: id } });
      await tx.rolePermission.deleteMany({ where: { role: { tenantId: id } } });
      await tx.role.deleteMany({ where: { tenantId: id } });
      await tx.auditLog.deleteMany({ where: { tenantId: id } });

      // Finally delete tenant
      await tx.tenant.delete({ where: { id } });
    });

    // Record platform audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "TENANT_DELETED",
        entityType: "Tenant",
        entityId: id,
        metadata: { deletedTenantCode: existing.code, deletedTenantName: existing.name, deletedBy: session.user.email },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Client workspace "${existing.name}" (${existing.code}) permanently deleted.`,
    });
  } catch (err: any) {
    console.error("Error deleting client workspace:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete client workspace" },
      { status: 500 }
    );
  }
}
