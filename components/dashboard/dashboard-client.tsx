"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity, AlertCircle, ArrowRight, CalendarDays, ClipboardList,
  GraduationCap, Megaphone, RefreshCw, Users,
} from "lucide-react";
import SignOutButton from "@/components/auth/sign-out-button";
import type { SchoolRecord } from "@/lib/school-data";

type DashboardData = {
  metrics: { students: number; activeStudents: number; teachers: number; staff: number; upcomingSchedule: number; upcomingExams: number; publishedNotices: number };
  enrollmentByGrade: { grade: string; count: number }[];
  latestStudents: { id: string; name: string; admissionNumber: string; grade: string; className: string; enrolledOn: string }[];
  schedule: SchoolRecord[];
  exams: SchoolRecord[];
  notices: SchoolRecord[];
  updatedAt: string;
};

function dateLabel(value?: string) {
  if (!value) return "No date set";
  return new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function Empty({ children, href, action }: { children: React.ReactNode; href: string; action: string }) {
  return <div className="dashboard-empty"><span><Activity size={17}/></span><p>{children}</p><Link href={href}>{action}<ArrowRight size={13}/></Link></div>;
}

function SummaryCard({ href, label, value, detail, icon: Icon, tone }: { href: string; label: string; value: number; detail: string; icon: typeof Users; tone: string }) {
  return <Link className="overview-card" href={href}><span className={`overview-icon ${tone}`}><Icon size={18}/></span><span className="overview-copy"><small>{label}</small><strong>{value.toLocaleString()}</strong><em>{detail}</em></span><ArrowRight className="overview-arrow" size={15}/></Link>;
}

export default function DashboardClient({ staffName, staffRole, preview = false }: { staffName?: string; staffRole?: string; preview?: boolean }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(!preview);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const refresh = useCallback(async () => {
    if (preview) return;
    setRefreshing(true);
    try {
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Dashboard data could not be loaded.");
      setData(body);
      setError("");
      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Dashboard data could not be loaded.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [preview]);

  useEffect(() => {
    if (preview) return;
    const initial = window.setTimeout(() => void refresh(), 0);
    const interval = window.setInterval(() => void refresh(), 15_000);
    return () => { window.clearTimeout(initial); window.clearInterval(interval); };
  }, [preview, refresh]);

  const metrics = data?.metrics;
  const maxGradeCount = Math.max(1, ...(data?.enrollmentByGrade.map(item => item.count) ?? [1]));

  return <div className="dashboard-page">
    <header className="workspace-topbar"><div><span className="workspace-kicker">SCHOOL WORKSPACE</span><h1>Dashboard</h1></div><div className="workspace-user"><span className="workspace-avatar">{(staffName || "Preview").split(/\s+/).map(part => part[0]).slice(0,2).join("").toUpperCase()}</span><span className="workspace-user-copy"><b>{staffName || "Preview mode"}</b><small>{staffRole === "admin" ? "Administrator" : staffRole === "teacher" ? "Teacher" : "Sample workspace"}</small></span><button className="refresh-button" type="button" onClick={() => void refresh()} disabled={refreshing || preview} aria-label="Refresh dashboard"><RefreshCw size={15} className={refreshing ? "is-spinning" : ""}/><span>Refresh</span></button><SignOutButton/></div></header>
    <div className="dashboard-content">
      {preview && <div className="dashboard-callout"><AlertCircle size={17}/><span>Database setup is required before live school records can appear.</span><Link href="/setup">Setup database</Link></div>}
      {!preview && error && <div className="dashboard-callout error"><AlertCircle size={17}/><span>{error}</span><button type="button" onClick={() => void refresh()}>Retry</button></div>}
      <section className="overview-cards" aria-label="Live school totals">
        <SummaryCard href="/students" label="Students" value={metrics?.students ?? 0} detail={`${(metrics?.activeStudents ?? 0).toLocaleString()} active`} icon={GraduationCap} tone="blue"/>
        <SummaryCard href="/teachers" label="Teachers" value={metrics?.teachers ?? 0} detail="Active teachers" icon={Users} tone="violet"/>
        <SummaryCard href="/staffs" label="Other staff" value={metrics?.staff ?? 0} detail="Active staff" icon={Users} tone="green"/>
        <SummaryCard href="/schedule" label="Upcoming events" value={metrics?.upcomingSchedule ?? 0} detail="On the school schedule" icon={CalendarDays} tone="gold"/>
        <SummaryCard href="/exam" label="Upcoming exams" value={metrics?.upcomingExams ?? 0} detail="Scheduled examinations" icon={ClipboardList} tone="rose"/>
        <SummaryCard href="/notice" label="Published notices" value={metrics?.publishedNotices ?? 0} detail="Visible to the school" icon={Megaphone} tone="teal"/>
      </section>

      <section className="dashboard-panels">
        <article className="dashboard-panel enrollment-panel"><div className="dashboard-panel-heading"><div><span className="panel-eyebrow">STUDENT RECORDS</span><h2>Enrollment by grade</h2></div><Link href="/students">View students <ArrowRight size={13}/></Link></div>
          {loading ? <div className="panel-loading">Loading current enrollment…</div> : data?.enrollmentByGrade.length ? <div className="enrollment-list">{data.enrollmentByGrade.map(item => <div className="enrollment-row" key={item.grade}><span>{item.grade}</span><div><i style={{ width: `${Math.max(3, item.count / maxGradeCount * 100)}%` }}/></div><b>{item.count}</b></div>)}</div> : <Empty href="/students" action="Add a student">No student enrollment records yet.</Empty>}
        </article>

        <article className="dashboard-panel latest-panel"><div className="dashboard-panel-heading"><div><span className="panel-eyebrow">RECENTLY ADDED</span><h2>Latest students</h2></div><Link href="/students">All students <ArrowRight size={13}/></Link></div>
          {loading ? <div className="panel-loading">Loading student records…</div> : data?.latestStudents.length ? <div className="latest-students">{data.latestStudents.map(student => <Link href="/students" className="latest-student" key={student.id}><span className="latest-initials">{student.name.split(/\s+/).map(part=>part[0]).slice(0,2).join("").toUpperCase()}</span><span className="latest-name"><b>{student.name}</b><small>{student.admissionNumber}</small></span><span className="latest-class">{student.grade} · {student.className}</span></Link>)}</div> : <Empty href="/students" action="Add a student">No student records yet.</Empty>}
        </article>

        <DashboardItemPanel title="Upcoming schedule" eyebrow="SCHOOL CALENDAR" records={data?.schedule ?? []} loading={loading} href="/schedule" empty="No upcoming schedule items." action="Add an event" icon={CalendarDays}/>
        <DashboardItemPanel title="Upcoming exams" eyebrow="ASSESSMENTS" records={data?.exams ?? []} loading={loading} href="/exam" empty="No exams have been scheduled." action="Schedule an exam" icon={ClipboardList}/>
        <DashboardItemPanel title="Published notices" eyebrow="SCHOOL UPDATES" records={data?.notices ?? []} loading={loading} href="/notice" empty="No published notices yet." action="Create a notice" icon={Megaphone}/>
      </section>
      <footer className="dashboard-footer"><span><i/> Live database records refresh every 15 seconds.</span><span>{lastUpdated ? `Last updated ${lastUpdated}` : preview ? "Preview contains no saved records" : "Waiting for data"}</span></footer>
    </div>
  </div>;
}

function DashboardItemPanel({ title, eyebrow, records, loading, href, empty, action, icon: Icon }: { title: string; eyebrow: string; records: SchoolRecord[]; loading: boolean; href: string; empty: string; action: string; icon: typeof Users }) {
  return <article className="dashboard-panel"><div className="dashboard-panel-heading"><div><span className="panel-eyebrow">{eyebrow}</span><h2>{title}</h2></div><Link href={href}>View all <ArrowRight size={13}/></Link></div>
    {loading ? <div className="panel-loading">Loading records…</div> : records.length ? <div className="dashboard-item-list">{records.map(record => <Link href={href} className="dashboard-item" key={record.id}><span className="item-icon"><Icon size={16}/></span><span className="dashboard-item-copy"><b>{record.title}</b><small>{record.location || record.audience || "Whole school"}</small></span><time>{dateLabel(record.startsAt)}</time></Link>)}</div> : <Empty href={href} action={action}>{empty}</Empty>}
  </article>;
}
