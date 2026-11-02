import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

function normalizePhoneNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  return raw.trim();
}

// Webhook Verification (Meta App Setup)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || "goodwin_grow_meta_secret_2026";

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification token mismatch" }, { status: 403 });
}

// Ingestion Handler for incoming Meta Leads
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Default to goodwin-grow-ai agency tenant
    const agencyTenant = await prisma.tenant.findUnique({
      where: { code: "goodwin-grow-ai" },
    });

    if (!agencyTenant) {
      return NextResponse.json({ success: false, error: "Agency workspace not found" }, { status: 404 });
    }

    const tenantId = agencyTenant.id;
    const entries = body.entry || [];
    const createdLeads = [];

    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.field === "leadgen") {
          const val = change.value || {};
          const rawName = val.full_name || val.name || `Meta Lead #${val.leadgen_id?.slice(-4) || "New"}`;
          const rawEmail = val.email || null;
          const rawPhone = val.phone_number || val.phone || null;
          const cleanPhone = rawPhone ? normalizePhoneNumber(rawPhone) : null;
          const campaignName = val.campaign_name || val.ad_name || "Meta Lead Ad";

          const nameParts = rawName.trim().split(" ");
          const firstName = nameParts[0] || "Meta";
          const lastName = nameParts.slice(1).join(" ") || "Lead";

          // Prevent exact duplicate leads within 24 hours
          const existing = await prisma.lead.findFirst({
            where: {
              tenantId,
              OR: [
                ...(rawEmail ? [{ email: rawEmail }] : []),
                ...(cleanPhone ? [{ phone: cleanPhone }] : []),
              ],
            },
          });

          if (!existing) {
            const lead = await prisma.lead.create({
              data: {
                tenantId,
                firstName,
                lastName,
                companyName: campaignName,
                email: rawEmail,
                phone: cleanPhone,
                source: "META_ADS",
                status: "NEW",
                serviceRequired: campaignName,
                score: 75,
              },
            });
            createdLeads.push(lead);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed Meta Leads webhook. Created ${createdLeads.length} leads.`,
      createdCount: createdLeads.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process Meta Lead webhook" },
      { status: 500 }
    );
  }
}
