import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
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
    if (session.user.memberships.length > 0) {
      redirect("/select-company");
    }
    if (session.user.isPlatformAdmin) {
      redirect("/platform");
    }
    redirect("/login");
  }

  let formattedMemberships = session.user.memberships.map((m: any) => ({
    tenantId: m.tenantId,
    tenantName: m.tenant?.name || "",
    tenantCode: m.tenant?.code || "",
    tenantLogoUrl: m.tenant?.settings?.logoUrl || null,
    isOwner: m.isOwner,
  }));

  if (session.user.isPlatformAdmin) {
    const allTenants = await prisma.tenant.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        code: true,
        settings: {
          select: { logoUrl: true },
        },
      },
    });
    formattedMemberships = allTenants.map((t) => ({
      tenantId: t.id,
      tenantName: t.name,
      tenantCode: t.code,
      tenantLogoUrl: t.settings?.logoUrl || null,
      isOwner: true,
    }));
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar
        isPlatformAdmin={session.user.isPlatformAdmin}
        isClientUser={tenantCtx?.isClientUser}
        activeTenant={tenantCtx.tenant}
      />
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
