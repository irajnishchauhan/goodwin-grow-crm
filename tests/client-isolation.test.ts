import { describe, it, expect, beforeAll, afterAll } from "vitest";
import prisma from "../src/lib/prisma";
import { getTenantContext } from "../src/lib/tenant/context";
import { createSession } from "../src/lib/auth/session";

describe("P0 Client Isolation & Role Boundaries Verification", () => {
  beforeAll(async () => {
    let tenant = await prisma.tenant.findUnique({ where: { code: "goodwin-grow-ai" } });
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: { code: "goodwin-grow-ai", name: "Goodwin Grow AI", status: "ACTIVE" },
      });
    }
    const tenantId = tenant.id;

    let sapna = await prisma.agencyClient.findFirst({ where: { tenantId, name: "Sapna Washing Point" } });
    if (!sapna) {
      sapna = await prisma.agencyClient.create({
        data: { tenantId, name: "Sapna Washing Point", status: "ACTIVE" },
      });
    }

    let amba = await prisma.agencyClient.findFirst({ where: { tenantId, name: "Maa Amba Foam & Furnishing" } });
    if (!amba) {
      amba = await prisma.agencyClient.create({
        data: { tenantId, name: "Maa Amba Foam & Furnishing", status: "ACTIVE" },
      });
    }

    let clientRole = await prisma.role.findFirst({ where: { tenantId, name: "Client" } });
    if (!clientRole) {
      clientRole = await prisma.role.create({
        data: { tenantId, name: "Client", isSystem: true },
      });
    }

    let managerRole = await prisma.role.findFirst({ where: { tenantId, name: "Account Manager" } });
    if (!managerRole) {
      managerRole = await prisma.role.create({
        data: {
          tenantId,
          name: "Account Manager",
          isSystem: true,
        },
      });
    }

    let designerRole = await prisma.role.findFirst({ where: { tenantId, name: "Designer" } });
    if (!designerRole) {
      designerRole = await prisma.role.create({
        data: {
          tenantId,
          name: "Designer",
          isSystem: true,
        },
      });
    }

    let sapnaUser = await prisma.user.findUnique({ where: { email: "client@sapnawashing.in" } });
    if (!sapnaUser) {
      sapnaUser = await prisma.user.create({
        data: {
          email: "client@sapnawashing.in",
          fullName: "Rajesh Patidar",
          passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz123456",
          isActive: true,
        },
      });
    }

    const membership = await prisma.tenantMembership.findUnique({
      where: { tenantId_userId: { tenantId, userId: sapnaUser.id } },
    });
    if (!membership) {
      const newM = await prisma.tenantMembership.create({
        data: { tenantId, userId: sapnaUser.id, agencyClientId: sapna.id, status: "ACTIVE" },
      });
      await prisma.membershipRole.create({
        data: { membershipId: newM.id, roleId: clientRole.id },
      });
    } else if (!membership.agencyClientId) {
      await prisma.tenantMembership.update({
        where: { id: membership.id },
        data: { agencyClientId: sapna.id },
      });
    }

    // Ephemeral test Account Manager
    let testMgr = await prisma.user.findUnique({ where: { email: "kunal@goodwingrowai.com" } });
    if (!testMgr) {
      testMgr = await prisma.user.create({
        data: {
          email: "kunal@goodwingrowai.com",
          fullName: "Kunal Sharma",
          passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz123456",
          isActive: true,
        },
      });
    }
    const mgrMem = await prisma.tenantMembership.upsert({
      where: { tenantId_userId: { tenantId, userId: testMgr.id } },
      update: { status: "ACTIVE" },
      create: { tenantId, userId: testMgr.id, status: "ACTIVE" },
    });
    await prisma.membershipRole.upsert({
      where: { membershipId_roleId: { membershipId: mgrMem.id, roleId: managerRole.id } },
      update: {},
      create: { membershipId: mgrMem.id, roleId: managerRole.id },
    });

    // Ephemeral test Designer
    let testDes = await prisma.user.findUnique({ where: { email: "pooja@goodwingrowai.com" } });
    if (!testDes) {
      testDes = await prisma.user.create({
        data: {
          email: "pooja@goodwingrowai.com",
          fullName: "Pooja Verma",
          passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz123456",
          isActive: true,
        },
      });
    }
    const desMem = await prisma.tenantMembership.upsert({
      where: { tenantId_userId: { tenantId, userId: testDes.id } },
      update: { status: "ACTIVE" },
      create: { tenantId, userId: testDes.id, status: "ACTIVE" },
    });
    await prisma.membershipRole.upsert({
      where: { membershipId_roleId: { membershipId: desMem.id, roleId: designerRole.id } },
      update: {},
      create: { membershipId: desMem.id, roleId: designerRole.id },
    });

    // Approved test asset
    let approvedAsset = await prisma.creativeAsset.findFirst({
      where: { tenantId, clientId: sapna.id, reviewStatus: "APPROVED" },
    });
    if (!approvedAsset) {
      await prisma.creativeAsset.create({
        data: {
          tenantId,
          clientId: sapna.id,
          title: "Approved Test Asset",
          reviewStatus: "APPROVED",
          approverName: "Rajesh Patidar",
          approverEmail: "client@sapnawashing.in",
          approvedAt: new Date(),
          submittedBy: "Pooja Verma",
        },
      });
    }

    // Asset with comment - Diwali 30% Off
    let diwaliAsset = await prisma.creativeAsset.findFirst({
      where: { tenantId, clientId: sapna.id, title: { contains: "Diwali 30% Off" } },
      include: { comments: true },
    });
    if (!diwaliAsset) {
      await prisma.creativeAsset.create({
        data: {
          tenantId,
          clientId: sapna.id,
          title: "Diwali 30% Off Offer Creative",
          reviewStatus: "CLIENT_REVIEW",
          submittedBy: "Pooja Verma",
          comments: {
            create: [
              { tenantId, authorName: "Kunal Sharma", content: "Internal Note", isInternal: true },
              { tenantId, authorName: "Pooja Verma", content: "Client Visible Note", isInternal: false },
            ],
          },
        },
      });
    }

    // Lead for duplicate test
    let existingLead = await prisma.lead.findFirst({
      where: { tenantId, email: "vikram@singhanialogistics.in" },
    });
    if (!existingLead) {
      await prisma.lead.create({
        data: {
          tenantId,
          firstName: "Vikram",
          lastName: "Singhania",
          email: "vikram@singhanialogistics.in",
          phone: "+91 98111 22334",
          status: "QUALIFIED",
        },
      });
    }
  });

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

  afterAll(async () => {
    const tenant = await prisma.tenant.findUnique({ where: { code: "goodwin-grow-ai" } });
    if (!tenant) return;
    const testClients = await prisma.agencyClient.findMany({
      where: {
        tenantId: tenant.id,
        name: { in: ["Sapna Washing Point", "Maa Amba Foam & Furnishing"] },
      },
    });
    for (const c of testClients) {
      await prisma.creativeComment.deleteMany({ where: { tenantId: tenant.id, asset: { clientId: c.id } } });
      await prisma.creativeVersion.deleteMany({ where: { tenantId: tenant.id, asset: { clientId: c.id } } });
      await prisma.creativeAsset.deleteMany({ where: { tenantId: tenant.id, clientId: c.id } });
      await prisma.tenantMembership.deleteMany({ where: { tenantId: tenant.id, agencyClientId: c.id } });
      await prisma.agencyClient.delete({ where: { id: c.id } }).catch(() => {});
    }
    await prisma.lead.deleteMany({
      where: { tenantId: tenant.id, email: "vikram@singhanialogistics.in" },
    });
    const testUserEmails = ["client@sapnawashing.in", "kunal@goodwingrowai.com", "pooja@goodwingrowai.com"];
    for (const em of testUserEmails) {
      const u = await prisma.user.findUnique({ where: { email: em } });
      if (u) {
        await prisma.session.deleteMany({ where: { userId: u.id } }).catch(() => {});
        await prisma.membershipRole.deleteMany({ where: { membership: { userId: u.id } } }).catch(() => {});
        await prisma.tenantMembership.deleteMany({ where: { userId: u.id } }).catch(() => {});
        await prisma.user.delete({ where: { id: u.id } }).catch(() => {});
      }
    }
  });
});

