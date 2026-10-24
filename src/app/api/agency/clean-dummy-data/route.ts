import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

export async function POST() {
  try {
    const ctx = await getTenantContext();
    if (!ctx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = ctx.tenant.id;

    const demoClientNames = [
      "Sapna Washing Point",
      "Maa Amba Foam & Furnishing",
      "ZestPure Omnichannel D2C Nutrition",
      "FinEdge Neo-Banking & Wealth Technologies",
      "Mahalaxmi Heritage Jewellers Group",
      "Nikita Shrivastava (Lucky's Hair Studio)",
      "Sumit More Furniture Design",
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

    const demoClientEmails = ["client@sapnawashing.in", "client@ambafurnishing.com", "admin@sapnawashing.com"];
    for (const em of demoClientEmails) {
      const u = await prisma.user.findUnique({ where: { email: em } });
      if (u) {
        await prisma.membershipRole.deleteMany({ where: { membership: { userId: u.id, tenantId } } }).catch(() => {});
        await prisma.tenantMembership.deleteMany({ where: { userId: u.id, tenantId } }).catch(() => {});
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
