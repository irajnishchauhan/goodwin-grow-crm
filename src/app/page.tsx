import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";

export default async function RootPage() {
  const session = await getCurrentSession();

  if (session && session.user) {
    if (session.user.isPlatformAdmin && !session.activeTenantId) {
      redirect("/platform");
    }
    redirect("/app/dashboard");
  }

  redirect("/platform");
}
