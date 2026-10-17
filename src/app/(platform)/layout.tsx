import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { PlatformSidebar } from "@/components/layout/PlatformSidebar";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();

  if (!session || !session.user) {
    redirect("/login");
  }

  if (!session.user.isPlatformAdmin) {
    redirect("/app/dashboard");
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <PlatformSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8 bg-slate-900/60">
          {children}
        </main>
      </div>
    </div>
  );
}
