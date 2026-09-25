import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/layout/app-shell";
import SchoolRecordsManager from "@/components/school/records-manager";
import { getCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const sections = {
  teachers: { label: "Teachers", kind: "teacher" as const, description: "Maintain the teacher directory, subjects, and employment status." },
  staffs: { label: "Staff", kind: "staff" as const, description: "Manage the school’s non-teaching staff directory." },
  schedule: { label: "Schedule", kind: "schedule" as const, description: "Plan and update events on the school calendar." },
  exam: { label: "Exams", kind: "exam" as const, description: "Create and maintain upcoming examination dates and venues." },
  notice: { label: "Notices", kind: "notice" as const, description: "Publish announcements for the school community." },
};

export default async function SchoolSectionPage({ params }: PageProps<"/[section]">) {
  const { section } = await params;
  const config = sections[section as keyof typeof sections];
  if (!config) notFound();
  let session;
  try {
    session = await getCurrentSession();
  } catch {
    redirect("/setup");
  }
  if (!session) redirect("/sign-in");
  if (session.user.role !== "admin" && session.user.role !== "teacher") redirect("/sign-in");
  return <AppShell active={config.label}><SchoolRecordsManager kind={config.kind} title={config.label} description={config.description} role={session.user.role} staffName={session.user.name}/></AppShell>;
}
