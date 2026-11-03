import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";
import { sendEmail } from "@/lib/email/sender";

export async function POST(req: Request) {
  try {
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (tenantCtx.isClientUser) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Client users cannot send renewal notifications" },
        { status: 403 }
      );
    }

    const tenantId = tenantCtx.tenant.id;
    const now = new Date();
    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Find clients expiring within 30 days
    const expiringClients = await prisma.agencyClient.findMany({
      where: {
        tenantId,
        status: "ACTIVE",
        contractRenewalDate: {
          gte: now,
          lte: in30Days,
        },
      },
    });

    if (expiringClients.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No clients with contracts expiring in the next 30 days.",
        notifiedCount: 0,
      });
    }

    let notifiedCount = 0;
    for (const client of expiringClients) {
      const renewalDateStr = client.contractRenewalDate
        ? new Date(client.contractRenewalDate).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "End of month";

      if (client.email) {
        await sendEmail({
          to: client.email,
          subject: `Goodwin Grow AI — Retainer Agreement Renewal Reminder (${client.brandName || client.name})`,
          text: `Dear ${client.name},\n\nYour marketing retainer agreement with Goodwin Grow AI for "${client.activePackage || "Agency Services"}" is scheduled for renewal on ${renewalDateStr}.\n\nTo ensure seamless continuity of ad campaigns, content calendar publishing, and dedicated creative team allocation, our team will share the renewal term sheet.\n\nWarm regards,\nGoodwin Grow AI Team`,
          html: `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;">
            <h2 style="color:#0f172a;margin-top:0;">Retainer Agreement Renewal Reminder</h2>
            <p>Dear <strong>${client.name}</strong>,</p>
            <p>Your marketing retainer agreement for <strong>${client.activePackage || "Agency Services"}</strong> is scheduled for renewal on <strong>${renewalDateStr}</strong>.</p>
            <p>To ensure uninterrupted campaign optimization and creative delivery, our executive team has prepared the upcoming contract period schedule.</p>
            <div style="background:#f8fafc;padding:16px;border-radius:8px;margin:20px 0;border-left:4px solid #10b981;">
              <p style="margin:0;font-size:14px;color:#334155;"><strong>Client Brand:</strong> ${client.brandName || client.name}</p>
              <p style="margin:4px 0 0 0;font-size:14px;color:#334155;"><strong>Monthly Retainer:</strong> ₹${Number(client.monthlyRetainer).toLocaleString("en-IN")}/mo</p>
            </div>
            <p style="color:#64748b;font-size:12px;margin-top:24px;">Goodwin Grow AI — Marketing Agency Operating System</p>
          </div>`,
        }).catch((e) => console.error("Email send failed:", e));

        notifiedCount++;
      }

      // Auto-escalate urgent renewal task for contracts expiring within 15 days
      const daysUntilExpiry = client.contractRenewalDate
        ? Math.round((new Date(client.contractRenewalDate).getTime() - now.getTime()) / 86400000)
        : 30;

      if (daysUntilExpiry <= 15) {
        const existingTask = await prisma.task.findFirst({
          where: {
            tenantId,
            title: { contains: `Contract Renewal: ${client.brandName || client.name}` },
            status: { not: "COMPLETED" },
          },
        });

        if (!existingTask) {
          await prisma.task.create({
            data: {
              tenantId,
              title: `Urgent: Contract Renewal: ${client.brandName || client.name} (${daysUntilExpiry} days remaining)`,
              description: `Contract renewal due in ${daysUntilExpiry} days (${renewalDateStr}). Review quarterly ROAS performance, prepare renewal term sheet, and schedule executive extension review.`,
              priority: "URGENT",
              status: "PENDING",
              dueDate: client.contractRenewalDate ? new Date(client.contractRenewalDate) : new Date(Date.now() + 7 * 86400000),
              assignedToId: tenantCtx.user.id,
            },
          }).catch(() => {});
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully dispatched renewal reminders to ${notifiedCount} client leadership accounts.`,
      notifiedCount,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to dispatch renewal reminders" },
      { status: 500 }
    );
  }
}

