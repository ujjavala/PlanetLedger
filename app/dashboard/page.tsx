import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function DashboardPage() {
  const session = await auth0.getSession();
  if (!session) {
    redirect("/auth/login?returnTo=/dashboard");
  }
  return <DashboardShell email={session.user.email ?? undefined} />;
}
