import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { getTenantContext } from "@/lib/tenant/context";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();

  if (!session || !session.user) {
    redirect("/login");
  }

  const tenantCtx = await getTenantContext();

  if (!tenantCtx) {
    // If user has memberships, prompt company selector
    if (session.user.memberships.length > 0) {
      redirect("/select-company");
    }
    // If platform admin without tenant, send to platform portal
    if (session.user.isPlatformAdmin) {
      redirect("/platform");
    }
    redirect("/login");
  }

  const formattedMemberships = session.user.memberships.map((m) => ({
    tenantId: m.tenantId,
    tenantName: m.tenant.name,
    tenantCode: m.tenant.code,
    isOwner: m.isOwner,
  }));

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar isPlatformAdmin={session.user.isPlatformAdmin} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          user={{
            fullName: session.user.fullName,
            email: session.user.email,
            isPlatformAdmin: session.user.isPlatformAdmin,
          }}
          activeTenant={tenantCtx.tenant}
          memberships={formattedMemberships}
          roles={tenantCtx.roles}
        />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
