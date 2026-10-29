import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

export async function POST() {
  try {
    const ctx = await getTenantContext();
    if (!ctx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (ctx.isClientUser) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Client users cannot perform workspace cleanup" },
        { status: 403 }
      );
    }

    const isAdminOrOwner =
      ctx.isPlatformAdmin ||
      ctx.membership.isOwner ||
      ctx.roles.includes("Agency Admin") ||
      ctx.roles.includes("Super Admin");

    if (!isAdminOrOwner) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Admin or Owner privileges required" },
        { status: 403 }
      );
    }

    const tenantId = ctx.tenant.id;

    const demoClientNames = [
      "Sapna Washing Point",
      "Maa Amba Foam & Furnishing",
      "ZestPure Omnichannel D2C Nutrition",
      "FinEdge Neo-Banking & Wealth Technologies",
      "Mahalaxmi Heritage Jewellers Group",
      "Nikita Shrivastava (Lucky's Hair Studio)",
    ];

    const demoClients = await prisma.agencyClient.findMany({
      where: {
        tenantId,
        OR: demoClientNames.map((n) => ({ name: { contains: n, mode: "insensitive" } })),
      },
    });

    let clientsDeleted = 0;
    for (const dc of demoClients) {
      await prisma.creativeComment.deleteMany({ where: { tenantId, asset: { clientId: dc.id } } }).catch(() => {});
      await prisma.creativeVersion.deleteMany({ where: { tenantId, asset: { clientId: dc.id } } }).catch(() => {});
      await prisma.creativeAsset.deleteMany({ where: { tenantId, clientId: dc.id } }).catch(() => {});
      await prisma.contentPost.deleteMany({ where: { tenantId, clientId: dc.id } }).catch(() => {});
      await prisma.adCampaign.deleteMany({ where: { tenantId, clientId: dc.id } }).catch(() => {});
      await prisma.seoTracker.deleteMany({ where: { tenantId, clientId: dc.id } }).catch(() => {});
      await prisma.agencyInvoice.deleteMany({ where: { tenantId, clientId: dc.id } }).catch(() => {});
      await prisma.agencyExpense.deleteMany({ where: { tenantId, clientId: dc.id } }).catch(() => {});
      await prisma.agencyTask.deleteMany({ where: { tenantId, clientId: dc.id } }).catch(() => {});
      await prisma.task.deleteMany({ where: { tenantId, clientId: dc.id } }).catch(() => {});
      await prisma.lead.deleteMany({ where: { tenantId, clientId: dc.id } }).catch(() => {});
      await prisma.tenantMembership.deleteMany({ where: { tenantId, agencyClientId: dc.id } }).catch(() => {});
      await prisma.agencyClient.delete({ where: { id: dc.id } }).catch(() => {});
      clientsDeleted++;
    }

    // Sanitize any dummy pod members assigned to real clients (Pooja Verma, Aman Gupta, Kunal Sharma)
    await prisma.agencyClient.updateMany({
      where: {
        tenantId,
        OR: [
          { leadDesignerName: { contains: "Pooja", mode: "insensitive" } },
          { leadDesignerName: { contains: "Verma", mode: "insensitive" } },
        ],
      },
      data: {
        leadDesignerName: null,
      },
    }).catch(() => {});

    await prisma.agencyClient.updateMany({
      where: {
        tenantId,
        OR: [
          { contentWriterName: { contains: "Aman", mode: "insensitive" } },
          { contentWriterName: { contains: "Gupta", mode: "insensitive" } },
        ],
      },
      data: {
        contentWriterName: null,
      },
    }).catch(() => {});

    await prisma.agencyClient.updateMany({
      where: {
        tenantId,
        accountManagerName: { contains: "Kunal Sharma", mode: "insensitive" },
      },
      data: {
        accountManagerName: null,
      },
    }).catch(() => {});

    // Purge any incorrect dummy festival dates
    await (prisma as any).marketingFestival?.deleteMany({
      where: {
        tenantId,
        OR: [
          { date: { contains: "Oct 28" } },
          { date: { contains: "Oct 30" } },
          { date: { contains: "Nov 02" } },
        ],
      },
    }).catch(() => {});
    await prisma.$executeRawUnsafe(
      `DELETE FROM "marketing_festivals" 
       WHERE "tenant_id" = $1 AND ("date" LIKE '%Oct 28%' OR "date" LIKE '%Oct 30%' OR "date" LIKE '%Nov 02%')`,
      tenantId
    ).catch(() => {});

    const demoClientEmails = [
      "pooja@goodwingrowai.com",
      "kunal@goodwingrowai.com",
      "client@sapnawashing.in",
      "client@ambafurnishing.com",
      "admin@sapnawashing.com"
    ];
    for (const em of demoClientEmails) {
      const u = await prisma.user.findUnique({ where: { email: em } });
      if (u) {
        await prisma.session.deleteMany({ where: { userId: u.id } }).catch(() => {});
        await prisma.activity.deleteMany({ where: { performedById: u.id } }).catch(() => {});
        await prisma.note.deleteMany({ where: { createdById: u.id } }).catch(() => {});
        await prisma.task.updateMany({ where: { assignedToId: u.id }, data: { assignedToId: null } }).catch(() => {});
        await prisma.lead.updateMany({ where: { assignedOwnerId: u.id }, data: { assignedOwnerId: null } }).catch(() => {});
        await prisma.contact.updateMany({ where: { assignedOwnerId: u.id }, data: { assignedOwnerId: null } }).catch(() => {});
        await prisma.company.updateMany({ where: { assignedOwnerId: u.id }, data: { assignedOwnerId: null } }).catch(() => {});
        await prisma.deal.updateMany({ where: { assignedOwnerId: u.id }, data: { assignedOwnerId: null } }).catch(() => {});
        await prisma.dealStageHistory.deleteMany({ where: { changedById: u.id } }).catch(() => {});
        await prisma.auditLog.deleteMany({ where: { userId: u.id } }).catch(() => {});
        await prisma.membershipRole.deleteMany({ where: { membership: { userId: u.id } } }).catch(() => {});
        await prisma.tenantMembership.deleteMany({ where: { userId: u.id } }).catch(() => {});
        await prisma.user.delete({ where: { id: u.id } }).catch(() => {});
      }
    }

    const deletedLeads = await prisma.lead.deleteMany({
      where: {
        tenantId,
        email: { in: ["vikram@singhanialogistics.in", "meenakshi@raodesignstudio.com"] },
      },
    }).catch(() => ({ count: 0 }));

    const deletedTasks = await prisma.task.deleteMany({
      where: {
        tenantId,
        title: { contains: "Diwali 5-Slide Carousel revisions" },
      },
    }).catch(() => ({ count: 0 }));

    return NextResponse.json({
      success: true,
      message: `Cleaned ${clientsDeleted} dummy clients, ${deletedLeads.count} leads, and ${deletedTasks.count} tasks.`,
      clientsDeleted,
      leadsDeleted: deletedLeads.count,
      tasksDeleted: deletedTasks.count,
    });
  } catch (err: any) {
    console.error("Clean dummy data error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
