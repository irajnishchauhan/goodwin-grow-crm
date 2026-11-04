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

// WhatsApp Webhook Challenge Verification (Meta Cloud API)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "goodwin_grow_whatsapp_secret_2026";

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification token mismatch" }, { status: 403 });
}

// WhatsApp Inbound Message / Qualified Lead Handler
export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const limit = checkRateLimit(`webhook:whatsapp:${clientIp}`, 60, 60000);
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
    const entries = body.entry || [];
    const createdLeads = [];

    for (const entry of entries) {
      for (const change of entry.changes || []) {
        if (change.field === "messages") {
          const value = change.value || {};
          const contacts = value.contacts || [];
          const messages = value.messages || [];

          for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            const senderPhone = normalizePhoneNumber(msg.from || "");
            const profileName = contacts[i]?.profile?.name || `WhatsApp User (${senderPhone})`;
            const textBody = msg.text?.body || msg.button?.text || "Inbound WhatsApp message";

            // Deduplication by phone
            const existing = await prisma.lead.findFirst({
              where: {
                tenantId,
                phone: senderPhone,
              },
            });

            if (!existing) {
              const nameParts = profileName.trim().split(" ");
              const lead = await prisma.lead.create({
                data: {
                  tenantId,
                  firstName: nameParts[0] || "WhatsApp",
                  lastName: nameParts.slice(1).join(" ") || "Lead",
                  companyName: `Inbound WhatsApp (${profileName})`,
                  phone: senderPhone,
                  source: "WHATSAPP",
                  status: "NEW",
                  serviceRequired: `WhatsApp Query: "${textBody.slice(0, 100)}"`,
                  score: 70,
                },
              });
              createdLeads.push(lead);
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed WhatsApp webhook. Created ${createdLeads.length} leads.`,
      createdCount: createdLeads.length,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

