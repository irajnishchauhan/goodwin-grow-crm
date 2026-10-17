import prisma from "@/lib/prisma";

export interface AutomationTriggerContext {
  tenantId: string;
  triggerEvent: string; // e.g. 'lead.created', 'lead.qualified', 'deal.won'
  entityType: "Lead" | "Deal" | "Task" | "Contact";
  entityId: string;
  payload?: Record<string, any>;
  depth?: number;
}

export async function processAutomationRules(ctx: AutomationTriggerContext) {
  const { tenantId, triggerEvent, entityType, entityId, payload = {}, depth = 0 } = ctx;

  // Infinite Loop Protection: max depth 3
  if (depth > 3) {
    console.warn(`[Automation] Aborting rule execution to prevent loop for event: ${triggerEvent}`);
    return;
  }

  const rules = await prisma.automationRule.findMany({
    where: {
      tenantId,
      triggerEvent,
      isActive: true,
    },
  });

  for (const rule of rules) {
    try {
      const conditions = (rule.conditions as any[]) || [];
      const actions = (rule.actions as any[]) || [];

      // Evaluate conditions
      let matches = true;
      for (const cond of conditions) {
        const val = payload[cond.field];
        if (cond.op === "eq" && val !== cond.value) {
          matches = false;
          break;
        }
      }

      if (!matches) {
        await prisma.automationExecution.create({
          data: {
            tenantId,
            ruleId: rule.id,
            entityType,
            entityId,
            status: "SKIPPED",
            details: { reason: "Conditions not met", payload },
          },
        });
        continue;
      }

      // Execute actions
      const executionResults: any[] = [];

      for (const action of actions) {
        if (action.type === "CREATE_TASK") {
          const task = await prisma.task.create({
            data: {
              tenantId,
              title: action.title || `Follow up: ${entityType}`,
              description: action.description || `Automated follow-up triggered by rule ${rule.name}`,
              dueDate: new Date(Date.now() + (action.dueInDays || 1) * 86400000),
              priority: action.priority || "HIGH",
              status: "PENDING",
              leadId: entityType === "Lead" ? entityId : null,
              dealId: entityType === "Deal" ? entityId : null,
              contactId: entityType === "Contact" ? entityId : null,
            },
          });
          executionResults.push({ action: "CREATE_TASK", taskId: task.id });
        } else if (action.type === "LOG_ACTIVITY") {
          const act = await prisma.activity.create({
            data: {
              tenantId,
              type: "NOTE",
              title: action.title || "Automated Notification",
              description: action.description || `Rule triggered: ${rule.name}`,
              performedById: payload.userId || (await getSystemUserId(tenantId)),
              leadId: entityType === "Lead" ? entityId : null,
              dealId: entityType === "Deal" ? entityId : null,
              contactId: entityType === "Contact" ? entityId : null,
            },
          });
          executionResults.push({ action: "LOG_ACTIVITY", activityId: act.id });
        }
      }

      // Record successful execution
      await prisma.automationExecution.create({
        data: {
          tenantId,
          ruleId: rule.id,
          entityType,
          entityId,
          status: "SUCCESS",
          details: { executedActions: executionResults },
        },
      });
    } catch (err: any) {
      console.error(`[Automation] Error executing rule ${rule.id}:`, err);
      await prisma.automationExecution.create({
        data: {
          tenantId,
          ruleId: rule.id,
          entityType,
          entityId,
          status: "FAILED",
          details: { error: err.message },
        },
      });
    }
  }
}

async function getSystemUserId(tenantId: string): Promise<string> {
  const member = await prisma.tenantMembership.findFirst({
    where: { tenantId, status: "ACTIVE" },
  });
  return member?.userId || "system";
}
