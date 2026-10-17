import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = tenantCtx.tenant.id;

    // Fetch lead ensuring tenant ownership
    const lead = await prisma.lead.findFirst({
      where: { id, tenantId },
    });

    if (!lead) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    if (lead.status === "CONVERTED") {
      return NextResponse.json({ success: false, error: "Lead is already converted" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { dealTitle, dealValue = 0 } = body;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Company
      let companyId: string | null = null;
      if (lead.companyName) {
        let company = await tx.company.findFirst({
          where: { tenantId, name: lead.companyName },
        });

        if (!company) {
          company = await tx.company.create({
            data: {
              tenantId,
              name: lead.companyName,
              assignedOwnerId: lead.assignedOwnerId || tenantCtx.user.id,
            },
          });
        }
        companyId = company.id;
      }

      // 2. Contact
      const contact = await tx.contact.create({
        data: {
          tenantId,
          companyId,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          source: lead.source,
          tags: lead.tags,
          assignedOwnerId: lead.assignedOwnerId || tenantCtx.user.id,
        },
      });

      // 3. Optional Deal
      let dealId: string | null = null;
      const pipeline = await tx.pipeline.findFirst({
        where: { tenantId, isDefault: true },
        include: {
          stages: { orderBy: { orderIndex: "asc" } },
        },
      });

      if (pipeline && pipeline.stages.length > 0) {
        const initialStage = pipeline.stages[0];
        const title = dealTitle || `${lead.companyName || `${lead.firstName} ${lead.lastName}`} - New Deal`;

        const deal = await tx.deal.create({
          data: {
            tenantId,
            pipelineId: pipeline.id,
            stageId: initialStage.id,
            companyId,
            contactId: contact.id,
            title,
            value: Number(dealValue) || 0,
            currency: "INR",
            probability: initialStage.winProbability,
            status: "OPEN",
            assignedOwnerId: lead.assignedOwnerId || tenantCtx.user.id,
          },
        });
        dealId = deal.id;
      }

      // 4. Update Lead to Converted
      const updatedLead = await tx.lead.update({
        where: { id: lead.id },
        data: {
          status: "CONVERTED",
          convertedAt: new Date(),
          convertedContactId: contact.id,
          convertedDealId: dealId,
        },
      });

      // 5. Activity Log
      await tx.activity.create({
        data: {
          tenantId,
          type: "NOTE",
          title: "Lead Converted",
          description: `Converted into Contact: ${contact.firstName} ${contact.lastName}${dealId ? " and created deal" : ""}`,
          performedById: tenantCtx.user.id,
          leadId: lead.id,
          contactId: contact.id,
          dealId,
        },
      });

      return { lead: updatedLead, contact, dealId };
    });

    return NextResponse.json({
      success: true,
      message: "Lead successfully converted to Contact and Deal",
      data: result,
    });
  } catch (err: any) {
    console.error("Lead conversion error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to convert lead" },
      { status: 500 }
    );
  }
}
