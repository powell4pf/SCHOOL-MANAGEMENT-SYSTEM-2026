import Link from "next/link";
import {
  CalendarDays, ClipboardList, GraduationCap, LayoutDashboard, Megaphone, NotebookPen, Users,
} from "lucide-react";

const links = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Students", href: "/students", icon: GraduationCap },
  { label: "Teachers", href: "/teachers", icon: NotebookPen },
  { label: "Staff", href: "/staffs", icon: Users },
  { label: "Schedule", href: "/schedule", icon: CalendarDays },
  { label: "Exams", href: "/exam", icon: ClipboardList },
  { label: "Notices", href: "/notice", icon: Megaphone },
];

export default function AppShell({ active, children }: { active: string; children: React.ReactNode }) {
  return <div className="school-shell">
    <aside className="school-sidebar">
      <Link className="shell-brand" href="/"><span className="shell-brand-mark">E</span><span><b>Edusync</b><small>School workspace</small></span></Link>
      <nav aria-label="Main navigation" className="shell-nav">
        <p className="shell-nav-label">WORKSPACE</p>
        {links.map(({ label, href, icon: Icon }) => <Link key={label} href={href} className={`shell-nav-link${active === label ? " active" : ""}`} aria-current={active === label ? "page" : undefined}><Icon size={17} strokeWidth={1.8}/><span>{label}</span></Link>)}
      </nav>
      <div className="shell-sidebar-foot"><span className="shell-status-dot"/>Connected school database</div>
    </aside>
    <div className="school-main">{children}</div>
  </div>;
}
