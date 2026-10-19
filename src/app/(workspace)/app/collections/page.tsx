import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";
import { CollectionsClientView } from "./CollectionsClientView";

export default async function CollectionsPage() {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    redirect("/login");
  }

  const tenantId = tenantCtx.tenant.id;

  const [collections, partners] = await Promise.all([
    prisma.batteryCollection.findMany({
      where: { tenantId },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
      include: {
        partner: true,
      },
    }),
    prisma.batteryPartner.findMany({
      where: { tenantId, status: "ACTIVE" },
      select: { id: true, businessName: true, code: true, city: true, outstandingBalance: true, overdueAmount: true },
    }),
  ]);

  return (
    <CollectionsClientView
      initialCollections={collections}
      partners={partners}
      tenantName={tenantCtx.tenant.name}
    />
  );
}
