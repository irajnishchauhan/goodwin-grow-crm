export const SYSTEM_PERMISSIONS = [
  // Leads
  { code: "leads:read", module: "Leads", description: "View leads and lead details" },
  { code: "leads:write", module: "Leads", description: "Create and edit leads" },
  { code: "leads:delete", module: "Leads", description: "Delete leads" },
  { code: "leads:convert", module: "Leads", description: "Convert lead to contact, company, deal" },
  { code: "leads:export", module: "Leads", description: "Export leads to CSV" },

  // Contacts
  { code: "contacts:read", module: "Contacts", description: "View contacts" },
  { code: "contacts:write", module: "Contacts", description: "Create and edit contacts" },
  { code: "contacts:delete", module: "Contacts", description: "Delete contacts" },

  // Companies
  { code: "companies:read", module: "Companies", description: "View client companies" },
  { code: "companies:write", module: "Companies", description: "Create and edit companies" },
  { code: "companies:delete", module: "Companies", description: "Delete companies" },

  // Deals & Pipelines
  { code: "deals:read", module: "Deals", description: "View deals and pipelines" },
  { code: "deals:write", module: "Deals", description: "Create and edit deals" },
  { code: "deals:delete", module: "Deals", description: "Delete deals" },
  { code: "deals:stages", module: "Deals", description: "Move deal stages on Kanban" },

  // Tasks & Activities
  { code: "tasks:read", module: "Tasks", description: "View tasks" },
  { code: "tasks:write", module: "Tasks", description: "Create and update tasks" },
  { code: "tasks:delete", module: "Tasks", description: "Delete tasks" },
  { code: "activities:log", module: "Activities", description: "Log calls, meetings, notes" },

  // Quotations
  { code: "quotations:read", module: "Quotations", description: "View quotations" },
  { code: "quotations:write", module: "Quotations", description: "Create and edit quotations" },
  { code: "quotations:approve", module: "Quotations", description: "Approve quotations" },

  // Automations & Settings
  { code: "automations:manage", module: "Automations", description: "Configure workflow rules" },
  { code: "team:manage", module: "Team", description: "Invite and manage company users" },
  { code: "settings:manage", module: "Settings", description: "Manage company settings and pipelines" },
] as const;

export type PermissionCode = (typeof SYSTEM_PERMISSIONS)[number]["code"] | "*";
