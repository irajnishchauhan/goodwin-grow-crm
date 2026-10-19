import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";
import { WarrantyClientView } from "./WarrantyClientView";

export default async function WarrantyPage() {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    redirect("/login");
  }

  const tenantId = tenantCtx.tenant.id;

  const [claims, partners, products] = await Promise.all([
    prisma.batteryWarrantyClaim.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      include: {
        partner: true,
      },
    }),
    prisma.batteryPartner.findMany({
      where: { tenantId, status: "ACTIVE" },
      select: { id: true, businessName: true, code: true, city: true },
    }),
    prisma.product.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, name: true, sku: true },
    }),
  ]);

  return (
    <WarrantyClientView
      initialClaims={claims}
      partners={partners}
      products={products}
      tenantName={tenantCtx.tenant.name}
    />
  );
}
