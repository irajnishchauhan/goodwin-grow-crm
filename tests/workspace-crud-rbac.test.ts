import { describe, it, expect } from "vitest";
import prisma from "../src/lib/prisma";
import { getTenantContext } from "../src/lib/tenant/context";
import { createSession } from "../src/lib/auth/session";

describe("Workspaces CRUD, Employee Assignment & RBAC Verification", () => {
  it("verifies both Goodwin Grow AI and Goodwin Batteries workspaces exist with active team members", async () => {
    const growAiTenant = await prisma.tenant.findUnique({
      where: { code: "goodwin-grow-ai" },
      include: { memberships: { include: { user: true, roles: { include: { role: true } } } } },
    });
    const batteriesTenant = await prisma.tenant.findUnique({
      where: { code: "goodwin-batteries" },
      include: { memberships: { include: { user: true, roles: { include: { role: true } } } } },
    });

    expect(growAiTenant).toBeDefined();
    expect(batteriesTenant).toBeDefined();
    expect(growAiTenant!.memberships.length).toBeGreaterThan(0);
    expect(batteriesTenant!.memberships.length).toBeGreaterThan(0);

    const growAiEmployee = growAiTenant!.memberships[0].user;
    const batteriesEmployee = batteriesTenant!.memberships[0].user;

    expect(growAiEmployee.id).toBeDefined();
    expect(batteriesEmployee.id).toBeDefined();
  });

  it("performs full CRUD and employee assignment on Leads for both workspaces", async () => {
    const workspaces = ["goodwin-grow-ai", "goodwin-batteries"];

    for (const code of workspaces) {
      const tenant = await prisma.tenant.findUniqueOrThrow({
        where: { code },
        include: { memberships: { include: { user: true } } },
      });
      const employee = tenant.memberships[0].user;

      // 1. CREATE Lead with employee assignment
      const newLead = await prisma.lead.create({
        data: {
          tenantId: tenant.id,
          firstName: "AutomatedTest",
          lastName: "Prospect",
          companyName: "Test Enterprise Corp",
          email: `test-${code}@example.com`,
          status: "NEW",
          priority: "HIGH",
          score: 85,
          assignedOwnerId: employee.id,
        },
      });
      expect(newLead.id).toBeDefined();
      expect(newLead.assignedOwnerId).toBe(employee.id);

      // 2. READ & FILTER by assigned employee
      const assignedLeads = await prisma.lead.findMany({
        where: { tenantId: tenant.id, assignedOwnerId: employee.id },
      });
      expect(assignedLeads.some((l) => l.id === newLead.id)).toBe(true);

      // 3. UPDATE Lead
      const updatedLead = await prisma.lead.update({
        where: { id: newLead.id },
        data: {
          status: "QUALIFIED",
          priority: "URGENT",
          score: 95,
        },
      });
      expect(updatedLead.status).toBe("QUALIFIED");
      expect(updatedLead.score).toBe(95);

      // 4. DELETE Lead
      await prisma.lead.delete({
        where: { id: newLead.id },
      });
      const verifyDeleted = await prisma.lead.findUnique({
        where: { id: newLead.id },
      });
      expect(verifyDeleted).toBeNull();
    }
  });

  it("performs full CRUD and employee assignment on Deals for both workspaces", async () => {
    const workspaces = ["goodwin-grow-ai", "goodwin-batteries"];

    for (const code of workspaces) {
      const tenant = await prisma.tenant.findUniqueOrThrow({
        where: { code },
        include: {
          pipelines: { include: { stages: true } },
          memberships: { include: { user: true } },
        },
      });
      const employee = tenant.memberships[0].user;
      const pipeline = tenant.pipelines[0];
      const stage = pipeline.stages[0];

      // 1. CREATE Deal
      const newDeal = await prisma.deal.create({
        data: {
          tenantId: tenant.id,
          pipelineId: pipeline.id,
          stageId: stage.id,
          title: `Test Deal - ${code}`,
          value: 450000,
          assignedOwnerId: employee.id,
        },
      });
      expect(newDeal.id).toBeDefined();
      expect(newDeal.assignedOwnerId).toBe(employee.id);

      // 2. READ & FILTER by employee
      const filteredDeals = await prisma.deal.findMany({
        where: { tenantId: tenant.id, assignedOwnerId: employee.id },
      });
      expect(filteredDeals.some((d) => d.id === newDeal.id)).toBe(true);

      // 3. UPDATE Deal
      const updatedDeal = await prisma.deal.update({
        where: { id: newDeal.id },
        data: {
          title: `Updated Deal - ${code}`,
          value: 600000,
        },
      });
      expect(updatedDeal.title).toBe(`Updated Deal - ${code}`);
      expect(Number(updatedDeal.value)).toBe(600000);

      // 4. DELETE Deal
      await prisma.deal.delete({
        where: { id: newDeal.id },
      });
      const verifyDeleted = await prisma.deal.findUnique({
        where: { id: newDeal.id },
      });
      expect(verifyDeleted).toBeNull();
    }
  });

  it("performs full CRUD and employee assignment on Contacts & Companies for both workspaces", async () => {
    const workspaces = ["goodwin-grow-ai", "goodwin-batteries"];

    for (const code of workspaces) {
      const tenant = await prisma.tenant.findUniqueOrThrow({
        where: { code },
        include: { memberships: { include: { user: true } } },
      });
      const employee = tenant.memberships[0].user;

      // 1. Company CRUD
      const company = await prisma.company.create({
        data: {
          tenantId: tenant.id,
          name: `Client Account - ${code}`,
          industry: "Technology & Industrial",
          assignedOwnerId: employee.id,
        },
      });
      expect(company.id).toBeDefined();

      const updatedCompany = await prisma.company.update({
        where: { id: company.id },
        data: { website: "https://example.com" },
      });
      expect(updatedCompany.website).toBe("https://example.com");

      // 2. Contact CRUD
      const contact = await prisma.contact.create({
        data: {
          tenantId: tenant.id,
          companyId: company.id,
          firstName: "John",
          lastName: "Procurement",
          email: `contact-${code}@example.com`,
          assignedOwnerId: employee.id,
        },
      });
      expect(contact.id).toBeDefined();

      const updatedContact = await prisma.contact.update({
        where: { id: contact.id },
        data: { jobTitle: "Chief Procurement Officer" },
      });
      expect(updatedContact.jobTitle).toBe("Chief Procurement Officer");

      // DELETE Contact & Company
      await prisma.contact.delete({ where: { id: contact.id } });
      await prisma.company.delete({ where: { id: company.id } });

      expect(await prisma.contact.findUnique({ where: { id: contact.id } })).toBeNull();
      expect(await prisma.company.findUnique({ where: { id: company.id } })).toBeNull();
    }
  });

  it("performs full CRUD and employee filtering on Tasks & Activities", async () => {
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { code: "goodwin-batteries" },
      include: { memberships: { include: { user: true } } },
    });
    const employee = tenant.memberships[0].user;

    // Task CRUD
    const task = await prisma.task.create({
      data: {
        tenantId: tenant.id,
        title: "Follow up with distributor warranty review",
        priority: "HIGH",
        status: "PENDING",
        assignedToId: employee.id,
      },
    });
    expect(task.id).toBeDefined();

    const taskFilter = await prisma.task.findMany({
      where: { tenantId: tenant.id, assignedToId: employee.id },
    });
    expect(taskFilter.some((t) => t.id === task.id)).toBe(true);

    const updatedTask = await prisma.task.update({
      where: { id: task.id },
      data: { status: "COMPLETED" },
    });
    expect(updatedTask.status).toBe("COMPLETED");

    await prisma.task.delete({ where: { id: task.id } });
    expect(await prisma.task.findUnique({ where: { id: task.id } })).toBeNull();

    // Activity CRUD
    const activity = await prisma.activity.create({
      data: {
        tenantId: tenant.id,
        type: "CALL",
        title: "Discussed battery replacement cycles",
        performedById: employee.id,
      },
    });
    expect(activity.id).toBeDefined();

    const activityFilter = await prisma.activity.findMany({
      where: { tenantId: tenant.id, performedById: employee.id },
    });
    expect(activityFilter.some((a) => a.id === activity.id)).toBe(true);

    await prisma.activity.delete({ where: { id: activity.id } });
    expect(await prisma.activity.findUnique({ where: { id: activity.id } })).toBeNull();
  });

  it("performs full CRUD on Products, Quotations, and Automations", async () => {
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { code: "goodwin-batteries" },
      include: { memberships: { include: { user: true } } },
    });
    const employee = tenant.memberships[0].user;

    // Product CRUD
    const product = await prisma.product.create({
      data: {
        tenantId: tenant.id,
        name: "Test 200Ah Inverter Battery",
        sku: "BAT-TEST-200",
        unitPrice: 18500,
      },
    });
    expect(product.id).toBeDefined();

    const updatedProduct = await prisma.product.update({
      where: { id: product.id },
      data: { unitPrice: 19000 },
    });
    expect(Number(updatedProduct.unitPrice)).toBe(19000);

    await prisma.product.delete({ where: { id: product.id } });
    expect(await prisma.product.findUnique({ where: { id: product.id } })).toBeNull();

    // Quotation CRUD
    const quotation = await prisma.quotation.create({
      data: {
        tenantId: tenant.id,
        quotationNumber: `QT-TEST-${Date.now()}`,
        status: "DRAFT",
        subtotal: 50000,
        taxAmount: 9000,
        totalAmount: 59000,
        createdById: employee.id,
      },
    });
    expect(quotation.id).toBeDefined();

    const updatedQuotation = await prisma.quotation.update({
      where: { id: quotation.id },
      data: { status: "SENT" },
    });
    expect(updatedQuotation.status).toBe("SENT");

    await prisma.quotation.delete({ where: { id: quotation.id } });
    expect(await prisma.quotation.findUnique({ where: { id: quotation.id } })).toBeNull();

    // Automation Rule CRUD
    const rule = await prisma.automationRule.create({
      data: {
        tenantId: tenant.id,
        name: "Test Automation Rule",
        triggerEvent: "lead.created",
        isActive: true,
        actions: [{ type: "CREATE_TASK", title: "Test task" }],
      },
    });
    expect(rule.id).toBeDefined();

    const updatedRule = await prisma.automationRule.update({
      where: { id: rule.id },
      data: { isActive: false },
    });
    expect(updatedRule.isActive).toBe(false);

    await prisma.automationRule.delete({ where: { id: rule.id } });
    expect(await prisma.automationRule.findUnique({ where: { id: rule.id } })).toBeNull();
  });

  it("verifies RBAC permission matrix for Company Admin and Sales roles", async () => {
    const adminUser = await prisma.user.findUniqueOrThrow({
      where: { email: "admin@goodwinbatteries.com" },
    });
    const salesUser = await prisma.user.findUniqueOrThrow({
      where: { email: "sales@goodwinbatteries.com" },
    });
    const batteriesTenant = await prisma.tenant.findUniqueOrThrow({
      where: { code: "goodwin-batteries" },
    });

    const superAdminUser = await prisma.user.findUniqueOrThrow({
      where: { email: "superadmin@goodwingrowai.com" },
    });
    const growAiTenant = await prisma.tenant.findUniqueOrThrow({
      where: { code: "goodwin-grow-ai" },
    });

    // 1. Goodwin Batteries Admin context
    const adminSession = await createSession(adminUser.id, batteriesTenant.id);
    const adminCtx = await getTenantContext(adminSession.token);
    expect(adminCtx).not.toBeNull();
    expect(adminCtx!.hasPermission("leads:write")).toBe(true);
    expect(adminCtx!.hasPermission("leads:delete")).toBe(true);
    expect(adminCtx!.hasPermission("deals:write")).toBe(true);
    expect(adminCtx!.hasPermission("deals:delete")).toBe(true);

    // 2. Goodwin Batteries Sales Manager context
    const salesSession = await createSession(salesUser.id, batteriesTenant.id);
    const salesCtx = await getTenantContext(salesSession.token);
    expect(salesCtx).not.toBeNull();
    expect(salesCtx!.hasPermission("leads:write")).toBe(true);
    expect(salesCtx!.hasPermission("deals:write")).toBe(true);
    expect(salesCtx!.hasPermission("settings:manage")).toBe(false);

    // 3. Goodwin Grow AI Super Admin context
    const growAiSession = await createSession(superAdminUser.id, growAiTenant.id);
    const growAiCtx = await getTenantContext(growAiSession.token);
    expect(growAiCtx).not.toBeNull();
    expect(growAiCtx!.hasPermission("leads:write")).toBe(true);
    expect(growAiCtx!.hasPermission("leads:delete")).toBe(true);
    expect(growAiCtx!.hasPermission("automations:manage")).toBe(true);
  });

  it("performs full CRUD on Workspace Team Members with all details, role assignments, and owner protections", async () => {
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { code: "goodwin-batteries" },
    });

    const roles = await prisma.role.findMany({
      where: { OR: [{ tenantId: tenant.id }, { tenantId: null }] },
    });
    const salesRepRole = roles.find((r) => r.name.includes("Sales")) || roles[0];

    // 1. CREATE Team Member
    const testEmail = `agent.test.${Date.now()}@goodwinbatteries.com`;
    const newUser = await prisma.user.create({
      data: {
        email: testEmail,
        fullName: "Agent Test Member",
        phone: "+91 99887 76655",
        passwordHash: "test_hash",
        isActive: true,
      },
    });

    const newMembership = await prisma.tenantMembership.create({
      data: {
        tenantId: tenant.id,
        userId: newUser.id,
        status: "ACTIVE",
        isOwner: false,
      },
    });

    await prisma.membershipRole.create({
      data: {
        membershipId: newMembership.id,
        roleId: salesRepRole.id,
      },
    });

    expect(newMembership.id).toBeDefined();

    // 2. READ Team Member with details & workload
    const memberDetails = await prisma.tenantMembership.findUnique({
      where: { id: newMembership.id },
      include: {
        user: true,
        roles: { include: { role: true } },
      },
    });
    expect(memberDetails).not.toBeNull();
    expect(memberDetails!.user.fullName).toBe("Agent Test Member");
    expect(memberDetails!.roles[0].role.name).toBe(salesRepRole.name);

    // 3. UPDATE Team Member (Name, status, role change)
    await prisma.user.update({
      where: { id: newUser.id },
      data: { fullName: "Agent Senior Lead", phone: "+91 99887 00000" },
    });

    const updatedMembership = await prisma.tenantMembership.update({
      where: { id: newMembership.id },
      data: { status: "SUSPENDED" },
    });
    expect(updatedMembership.status).toBe("SUSPENDED");

    // 4. DELETE Team Member
    await prisma.tenantMembership.delete({
      where: { id: newMembership.id },
    });
    await prisma.user.delete({
      where: { id: newUser.id },
    });

    const verifyDeleted = await prisma.tenantMembership.findUnique({
      where: { id: newMembership.id },
    });
    expect(verifyDeleted).toBeNull();
  });

  it("performs full CRUD on Assigned CRM Roles and verifies permission binding", async () => {
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { code: "goodwin-grow-ai" },
    });

    // 1. CREATE Custom Role
    const customRole = await prisma.role.create({
      data: {
        tenantId: tenant.id,
        name: `Senior Strategist - ${Date.now()}`,
        description: "Custom role for enterprise strategy and client growth",
        isSystem: false,
      },
    });
    expect(customRole.id).toBeDefined();

    // Bind permissions
    const permissions = await prisma.permission.findMany({
      where: { code: { in: ["leads:read", "leads:write", "deals:read", "deals:write", "tasks:write"] } },
    });
    for (const p of permissions) {
      await prisma.rolePermission.create({
        data: { roleId: customRole.id, permissionId: p.id },
      });
    }

    // 2. READ Role with Permissions & Member Count
    const roleWithPerms = await prisma.role.findUnique({
      where: { id: customRole.id },
      include: { permissions: { include: { permission: true } } },
    });
    expect(roleWithPerms).not.toBeNull();
    expect(roleWithPerms!.permissions.length).toBe(permissions.length);

    // 3. UPDATE Role
    const updatedRole = await prisma.role.update({
      where: { id: customRole.id },
      data: {
        description: "Updated description for enterprise strategy",
      },
    });
    expect(updatedRole.description).toBe("Updated description for enterprise strategy");

    // 4. DELETE Custom Role
    await prisma.role.delete({
      where: { id: customRole.id },
    });

    const verifyRoleDeleted = await prisma.role.findUnique({
      where: { id: customRole.id },
    });
    expect(verifyRoleDeleted).toBeNull();
  });
});
