import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function normalizePhoneNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  return raw.trim();
}

// Ingestion Handler for Google Ads Lead Form webhook
export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const limit = checkRateLimit(`webhook:google:${clientIp}`, 60, 60000);
    if (!limit.allowed) {
      return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json();

    const agencyTenant = await prisma.tenant.findUnique({
      where: { code: "goodwin-grow-ai" },
    });

    if (!agencyTenant) {
      return NextResponse.json({ success: false, error: "Agency workspace not found" }, { status: 404 });
    }

    const tenantId = agencyTenant.id;
    // Google Ads Webhook sends user_column_data array: [{ string_value: "John Doe", column_id: "FULL_NAME" }, ...]
    const columnData = body.user_column_data || [];
    let fullName = "Google Ads Lead";
    let email: string | null = null;
    let phone: string | null = null;
    let companyName: string | null = body.campaign_id ? `Google Search Campaign #${body.campaign_id}` : "Google Ads Lead";

    for (const col of columnData) {
      const colId = col.column_id?.toUpperCase();
      if (colId === "FULL_NAME" || colId === "FIRST_NAME") {
        fullName = col.string_value || fullName;
      }
      if (colId === "EMAIL") {
        email = col.string_value || null;
      }
      if (colId === "PHONE_NUMBER") {
        phone = col.string_value ? normalizePhoneNumber(col.string_value) : null;
      }
      if (colId === "COMPANY_NAME") {
        companyName = col.string_value || companyName;
      }
    }

    if (body.lead_id) {
      companyName = `${companyName} (${body.lead_id})`;
    }

    const nameParts = fullName.trim().split(" ");
    const firstName = nameParts[0] || "Google";
    const lastName = nameParts.slice(1).join(" ") || "Lead";

    // Deduplication check
    const existing = await prisma.lead.findFirst({
      where: {
        tenantId,
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        message: "Lead already exists in CRM. Skipped duplicate.",
        leadId: existing.id,
      });
    }

    const lead = await prisma.lead.create({
      data: {
        tenantId,
        firstName,
        lastName,
        companyName: companyName || "Inbound Google Lead",
        email,
        phone,
        source: "GOOGLE_ADS",
        status: "NEW",
        serviceRequired: "Google Search High-Intent Lead",
        score: 80,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Successfully created Google Ads lead in CRM",
      data: lead,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
