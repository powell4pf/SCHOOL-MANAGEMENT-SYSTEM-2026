import StudentsManager from "@/components/students/students-manager";
import "./students.css";

export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import { isAuthConfigured } from "@/lib/auth";

export default async function StudentsPage() {
  if (!isAuthConfigured()) return <StudentsManager mode="preview" role="admin"/>;
  let session;
  try {
    session = await getCurrentSession();
  } catch {
    redirect("/setup");
  }
  if (!session) redirect("/sign-in");
  if (session.user.role !== "admin" && session.user.role !== "teacher") redirect("/sign-in");
  return <StudentsManager mode="live" role={session.user.role} staffName={session.user.name}/>;
}
