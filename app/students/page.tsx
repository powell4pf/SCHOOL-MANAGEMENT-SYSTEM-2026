import StudentsManager from "@/components/students/students-manager";
import AppShell from "@/components/layout/app-shell";
import "./students.css";

export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import { isAuthConfigured } from "@/lib/auth";

export default async function StudentsPage() {
  if (!isAuthConfigured()) return <AppShell active="Students"><StudentsManager mode="preview" role="admin"/></AppShell>;
  let session;
  try {
    session = await getCurrentSession();
  } catch {
    redirect("/setup");
  }
  if (!session) redirect("/sign-in");
  if (session.user.role !== "admin" && session.user.role !== "teacher") redirect("/sign-in");
  return <AppShell active="Students"><StudentsManager mode="live" role={session.user.role} staffName={session.user.name}/></AppShell>;
}
