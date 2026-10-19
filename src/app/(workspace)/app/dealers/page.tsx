import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";
import { DealersClientView } from "./DealersClientView";

export default async function DealersPage() {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    redirect("/login");
  }

  const tenantId = tenantCtx.tenant.id;

  // Fetch partners with relations
  const [partners, distributors, salesUsers] = await Promise.all([
    prisma.batteryPartner.findMany({
      where: { tenantId },
      orderBy: [{ type: "asc" }, { businessName: "asc" }],
      include: {
        orders: {
          take: 5,
          orderBy: { createdAt: "desc" },
        },
        collections: {
          where: { status: { in: ["OVERDUE", "PENDING"] } },
        },
        warrantyClaims: {
          take: 3,
          orderBy: { createdAt: "desc" },
        },
        fieldVisits: {
          take: 3,
          orderBy: { visitDate: "desc" },
        },
      },
    }),
    prisma.batteryPartner.findMany({
      where: { tenantId, type: "DISTRIBUTOR" },
      select: { id: true, businessName: true, territory: true },
    }),
    prisma.user.findMany({
      where: { memberships: { some: { tenantId } } },
      select: { id: true, fullName: true, email: true },
    }),
  ]);

  return (
    <DealersClientView
      initialPartners={partners}
      distributors={distributors}
      salesUsers={salesUsers}
      tenantName={tenantCtx.tenant.name}
    />
  );
}
