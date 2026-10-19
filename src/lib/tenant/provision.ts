import crypto from "crypto";
import prisma from "@/lib/prisma";
import { SYSTEM_PERMISSIONS } from "@/lib/rbac/permissions";
import { hashPassword } from "@/lib/auth/password";

export interface ProvisionTenantInput {
  name: string;
  code: string;
  industry?: string;
  businessEmail?: string;
  phone?: string;
  website?: string;
  address?: string;
  country?: string;
  currency?: string;
  timezone?: string;
  seatLimit?: number;
  planCode?: string;
  adminName: string;
  adminEmail: string;
  adminPassword?: string; // If provided directly during setup
  createdById?: string;
}

export async function provisionTenant(input: ProvisionTenantInput) {
  const {
    name,
    code,
    industry,
    businessEmail,
    phone,
    website,
    address,
    country = "India",
    currency = "INR",
    timezone = "Asia/Kolkata",
    seatLimit = 10,
    planCode = "starter",
    adminName,
    adminEmail,
    adminPassword,
    createdById,
  } = input;

  return prisma.$transaction(async (tx) => {
    // 1. Ensure system permissions are populated
    for (const p of SYSTEM_PERMISSIONS) {
      await tx.permission.upsert({
        where: { code: p.code },
        update: {},
        create: {
          code: p.code,
          module: p.module,
          description: p.description,
        },
      });
    }

    const allPerms = await tx.permission.findMany();

    // 2. Create Tenant
    const tenant = await tx.tenant.create({
      data: {
        name,
        code: code.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "-"),
        status: "ACTIVE",
      },
    });

    // 3. Create Tenant Settings
    await tx.tenantSettings.create({
      data: {
        tenantId: tenant.id,
        businessEmail: businessEmail ?? adminEmail,
        phone,
        website,
        address: address ? `${industry ? `Industry: ${industry}\n` : ""}${address}` : (industry ?? ""),
        country,
        currency,
        timezone,
        seatLimit,
      },
    });

    // 4. Create Standard Default Roles for this Tenant
    const ownerRole = await tx.role.create({
      data: {
        tenantId: tenant.id,
        name: "Company Owner",
        description: "Full control over organization data and settings",
        isSystem: true,
      },
    });

    const adminRole = await tx.role.create({
      data: {
        tenantId: tenant.id,
        name: "Company Admin",
        description: "Administrative access to CRM workspace",
        isSystem: true,
      },
    });

    const agencyAdminRole = await tx.role.create({
      data: {
        tenantId: tenant.id,
        name: "Agency Admin",
        description: "Full oversight over all agency clients, pods, campaigns, and billings",
        isSystem: true,
      },
    });

    const accountManagerRole = await tx.role.create({
      data: {
        tenantId: tenant.id,
        name: "Account Manager",
        description: "Manages client relationships, deliverables, campaigns, tasks, and internal reviews",
        isSystem: true,
      },
    });

    const designerRole = await tx.role.create({
      data: {
        tenantId: tenant.id,
        name: "Designer",
        description: "Creative design production, uploading asset versions, previewing and resolving feedback",
        isSystem: true,
      },
    });

    const clientRole = await tx.role.create({
      data: {
        tenantId: tenant.id,
        name: "Client",
        description: "Client portal access restricted to assigned client deliverables, approvals, and reports",
        isSystem: true,
      },
    });

    const managerRole = await tx.role.create({
      data: {
        tenantId: tenant.id,
        name: "Sales Manager",
        description: "Team management, pipeline oversight, and approval rights",
        isSystem: true,
      },
    });

    const repRole = await tx.role.create({
      data: {
        tenantId: tenant.id,
        name: "Sales Executive",
        description: "Manage assigned leads, deals, contacts, and tasks",
        isSystem: true,
      },
    });

    const viewerRole = await tx.role.create({
      data: {
        tenantId: tenant.id,
        name: "Viewer",
        description: "Read-only visibility over CRM records",
        isSystem: true,
      },
    });

    // Map permissions to roles
    for (const p of allPerms) {
      // Owner & Admin & Agency Admin get all
      await tx.rolePermission.create({
        data: { roleId: ownerRole.id, permissionId: p.id },
      });
      await tx.rolePermission.create({
        data: { roleId: adminRole.id, permissionId: p.id },
      });
      await tx.rolePermission.create({
        data: { roleId: agencyAdminRole.id, permissionId: p.id },
      });

      // Account Manager permissions
      if (
        p.code !== "settings:manage" &&
        p.code !== "team:manage" &&
        p.code !== "automations:manage"
      ) {
        await tx.rolePermission.create({
          data: { roleId: accountManagerRole.id, permissionId: p.id },
        });
      }

      // Designer permissions
      if (
        p.code.startsWith("creatives:") ||
        p.code.startsWith("calendar:") ||
        p.code === "tasks:read" ||
        p.code === "tasks:write"
      ) {
        await tx.rolePermission.create({
          data: { roleId: designerRole.id, permissionId: p.id },
        });
      }

      // Client permissions (Strict client portal only)
      if (
        p.code === "portal:access" ||
        p.code === "creatives:read" ||
        p.code === "creatives:review_client" ||
        p.code === "calendar:read" ||
        p.code === "reports:read"
      ) {
        await tx.rolePermission.create({
          data: { roleId: clientRole.id, permissionId: p.id },
        });
      }

      // Manager gets all except settings:manage
      if (p.code !== "settings:manage") {
        await tx.rolePermission.create({
          data: { roleId: managerRole.id, permissionId: p.id },
        });
      }

      // Rep gets read, write, convert, log activities, tasks
      if (
        p.code.includes(":read") ||
        p.code.includes(":write") ||
        p.code === "leads:convert" ||
        p.code === "deals:stages" ||
        p.code === "activities:log"
      ) {
        await tx.rolePermission.create({
          data: { roleId: repRole.id, permissionId: p.id },
        });
      }

      // Viewer gets :read
      if (p.code.includes(":read")) {
        await tx.rolePermission.create({
          data: { roleId: viewerRole.id, permissionId: p.id },
        });
      }
    }

    // 5. Initialize Standard Sales Pipeline & Stages
    const pipeline = await tx.pipeline.create({
      data: {
        tenantId: tenant.id,
        name: "Default Sales Pipeline",
        isDefault: true,
      },
    });

    const stages = [
      { name: "New Lead", orderIndex: 0, winProbability: 10 },
      { name: "Contacted", orderIndex: 1, winProbability: 25 },
      { name: "Qualified", orderIndex: 2, winProbability: 50 },
      { name: "Proposal Sent", orderIndex: 3, winProbability: 70 },
      { name: "Negotiation", orderIndex: 4, winProbability: 85 },
      { name: "Won", orderIndex: 5, winProbability: 100 },
      { name: "Lost", orderIndex: 6, winProbability: 0 },
    ];

    for (const stage of stages) {
      await tx.pipelineStage.create({
        data: {
          tenantId: tenant.id,
          pipelineId: pipeline.id,
          name: stage.name,
          orderIndex: stage.orderIndex,
          winProbability: stage.winProbability,
        },
      });
    }

    // 6. Find or create Admin User
    let adminUser = await tx.user.findUnique({
      where: { email: adminEmail.toLowerCase().trim() },
    });

    const isNewUser = !adminUser;
    const initialPassword = adminPassword ?? "GoodwinAdmin@2026!";
    const passwordHash = await hashPassword(initialPassword);

    if (!adminUser) {
      adminUser = await tx.user.create({
        data: {
          email: adminEmail.toLowerCase().trim(),
          passwordHash,
          fullName: adminName,
          phone,
          isActive: true,
        },
      });
    }

    // 7. Create Membership
    const membership = await tx.tenantMembership.create({
      data: {
        tenantId: tenant.id,
        userId: adminUser.id,
        isOwner: true,
        status: adminPassword ? "ACTIVE" : "INVITED",
      },
    });

    await tx.membershipRole.create({
      data: {
        membershipId: membership.id,
        roleId: ownerRole.id,
      },
    });

    // 8. Generate Invitation Token
    const inviteToken = crypto.randomBytes(32).toString("hex");
    const inviteExpiry = new Date();
    inviteExpiry.setDate(inviteExpiry.getDate() + 3); // 72 hours

    const invitation = await tx.invitation.create({
      data: {
        tenantId: tenant.id,
        email: adminEmail.toLowerCase().trim(),
        roleId: ownerRole.id,
        token: inviteToken,
        invitedById: createdById ?? adminUser.id,
        expiresAt: inviteExpiry,
        acceptedAt: adminPassword ? new Date() : null,
      },
    });

    // 9. Assign Subscription Plan
    let plan = await tx.subscriptionPlan.findUnique({
      where: { code: planCode.toLowerCase() },
    });

    if (!plan) {
      plan = await tx.subscriptionPlan.create({
        data: {
          name: planCode.toUpperCase(),
          code: planCode.toLowerCase(),
          monthlyPrice: 2999,
          annualPrice: 29990,
          seatLimit,
          features: {
            leads: true,
            deals: true,
            quotations: true,
            automations: true,
            reports: true,
          },
        },
      });
    }

    const subEnd = new Date();
    subEnd.setDate(subEnd.getDate() + 30);

    await tx.subscription.create({
      data: {
        tenantId: tenant.id,
        planId: plan.id,
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: subEnd,
      },
    });

    // 10. Audit Log
    await tx.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId: createdById ?? adminUser.id,
        action: "TENANT_PROVISIONED",
        entityType: "Tenant",
        entityId: tenant.id,
        metadata: {
          tenantName: tenant.name,
          adminEmail: adminUser.email,
          planCode: plan.code,
        },
      },
    });

    return {
      tenant,
      adminUser,
      membership,
      invitationToken: inviteToken,
      isNewUser,
      pipeline,
    };
  }, {
    timeout: 60000,
    maxWait: 20000,
  });
}
