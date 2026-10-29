import { NextResponse } from "next/server";

export async function GET() {
  const openApiSpec = {
    openapi: "3.1.0",
    info: {
      title: "Goodwin Grow CRM & Agency OS API",
      version: "1.0.0",
      description:
        "Agent-first CRM & Agency Management API specification for AI agents (Claude Code, Antigravity, MCP Clients). Covers Leads, Clients, Deals, Tasks, Activities, and Creative Workflows.",
    },
    servers: [
      {
        url: "/api",
        description: "Active Environment API Root",
      },
    ],
    components: {
      securitySchemes: {
        SessionCookie: {
          type: "apiKey",
          in: "cookie",
          name: "gg_crm_session",
          description: "Encrypted session token cookie",
        },
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          description: "Authorization header bearer token",
        },
      },
      schemas: {
        Lead: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            tenantId: { type: "string" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            companyName: { type: "string", nullable: true },
            email: { type: "string", format: "email", nullable: true },
            phone: { type: "string", nullable: true },
            status: {
              type: "string",
              enum: ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "CONVERTED", "LOST"],
            },
            source: { type: "string", nullable: true },
            serviceRequired: { type: "string", nullable: true },
            dealValue: { type: "number", nullable: true },
            priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] },
            score: { type: "integer", minimum: 0, maximum: 100 },
            nextFollowUp: { type: "string", format: "date-time", nullable: true },
            tags: { type: "array", items: { type: "string" } },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
          required: ["id", "tenantId", "firstName", "lastName", "status", "priority", "score"],
        },
        AgencyClient: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            brandName: { type: "string", nullable: true },
            industry: { type: "string", nullable: true },
            website: { type: "string", nullable: true },
            phone: { type: "string", nullable: true },
            email: { type: "string", format: "email", nullable: true },
            city: { type: "string", nullable: true },
            state: { type: "string", nullable: true },
            activePackage: { type: "string" },
            monthlyRetainer: { type: "number" },
            postsPlanned: { type: "integer" },
            postsCompleted: { type: "integer" },
            accountManagerName: { type: "string", nullable: true },
            leadDesignerName: { type: "string", nullable: true },
            contentWriterName: { type: "string", nullable: true },
            mediaBuyerName: { type: "string", nullable: true },
            brandGuidelines: { type: "string", nullable: true },
            status: { type: "string", enum: ["ACTIVE", "ONBOARDING", "PAUSED", "CHURNED"] },
          },
          required: ["id", "name", "activePackage", "monthlyRetainer", "status"],
        },
        Deal: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            title: { type: "string" },
            value: { type: "number" },
            currency: { type: "string", default: "INR" },
            stageId: { type: "string", format: "uuid" },
            status: { type: "string", enum: ["OPEN", "WON", "LOST"] },
            expectedCloseDate: { type: "string", format: "date-time", nullable: true },
            probability: { type: "integer", minimum: 0, maximum: 100 },
          },
          required: ["id", "title", "value", "stageId", "status"],
        },
        Task: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            title: { type: "string" },
            description: { type: "string", nullable: true },
            status: { type: "string", enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"] },
            priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] },
            dueDate: { type: "string", format: "date-time", nullable: true },
            assignedToId: { type: "string", format: "uuid", nullable: true },
          },
          required: ["id", "title", "status", "priority"],
        },
        Activity: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            type: { type: "string", enum: ["CALL", "EMAIL", "MEETING", "NOTE", "WHATSAPP", "TASK"] },
            title: { type: "string" },
            description: { type: "string", nullable: true },
            performedById: { type: "string", format: "uuid" },
            leadId: { type: "string", format: "uuid", nullable: true },
            contactId: { type: "string", format: "uuid", nullable: true },
            dealId: { type: "string", format: "uuid", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
          required: ["id", "type", "title", "performedById"],
        },
      },
    },
    paths: {
      "/leads": {
        get: {
          summary: "List all leads with filtering and pagination",
          parameters: [
            { name: "q", in: "query", schema: { type: "string" }, description: "Search query" },
            { name: "status", in: "query", schema: { type: "string" } },
            { name: "priority", in: "query", schema: { type: "string" } },
            { name: "limit", in: "query", schema: { type: "integer", default: 50 } },
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          ],
          responses: {
            200: {
              description: "List of leads matching criteria",
              content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { $ref: "#/components/schemas/Lead" } } } } } },
            },
          },
        },
        post: {
          summary: "Create a new lead (with duplicate detection)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    firstName: { type: "string" },
                    lastName: { type: "string" },
                    companyName: { type: "string" },
                    email: { type: "string", format: "email" },
                    phone: { type: "string" },
                    source: { type: "string" },
                    serviceRequired: { type: "string" },
                    dealValue: { type: "number" },
                    priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] },
                    score: { type: "integer" },
                  },
                  required: ["firstName", "lastName"],
                },
              },
            },
          },
          responses: {
            201: { description: "Lead created successfully" },
            409: { description: "Duplicate lead detected by email or phone" },
          },
        },
      },
      "/agency/clients": {
        get: {
          summary: "List all retained agency clients with pod member assignments",
          responses: {
            200: {
              description: "List of clients",
              content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { $ref: "#/components/schemas/AgencyClient" } } } } } },
            },
          },
        },
        post: {
          summary: "Register a new agency client with service package and pod assignments",
          responses: {
            201: { description: "Client registered successfully" },
          },
        },
      },
      "/agency/clients/{id}": {
        get: {
          summary: "Fetch 360° workspace view of an agency client",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            200: { description: "Client 360 workspace payload" },
            404: { description: "Client not found" },
          },
        },
        put: {
          summary: "Update client details, monthly retainers, or assigned pod members",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            200: { description: "Client updated successfully" },
          },
        },
        delete: {
          summary: "Delete client and unbind assigned deliverables",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            200: { description: "Client removed" },
          },
        },
      },
      "/deals": {
        get: { summary: "List deals across pipeline stages", responses: { 200: { description: "Pipeline deals" } } },
        post: { summary: "Create new pipeline deal", responses: { 201: { description: "Deal created" } } },
      },
      "/tasks": {
        get: { summary: "List tasks with filters by status and assignee", responses: { 200: { description: "Tasks" } } },
        post: { summary: "Create task", responses: { 201: { description: "Task created" } } },
      },
      "/activities": {
        get: { summary: "List recent activity timeline logs", responses: { 200: { description: "Activity logs" } } },
        post: { summary: "Log new activity (call, email, WhatsApp, meeting, note)", responses: { 201: { description: "Activity logged" } } },
      },
      "/team": {
        get: { summary: "List active workspace team members for pod assignments and delegation", responses: { 200: { description: "Active team members" } } },
      },
    },
  };

  return NextResponse.json(openApiSpec, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
