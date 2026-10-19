import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";
import { FieldVisitsClientView } from "./FieldVisitsClientView";

export default async function FieldVisitsPage() {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    redirect("/login");
  }

  const tenantId = tenantCtx.tenant.id;

  const [visits, partners] = await Promise.all([
    prisma.batteryFieldVisit.findMany({
      where: { tenantId },
      orderBy: { visitDate: "desc" },
      include: {
        partner: true,
      },
    }),
    prisma.batteryPartner.findMany({
      where: { tenantId, status: "ACTIVE" },
      select: { id: true, businessName: true, code: true, city: true, territory: true },
    }),
  ]);

  return (
    <FieldVisitsClientView
      initialVisits={visits}
      partners={partners}
      tenantName={tenantCtx.tenant.name}
    />
  );
}
