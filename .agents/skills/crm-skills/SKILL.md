---
name: crm-skills
description: Agent-first CRM toolkit and automation recipes for Goodwin Grow CRM. Provides executable CLI recipes, OpenAPI schemas, and context prompts for AI assistants (Claude Code, Antigravity, MCP agents) to manage leads, clients, deals, tasks, activities, and pod assignments.
---

# Goodwin Grow CRM Agent Skills

This skill equips AI assistants with executable recipes, API schemas, and operating procedures inspired by prominent CRM Agent toolkits on GitHub (`crmkit/skills`, `krayin/agent-skills`, `zoho/crm-skills`, and Twenty CRM Toolkit).

## Core Architecture

| Component | Implementation | Target Workflow |
| :--- | :--- | :--- |
| **Model Context Protocol (MCP) & OAS** | `/api/openapi` (OpenAPI 3.1 JSON Schema) | LLM structured function calling & tool generation |
| **CLI Agent Recipes** | `scripts/crm/*.ts` & `npm run crm:*` | Instant terminal pipeline control without browser UI |
| **Contextual Rules** | `.agents/skills/crm-skills/SKILL.md` | Persona validation, pod assignment rules, tenant isolation |

---

## Executable CRM Agent Recipes

### 1. `crmkit-digest` (Pipeline Briefing & Velocity)
Generates an executive digest of pipeline health, open lead values, overdue follow-ups, deliverable completion rates, and recent activity logs.

```bash
# Run human-readable markdown briefing
npm run crm:digest
# Or for a specific tenant
npx tsx scripts/crm/crmkit-digest.ts goodwin-grow-ai

# Output structured JSON for LLM ingestion
npx tsx scripts/crm/crmkit-digest.ts --json
```

### 2. `crmkit-import` (Bulk Deduplicated Upsert)
Handles bulk CSV or JSON upserts of leads, retained clients, contacts, and companies with multi-tenant isolation and automatic deduplication by email and phone.

```bash
# Import leads from CSV
npm run crm:import -- --file=path/to/leads.csv --type=leads

# Import retained clients
npm run crm:import -- --file=path/to/clients.json --type=clients

# Import contacts into Goodwin Batteries
npm run crm:import -- --file=contacts.csv --type=contacts --tenant=goodwin-batteries
```

### 3. `crmkit-backup` (Direct JSON Dump)
Exports entire CRM state (tenants, leads, deals, clients, tasks, activities, invoices) into a timestamped JSON payload.

```bash
# Export to stdout
npm run crm:backup

# Save to backup file
npm run crm:backup -- --out=backups/crm-backup.json
```

### 4. `crmkit-inbox-sync` (Communication Ingestion)
Converts raw email transcripts, WhatsApp chat exports, or meeting call notes into logged CRM interactions (`Activity` and `Note` records) and links them to the prospect.

```bash
# Ingest communication transcript JSON
npm run crm:inbox-sync -- --input=transcripts/inbound-chat.json
```

---

## Pod Assignment & Team Validation Rules

When delegating client accounts or assigning tasks, AI agents MUST follow these strict rules:

1. **Only Assign Real Workspace Team Members**:
   - Query `/api/team?activeOnly=true` or `prisma.tenantMembership` for genuine users.
   - Genuine team members in Goodwin Grow AI workspace:
     - Sameer Meena (`sameer@goodwingrowai.com`)
     - Ansh Chourasiya (`goodwingrow.ansh@gmail.com`)
     - Kunal Sen (`kunalgoodwingrow@gmail.com`)
     - Aayan Andani (`aayan@goodwingrowai.com`)
     - Goodwin Super Admin (`superadmin@goodwingrowai.com`)
     - Aarav Singhania (`admin@goodwingrowai.com`)

2. **Never Seed or Assign Fake Demo Personas**:
   - `Pooja Verma` (Fake Lead Designer) - DO NOT ASSIGN.
   - `Aman Gupta` (Fake Copywriter) - DO NOT ASSIGN.
   - `Kunal Sharma` (Fake Account Manager) - DO NOT ASSIGN.
   - If a pod position has no designated team member, set the field to `null` or display `"Unassigned"`.

3. **Tenant Boundary Preservation**:
   - Every read and write MUST be scoped to the active tenant (`goodwin-grow-ai` for Agency OS or `goodwin-batteries` for Manufacturer B2B).
   - Never cross-contaminate dealer networks with creative agency retainers.
