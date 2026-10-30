import prisma from "@/lib/prisma";

export interface AutomationTriggerContext {
  tenantId: string;
  triggerEvent?: string; // e.g. 'lead.created', 'LEAD_CREATED', 'lead.qualified', 'deal.won'
  event?: string;
  entityType: "Lead" | "Deal" | "Task" | "Contact" | string;
  entityId: string;
  payload?: Record<string, any>;
  data?: Record<string, any>;
  depth?: number;
}

const EVENT_EQUIVALENTS: Record<string, string[]> = {
  "LEAD_CREATED": ["LEAD_CREATED", "lead.created"],
  "lead.created": ["LEAD_CREATED", "lead.created"],
  "LEAD_STATUS_CHANGED": ["LEAD_STATUS_CHANGED", "lead.status_changed", "lead.qualified"],
  "lead.status_changed": ["LEAD_STATUS_CHANGED", "lead.status_changed"],
  "lead.qualified": ["lead.qualified", "LEAD_STATUS_CHANGED"],
  "DEAL_STAGE_CHANGED": ["DEAL_STAGE_CHANGED", "deal.stage_changed"],
  "deal.stage_changed": ["DEAL_STAGE_CHANGED", "deal.stage_changed"],
  "DEAL_WON": ["DEAL_WON", "deal.won"],
  "deal.won": ["DEAL_WON", "deal.won"],
  "DEAL_LOST": ["DEAL_LOST", "deal.lost"],
  "deal.lost": ["DEAL_LOST", "deal.lost"],
  "TASK_OVERDUE": ["TASK_OVERDUE", "task.overdue"],
  "task.overdue": ["TASK_OVERDUE", "task.overdue"],
  "WARRANTY_CLAIM_FILED": ["WARRANTY_CLAIM_FILED", "warranty.claim_filed"],
  "warranty.claim_filed": ["WARRANTY_CLAIM_FILED", "warranty.claim_filed"],
  "ORDER_CREATED": ["ORDER_CREATED", "order.created"],
  "order.created": ["ORDER_CREATED", "order.created"],
  "PAYMENT_OVERDUE": ["PAYMENT_OVERDUE", "payment.overdue"],
  "payment.overdue": ["PAYMENT_OVERDUE", "payment.overdue"],
  "FIELD_VISIT_COMPLETED": ["FIELD_VISIT_COMPLETED", "field_visit.completed"],
  "field_visit.completed": ["FIELD_VISIT_COMPLETED", "field_visit.completed"],
  "DEALER_ONBOARDED": ["DEALER_ONBOARDED", "dealer.onboarded"],
  "dealer.onboarded": ["DEALER_ONBOARDED", "dealer.onboarded"],
};

export async function processAutomationRules(ctx: AutomationTriggerContext) {
  const { tenantId, entityType, entityId, depth = 0 } = ctx;
  const triggerEvent = ctx.triggerEvent || ctx.event || "";
  const mergedData = { ...(ctx.payload || {}), ...(ctx.data || {}) };
  const payload = {
    tenantId,
    entityType,
    entityId,
    ...mergedData,
    data: ctx.data || mergedData,
  };

  // Infinite Loop Protection: max depth 3
  if (depth > 3) {
    console.warn(`[Automation] Aborting rule execution to prevent loop for event: ${triggerEvent}`);
    return;
  }

  const eventCandidates = EVENT_EQUIVALENTS[triggerEvent] || [triggerEvent];

  const rules = await prisma.automationRule.findMany({
    where: {
      tenantId,
      triggerEvent: { in: eventCandidates },
      isActive: true,
    },
  });

  for (const rule of rules) {
    try {
      const conditions = (rule.conditions as any[]) || [];
      const actions = (rule.actions as any[]) || [];

      // Evaluate conditions
      let matches = true;
      if (rule.triggerEvent === "lead.qualified" && triggerEvent === "LEAD_STATUS_CHANGED" && mergedData.status && mergedData.status !== "QUALIFIED") {
        matches = false;
      }
      for (const cond of conditions) {
        if (!matches) break;
        const val = mergedData[cond.field];
        const op = cond.op || cond.operator || "eq";
        if ((op === "eq" || op === "EQUALS") && val !== cond.value) {
          matches = false;
          break;
        } else if ((op === "neq" || op === "NOT_EQUALS") && val === cond.value) {
          matches = false;
          break;
        } else if ((op === "gt" || op === "GREATER_THAN") && !(Number(val) > Number(cond.value))) {
          matches = false;
          break;
        } else if ((op === "lt" || op === "LESS_THAN") && !(Number(val) < Number(cond.value))) {
          matches = false;
          break;
        } else if ((op === "contains" || op === "CONTAINS") && !String(val ?? "").toLowerCase().includes(String(cond.value ?? "").toLowerCase())) {
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
            details: { reason: "Conditions not met", payload: mergedData },
          },
        });
        continue;
      }

      // Execute actions
      const executionResults: any[] = [];

      for (const action of actions) {
        if (action.type === "CREATE_TASK") {
          const resolvedAssignedToId =
            action.assignedToId ||
            payload.data?.assignedOwnerId ||
            payload.data?.assignedToId ||
            mergedData.assignedOwnerId ||
            mergedData.assignedToId ||
            mergedData.ownerId ||
            null;

          const fallbackAssignedId =
            resolvedAssignedToId || (await getSystemUserId(tenantId));

          const task = await prisma.task.create({
            data: {
              tenantId,
              title: action.title || `Follow up: ${entityType}`,
              description: action.description || `Automated follow-up triggered by rule ${rule.name}`,
              dueDate: new Date(Date.now() + (action.dueInDays || 1) * 86400000),
              priority: action.priority || "HIGH",
              status: "PENDING",
              assignedToId: fallbackAssignedId,
              leadId: entityType === "Lead" ? entityId : null,
              dealId: entityType === "Deal" ? entityId : null,
              contactId: entityType === "Contact" ? entityId : null,
            },
          });
          executionResults.push({ action: "CREATE_TASK", taskId: task.id });
        } else if (action.type === "UPDATE_FIELD") {
          if (action.field) {
            if (entityType === "Deal") {
              await prisma.deal.updateMany({
                where: { id: payload.entityId, tenantId: payload.tenantId },
                data: { [action.field]: action.value },
              });
            } else {
              await prisma.lead.updateMany({
                where: { id: payload.entityId, tenantId: payload.tenantId },
                data: { [action.field]: action.value },
              });
            }
            executionResults.push({ action: "UPDATE_FIELD", field: action.field, value: action.value });
          }
        } else if (action.type === "LOG_ACTIVITY") {
          const performedById = mergedData.userId || (await getSystemUserId(tenantId));
          if (performedById) {
            const act = await prisma.activity.create({
              data: {
                tenantId,
                type: "NOTE",
                title: action.title || "Automated Notification",
                description: action.description || `Rule triggered: ${rule.name}`,
                performedById,
                leadId: entityType === "Lead" ? entityId : null,
                dealId: entityType === "Deal" ? entityId : null,
                contactId: entityType === "Contact" ? entityId : null,
              },
            });
            executionResults.push({ action: "LOG_ACTIVITY", activityId: act.id });
          }
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

export const evaluateAutomations = processAutomationRules;

async function getSystemUserId(tenantId: string): Promise<string | null> {
  const member = await prisma.tenantMembership.findFirst({
    where: { tenantId, status: "ACTIVE" },
  });
  if (member?.userId) return member.userId;
  const fallbackUser = await prisma.user.findFirst({ select: { id: true } });
  return fallbackUser?.id || null;
}
