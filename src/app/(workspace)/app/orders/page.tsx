import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";
import { OrdersClientView } from "./OrdersClientView";

export default async function OrdersPage() {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    redirect("/login");
  }

  const tenantId = tenantCtx.tenant.id;

  const [orders, partners, products] = await Promise.all([
    prisma.batteryOrder.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      include: {
        partner: true,
      },
    }),
    prisma.batteryPartner.findMany({
      where: { tenantId, status: "ACTIVE" },
      select: {
        id: true,
        businessName: true,
        code: true,
        city: true,
        creditLimit: true,
        outstandingBalance: true,
      },
      orderBy: { businessName: "asc" },
    }),
    prisma.product.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, name: true, sku: true, unitPrice: true, currency: true },
    }),
  ]);

  return (
    <OrdersClientView
      initialOrders={orders}
      partners={partners}
      products={products}
      tenantName={tenantCtx.tenant.name}
    />
  );
}
