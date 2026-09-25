import { redirect } from "next/navigation";
import AppShell from "@/components/layout/app-shell";
import DashboardClient from "@/components/dashboard/dashboard-client";
import { getCurrentSession } from "@/lib/session";
import { isAuthConfigured } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (!isAuthConfigured()) return <AppShell active="Dashboard"><DashboardClient preview/></AppShell>;
  let session;
  try {
    session = await getCurrentSession();
  } catch {
    redirect("/setup");
  }
  if (!session) redirect("/sign-in");
  if (session.user.role !== "admin" && session.user.role !== "teacher") redirect("/sign-in");
  return <AppShell active="Dashboard"><DashboardClient staffName={session.user.name} staffRole={session.user.role}/></AppShell>;
}
