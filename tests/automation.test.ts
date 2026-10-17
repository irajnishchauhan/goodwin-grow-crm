import { describe, it, expect } from "vitest";
import prisma from "../src/lib/prisma";
import { processAutomationRules } from "../src/lib/automation/engine";

describe("Workflow Automation Engine Tests", () => {
  it("should trigger an automation rule on lead.created and generate a follow-up task", async () => {
    const tenant = await prisma.tenant.findUnique({
      where: { code: "goodwin-batteries" },
    });
    expect(tenant).toBeDefined();

    // 1. Create Automation Rule
    const rule = await prisma.automationRule.create({
      data: {
        tenantId: tenant!.id,
        name: "Auto Follow-up on Inbound Lead",
        triggerEvent: "test.lead.created",
        conditions: [],
        actions: [
          {
            type: "CREATE_TASK",
            title: "Urgent: Follow up with test prospect",
            dueInDays: 1,
            priority: "URGENT",
          },
        ],
        isActive: true,
      },
    });

    // 2. Create Lead
    const lead = await prisma.lead.create({
      data: {
        tenantId: tenant!.id,
        firstName: "Test",
        lastName: "AutomationUser",
        companyName: "Automation Co",
        status: "NEW",
      },
    });

    // 3. Process Automation Engine
    await processAutomationRules({
      tenantId: tenant!.id,
      triggerEvent: "test.lead.created",
      entityType: "Lead",
      entityId: lead.id,
    });

    // 4. Assert task was created
    const generatedTask = await prisma.task.findFirst({
      where: {
        tenantId: tenant!.id,
        leadId: lead.id,
        title: "Urgent: Follow up with test prospect",
      },
    });

    expect(generatedTask).not.toBeNull();
    expect(generatedTask?.priority).toBe("URGENT");

    // 5. Assert execution telemetry was recorded
    const execution = await prisma.automationExecution.findFirst({
      where: {
        tenantId: tenant!.id,
        ruleId: rule.id,
        entityId: lead.id,
      },
    });

    expect(execution).not.toBeNull();
    expect(execution?.status).toBe("SUCCESS");

    // Cleanup test rule & lead
    await prisma.task.deleteMany({ where: { id: generatedTask!.id } });
    await prisma.automationExecution.deleteMany({ where: { id: execution!.id } });
    await prisma.automationRule.delete({ where: { id: rule.id } });
    await prisma.lead.delete({ where: { id: lead.id } });
  });
});
