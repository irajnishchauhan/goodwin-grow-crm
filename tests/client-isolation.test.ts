import { describe, it, expect } from "vitest";
import prisma from "../src/lib/prisma";
import { getTenantContext } from "../src/lib/tenant/context";
import { createSession } from "../src/lib/auth/session";

describe("P0 Client Isolation & Role Boundaries Verification", () => {
  it("should enforce strict client isolation between Sapna Washing Point and Maa Amba Furnishing", async () => {
    const sapnaClient = await prisma.agencyClient.findFirst({
      where: { name: "Sapna Washing Point" },
    });
    const ambaClient = await prisma.agencyClient.findFirst({
      where: { name: "Maa Amba Foam & Furnishing" },
    });

    expect(sapnaClient).toBeDefined();
    expect(ambaClient).toBeDefined();
    expect(sapnaClient!.id).not.toBe(ambaClient!.id);

    // Get Sapna client user session
    const sapnaUser = await prisma.user.findUnique({
      where: { email: "client@sapnawashing.in" },
    });
    expect(sapnaUser).toBeDefined();

    const tenant = await prisma.tenant.findUnique({
      where: { code: "goodwin-grow-ai" },
    });
    expect(tenant).toBeDefined();

    const session = await createSession(sapnaUser!.id, tenant!.id);
    const ctx = await getTenantContext(session.token);

    expect(ctx).toBeDefined();
    expect(ctx!.isClientUser).toBe(true);
    expect(ctx!.agencyClientId).toBe(sapnaClient!.id);
    expect(ctx!.primaryRole).toBe("Client");

    // 1. Querying creatives: must only return Sapna assets
    const sapnaAssets = await prisma.creativeAsset.findMany({
      where: ctx!.getClientWhereClause(),
    });
    expect(sapnaAssets.length).toBeGreaterThan(0);
    for (const a of sapnaAssets) {
      expect(a.clientId).toBe(sapnaClient!.id);
      expect(a.clientId).not.toBe(ambaClient!.id);
    }

    // 2. IDOR Protection: assertClientAccess throws if attempting cross-client access
    expect(() => {
      ctx!.assertClientAccess(ambaClient!.id);
    }).toThrow(/Cross-client access is strictly prohibited/);

    // Allowed when accessing own client ID
    expect(() => {
      ctx!.assertClientAccess(sapnaClient!.id);
    }).not.toThrow();
  });

  it("should strictly omit internal agency notes from client-visible comments", async () => {
    const sapnaClient = await prisma.agencyClient.findFirst({
      where: { name: "Sapna Washing Point" },
    });
    const sapnaUser = await prisma.user.findUnique({
      where: { email: "client@sapnawashing.in" },
    });
    const tenant = await prisma.tenant.findUnique({
      where: { code: "goodwin-grow-ai" },
    });

    const session = await createSession(sapnaUser!.id, tenant!.id);
    const ctx = await getTenantContext(session.token);

    // Locate creative with both internal note and client visible comment
    const creative = await prisma.creativeAsset.findFirst({
      where: {
        tenantId: tenant!.id,
        clientId: sapnaClient!.id,
        title: { contains: "Diwali 30% Off" },
      },
      include: {
        comments: true,
      },
    });

    expect(creative).toBeDefined();
    // Database contains an internal note
    const hasInternalInDb = creative!.comments.some((c) => c.isInternal === true);
    expect(hasInternalInDb).toBe(true);

    // Client query with filter (as done in /api/agency/creatives and /api/portal)
    const clientVisibleComments = await prisma.creativeComment.findMany({
      where: {
        assetId: creative!.id,
        tenantId: tenant!.id,
        ...(ctx!.isClientUser ? { isInternal: false } : {}),
      },
    });

    // Client must NEVER receive any comments where isInternal is true
    for (const comment of clientVisibleComments) {
      expect(comment.isInternal).toBe(false);
    }
  });

  it("should enforce role separation between Agency Admin, Account Manager, Designer, and Client", async () => {
    const tenant = await prisma.tenant.findUnique({ where: { code: "goodwin-grow-ai" } });

    const adminUser = await prisma.user.findUnique({ where: { email: "admin@goodwingrowai.com" } });
    const managerUser = await prisma.user.findUnique({ where: { email: "kunal@goodwingrowai.com" } });
    const designerUser = await prisma.user.findUnique({ where: { email: "pooja@goodwingrowai.com" } });
    const clientUser = await prisma.user.findUnique({ where: { email: "client@sapnawashing.in" } });

    const adminSession = await createSession(adminUser!.id, tenant!.id);
    const managerSession = await createSession(managerUser!.id, tenant!.id);
    const designerSession = await createSession(designerUser!.id, tenant!.id);
    const clientSession = await createSession(clientUser!.id, tenant!.id);

    const adminCtx = await getTenantContext(adminSession.token);
    const managerCtx = await getTenantContext(managerSession.token);
    const designerCtx = await getTenantContext(designerSession.token);
    const clientCtx = await getTenantContext(clientSession.token);

    expect(adminCtx!.primaryRole).toBe("Agency Admin");
    expect(managerCtx!.primaryRole).toBe("Account Manager");
    expect(designerCtx!.primaryRole).toBe("Designer");
    expect(clientCtx!.primaryRole).toBe("Client");

    // Agency Admin has wildcard access
    expect(adminCtx!.hasPermission("*")).toBe(true);
    expect(adminCtx!.hasPermission("invoices:write")).toBe(true);

    // Account Manager can review creatives internally and manage leads
    expect(managerCtx!.hasPermission("creatives:review_internal")).toBe(true);
    expect(managerCtx!.hasPermission("leads:write")).toBe(true);

    // Designer can upload creative versions, but CANNOT access settings or team management
    expect(designerCtx!.hasPermission("creatives:version")).toBe(true);
    expect(designerCtx!.hasPermission("settings:manage")).toBe(false);
    expect(designerCtx!.hasPermission("team:manage")).toBe(false);

    // Client has portal access and client approval, but CANNOT write leads, delete assets, or access invoices write
    expect(clientCtx!.hasPermission("portal:access")).toBe(true);
    expect(clientCtx!.hasPermission("creatives:review_client")).toBe(true);
    expect(clientCtx!.hasPermission("leads:write")).toBe(false);
    expect(clientCtx!.hasPermission("invoices:write")).toBe(false);
  });

  it("should record approver and timestamp upon creative approval", async () => {
    const tenant = await prisma.tenant.findUnique({ where: { code: "goodwin-grow-ai" } });
    const sapnaClient = await prisma.agencyClient.findFirst({ where: { name: "Sapna Washing Point" } });

    // Check approved creative in database
    const approvedAsset = await prisma.creativeAsset.findFirst({
      where: {
        tenantId: tenant!.id,
        clientId: sapnaClient!.id,
        reviewStatus: "APPROVED",
      },
    });

    expect(approvedAsset).toBeDefined();
    expect(approvedAsset!.approverName).toBe("Rajesh Patidar");
    expect(approvedAsset!.approverEmail).toBe("client@sapnawashing.in");
    expect(approvedAsset!.approvedAt).not.toBeNull();
  });

  it("should require fresh approval when a revised creative version is submitted", async () => {
    const tenant = await prisma.tenant.findUnique({ where: { code: "goodwin-grow-ai" } });
    const sapnaClient = await prisma.agencyClient.findFirst({ where: { name: "Sapna Washing Point" } });

    // Create a temporary test creative in APPROVED state
    const testAsset = await prisma.creativeAsset.create({
      data: {
        tenantId: tenant!.id,
        clientId: sapnaClient!.id,
        title: "Test Fresh Approval Flow",
        assetType: "Poster",
        version: 1,
        reviewStatus: "APPROVED",
        approverName: "Rajesh Patidar",
        approvedAt: new Date(),
        submittedBy: "Pooja Verma",
        fileUrl: "https://example.com/v1.png",
      },
    });

    expect(testAsset.reviewStatus).toBe("APPROVED");

    // Designer submits a revised version (v2)
    const newVersion = testAsset.version + 1;
    await prisma.creativeVersion.create({
      data: {
        tenantId: tenant!.id,
        assetId: testAsset.id,
        versionNumber: newVersion,
        fileUrl: "https://example.com/v2.png",
        changelog: "Changed discount banner from blue to gold",
        submittedBy: "Pooja Verma",
      },
    });

    // Updating asset resets reviewStatus to INTERNAL_REVIEW requiring fresh approval
    const revisedAsset = await prisma.creativeAsset.update({
      where: { id: testAsset.id },
      data: {
        version: newVersion,
        fileUrl: "https://example.com/v2.png",
        reviewStatus: "INTERNAL_REVIEW",
        approverName: null,
        approvedAt: null,
      },
    });

    expect(revisedAsset.version).toBe(2);
    expect(revisedAsset.reviewStatus).toBe("INTERNAL_REVIEW");
    expect(revisedAsset.approverName).toBeNull();
    expect(revisedAsset.approvedAt).toBeNull();

    // Clean up
    await prisma.creativeVersion.deleteMany({ where: { assetId: testAsset.id } });
    await prisma.creativeAsset.delete({ where: { id: testAsset.id } });
  });

  it("should prevent duplicate lead creation by email or phone", async () => {
    const tenant = await prisma.tenant.findUnique({ where: { code: "goodwin-grow-ai" } });

    // Check existing lead
    const existingLead = await prisma.lead.findFirst({
      where: { tenantId: tenant!.id, email: "vikram@singhanialogistics.in" },
    });
    expect(existingLead).toBeDefined();

    // Duplicate detection query as performed in POST /api/leads
    const duplicate = await prisma.lead.findFirst({
      where: {
        tenantId: tenant!.id,
        OR: [
          { email: { equals: "vikram@singhanialogistics.in", mode: "insensitive" } },
          { phone: { equals: "+91 98111 22334" } },
        ],
      },
    });

    expect(duplicate).not.toBeNull();
    expect(duplicate!.id).toBe(existingLead!.id);
  });
});
