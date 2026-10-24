import { describe, it, expect, beforeAll } from "vitest";
import prisma from "../src/lib/prisma";
import { getTenantContext, switchActiveTenant } from "../src/lib/tenant/context";
import { createSession } from "../src/lib/auth/session";

describe("Multi-Tenant Data Isolation & Security Verification", () => {
  beforeAll(async () => {
    let sapnaAdmin = await prisma.user.findUnique({
      where: { email: "admin@sapnawashing.com" },
    });
    if (!sapnaAdmin) {
      sapnaAdmin = await prisma.user.create({
        data: {
          email: "admin@sapnawashing.com",
          fullName: "Sapna Wash Admin",
          passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz123456",
          isActive: true,
        },
      });
    }
    const tenantSapna = await prisma.tenant.findUnique({
      where: { code: "sapna-wash" },
    });
    if (tenantSapna) {
      await prisma.tenantMembership.upsert({
        where: {
          tenantId_userId: {
            tenantId: tenantSapna.id,
            userId: sapnaAdmin.id,
          },
        },
        update: {},
        create: {
          tenantId: tenantSapna.id,
          userId: sapnaAdmin.id,
          status: "ACTIVE",
        },
      });
    }
  });

  it("should enforce complete data isolation between Goodwin Batteries and Sapna Washing Point", async () => {
    const tenantBatteries = await prisma.tenant.findUnique({
      where: { code: "goodwin-batteries" },
    });
    const tenantSapna = await prisma.tenant.findUnique({
      where: { code: "sapna-wash" },
    });

    expect(tenantBatteries).toBeDefined();
    expect(tenantSapna).toBeDefined();
    expect(tenantBatteries!.id).not.toBe(tenantSapna!.id);

    // Fetch leads for both tenants
    const batteriesLeads = await prisma.lead.findMany({
      where: { tenantId: tenantBatteries!.id },
    });
    const sapnaLeads = await prisma.lead.findMany({
      where: { tenantId: tenantSapna!.id },
    });

    expect(batteriesLeads.length).toBeGreaterThan(0);
    expect(sapnaLeads.length).toBeGreaterThan(0);

    // Verify zero ID overlap
    const batteriesLeadIds = batteriesLeads.map((l) => l.id);
    const sapnaLeadIds = sapnaLeads.map((l) => l.id);

    for (const bId of batteriesLeadIds) {
      expect(sapnaLeadIds.includes(bId)).toBe(false);
    }

    // IDOR Penetration Test: Batteries user queries Sapna Lead ID with Batteries tenant_id
    const crossTenantQuery = await prisma.lead.findFirst({
      where: {
        id: sapnaLeadIds[0],
        tenantId: tenantBatteries!.id, // Attacker's active tenant
      },
    });

    // Must return null, preventing data leakage across tenant boundaries
    expect(crossTenantQuery).toBeNull();
  });

  it("should prevent cross-tenant deal stage history tampering", async () => {
    const tenantBatteries = await prisma.tenant.findUnique({
      where: { code: "goodwin-batteries" },
    });
    const tenantSapna = await prisma.tenant.findUnique({
      where: { code: "sapna-wash" },
    });

    const sapnaDeal = await prisma.deal.findFirst({
      where: { tenantId: tenantSapna!.id },
    });
    expect(sapnaDeal).toBeDefined();

    // Attacker from Batteries attempts to fetch Sapna's deal
    const attempt = await prisma.deal.findFirst({
      where: {
        id: sapnaDeal!.id,
        tenantId: tenantBatteries!.id,
      },
    });

    expect(attempt).toBeNull();
  });

  it("should cleanly resolve tenant context and prevent switching to unauthorized tenant", async () => {
    const sapnaAdmin = await prisma.user.findUnique({
      where: { email: "admin@sapnawashing.com" },
    });
    const tenantBatteries = await prisma.tenant.findUnique({
      where: { code: "goodwin-batteries" },
    });

    expect(sapnaAdmin).toBeDefined();
    expect(tenantBatteries).toBeDefined();

    const session = await createSession(sapnaAdmin!.id, null);

    // Sapna admin attempts to switch into Goodwin Batteries workspace
    await expect(
      switchActiveTenant(sapnaAdmin!.id, tenantBatteries!.id, session.token)
    ).rejects.toThrow(/Unauthorized/);
  });

  it("should properly isolate multi-membership context when user belongs to two tenants", async () => {
    // Platform Super Admin belongs to Goodwin Grow AI
    const superAdmin = await prisma.user.findUnique({
      where: { email: "superadmin@goodwingrowai.com" },
    });
    const tenantAI = await prisma.tenant.findUnique({
      where: { code: "goodwin-grow-ai" },
    });
    const tenantBatteries = await prisma.tenant.findUnique({
      where: { code: "goodwin-batteries" },
    });

    // Add Super Admin as a member in Goodwin Batteries as well (multi-company membership)
    const batteriesOwnerRole = await prisma.role.findFirst({
      where: { tenantId: tenantBatteries!.id, name: "Company Owner" },
    });

    await prisma.tenantMembership.upsert({
      where: {
        tenantId_userId: {
          tenantId: tenantBatteries!.id,
          userId: superAdmin!.id,
        },
      },
      update: {},
      create: {
        tenantId: tenantBatteries!.id,
        userId: superAdmin!.id,
        isOwner: true,
        status: "ACTIVE",
      },
    });

    const session = await createSession(superAdmin!.id, tenantAI!.id);

    // Context 1: Goodwin Grow AI
    const ctx1 = await getTenantContext(session.token);
    expect(ctx1?.tenant.code).toBe("goodwin-grow-ai");

    // Switch to Context 2: Goodwin Batteries
    await switchActiveTenant(superAdmin!.id, tenantBatteries!.id, session.token);

    const ctx2 = await getTenantContext(session.token);
    expect(ctx2?.tenant.code).toBe("goodwin-batteries");
    expect(ctx2?.tenant.id).toBe(tenantBatteries!.id);
  });
});
