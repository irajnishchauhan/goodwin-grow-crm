import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

export async function GET(req: Request) {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({
      success: true,
      data: { leads: [], contacts: [], companies: [], deals: [] },
    });
  }

  const tenantId = tenantCtx.tenant.id;

  const [leads, contacts, companies, deals] = await Promise.all([
    prisma.lead.findMany({
      where: {
        tenantId,
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { companyName: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: { id: true, firstName: true, lastName: true, companyName: true, status: true },
    }),
    prisma.contact.findMany({
      where: {
        tenantId,
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: { id: true, firstName: true, lastName: true, email: true, jobTitle: true },
    }),
    prisma.company.findMany({
      where: {
        tenantId,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { industry: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: { id: true, name: true, industry: true },
    }),
    prisma.deal.findMany({
      where: {
        tenantId,
        title: { contains: q, mode: "insensitive" },
      },
      take: 5,
      select: { id: true, title: true, value: true, status: true },
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: { leads, contacts, companies, deals },
  });
}
