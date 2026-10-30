import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCurrentSession, updateSessionActiveTenant } from "@/lib/auth/session";

export default async function RootPage() {
  const session = await getCurrentSession();

  if (session && session.user) {
    if (!session.activeTenantId) {
      if (session.user.memberships.length > 0) {
        await updateSessionActiveTenant(session.token, session.user.memberships[0].tenantId);
      } else if (session.user.isPlatformAdmin) {
        const primaryTenant = await prisma.tenant.findFirst({
          where: { status: "ACTIVE" },
          orderBy: [{ code: "asc" }],
        });
        if (primaryTenant) {
          await updateSessionActiveTenant(session.token, primaryTenant.id);
        }
      }
    }
    redirect("/app/dashboard");
  }

  redirect("/login");
}
