import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";
import { PartnerPortalView } from "./PartnerPortalView";

export default async function PartnerPortalPage() {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    redirect("/login");
  }

  const tenantId = tenantCtx.tenant.id;

  // Fetch partners with their orders, collections, warranty claims
  const partners = await prisma.batteryPartner.findMany({
    where: { tenantId },
    orderBy: { code: "asc" },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
      },
      collections: {
        orderBy: { dueDate: "asc" },
      },
      warrantyClaims: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const products = await prisma.product.findMany({
    where: { tenantId, isActive: true },
    select: { name: true, sku: true, unitPrice: true, description: true },
  });

  return (
    <PartnerPortalView
      partners={partners}
      products={products}
      tenantName={tenantCtx.tenant.name}
      tenantLogoUrl={tenantCtx.tenant.logoUrl || null}
      currentUser={tenantCtx.user}
    />
  );
}
