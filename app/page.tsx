import {
  Bell, CalendarDays, ChartNoAxesCombined, ChevronDown, ChevronLeft, ChevronRight,
  ClipboardList, GraduationCap, LayoutDashboard, MoreHorizontal,
  NotebookPen, Search, ShieldAlert, Trophy, Users,
} from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import { isAuthConfigured } from "@/lib/auth";
import SignOutButton from "@/components/auth/sign-out-button";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Students", icon: GraduationCap },
  { label: "Teachers", icon: NotebookPen },
  { label: "Staffs", icon: Users },
  { label: "Schedule", icon: CalendarDays },
  { label: "Exam", icon: ClipboardList },
  { label: "Notice", icon: ShieldAlert },
];

const activities = [
  { icon: Trophy, title: "Best in Show at Statewide Art Contest", text: "Aiden Kim created a stunning, mixed-media landscape piece.", date: "May 5", time: "1:30 PM", tone: "blue" },
  { icon: GraduationCap, title: "Gold Medal in National Math Olympiad", text: "Ethan Wong solved complex problems with outstanding skills.", date: "Apr 10", time: "10:00 AM", tone: "gold" },
  { icon: ChartNoAxesCombined, title: "First Place in Regional Science Fair", text: "Sophia Martinez innovated a new water purification system.", date: "Mar 15", time: "2:00 PM", tone: "blue" },
];

const events = [
  { day: "15 Jul", time: "7:00 AM – 8:00 AM", title: "New Student Inauguration Ceremony", grade: "Grade 7" },
  { day: "19 Jul", time: "10:00 AM – 11:00 AM", title: "Chairman of Student Body Handover", grade: "Grade 8" },
  { day: "27 Jul", time: "3:00 PM", title: "Closing of School Clubs Acceptance", grade: "Grade 7" },
];

const calendarDays = [
  ["29", "outside"], ["30", "outside"], ["1", ""], ["2", ""], ["3", ""], ["4", ""], ["5", ""],
  ["6", ""], ["7", ""], ["8", ""], ["9", ""], ["10", "today"], ["11", ""], ["12", ""],
  ["13", ""], ["14", ""], ["15", "event"], ["16", ""], ["17", ""], ["18", ""], ["19", "event"],
  ["20", ""], ["21", ""], ["22", ""], ["23", ""], ["24", ""], ["25", ""], ["26", ""],
  ["27", ""], ["28", "event"], ["29", ""], ["30", ""], ["31", ""], ["1", "outside"], ["2", "outside"],
];

function Select({ children }: { children: React.ReactNode }) {
  return <button className="select-button">{children}<ChevronDown size={12} /></button>;
}

function PanelHeading({ title, action }: { title: string; action?: React.ReactNode }) {
  return <div className="panel-heading"><h2>{title}</h2>{action}</div>;
}

function StatCard({ amount, label, blue = false }: { amount: string; label: string; blue?: boolean }) {
  return <article className={`stat-card${blue ? " stat-blue" : ""}`}><div><strong>{amount}</strong><span>{label}</span></div><span className="stat-arrow">↗</span></article>;
}

function EarningsChart() {
  return <div className="chart-layout"><div className="chart-labels"><span>100k</span><span>75k</span><span>50k</span><span>25k</span><span>0k</span></div><svg className="earnings-chart" viewBox="0 0 440 150" preserveAspectRatio="none" role="img" aria-label="Earnings and expenses over eight months">
    <defs><linearGradient id="earnFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#ffca55" stopOpacity=".28"/><stop offset="1" stopColor="#ffca55" stopOpacity="0"/></linearGradient><linearGradient id="expenseFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#0870fb" stopOpacity=".22"/><stop offset="1" stopColor="#0870fb" stopOpacity="0"/></linearGradient></defs>
    <path className="chart-grid" d="M0 15H440M0 45H440M0 75H440M0 105H440M0 135H440"/><path fill="url(#earnFill)" d="M0 100 C25 84 43 74 65 80 S100 99 122 76 S159 54 181 80 S211 98 232 62 S270 29 293 54 S338 60 361 47 S408 52 440 13V150H0Z"/><path fill="url(#expenseFill)" d="M0 111 C30 100 49 91 70 98 S103 121 124 101 S156 80 178 99 S211 111 232 84 S269 70 291 91 S334 101 359 87 S404 86 440 39V150H0Z"/><path className="earn-line" d="M0 100 C25 84 43 74 65 80 S100 99 122 76 S159 54 181 80 S211 98 232 62 S270 29 293 54 S338 60 361 47 S408 52 440 13"/><path className="expense-line" d="M0 111 C30 100 49 91 70 98 S103 121 124 101 S156 80 178 99 S211 111 232 84 S269 70 291 91 S334 101 359 87 S404 86 440 39"/><circle cx="232" cy="84" r="4" fill="white" stroke="#ffca55" strokeWidth="2"/>
  </svg></div>;
}

function Dashboard({ staffName, staffRole }: { staffName?: string; staffRole?: string }) {
  return <div className="app-frame">
    <header className="masthead"><div className="admin-badge"><span className="badge-mark">◐</span>ADMIN DASHBOARD</div><button className="apps-button" aria-label="Apps"><span/><span/><span/><span/></button></header>
    <main className="dashboard">
      <aside className="sidebar"><div className="school-brand"><span className="brand-icon">◆</span><b>Edusync</b></div><nav>{navigation.map(({ label, icon: Icon, active }) => <a key={label} className={`nav-link${active ? " nav-active" : ""}`} href={label === "Students" ? "/students" : `#${label.toLowerCase()}`}><Icon size={16} strokeWidth={1.7}/><span>{label}</span></a>)}</nav></aside>
      <section className="center-column"><div className="center-topbar"><h1>Dashboard</h1><div className="search-box"><Search size={14}/><input placeholder="Search" aria-label="Search"/><button aria-label="Voice search">♩</button></div></div>
        <section className="stats-grid" aria-label="School statistics"><StatCard amount="1,738" label="Students"/><StatCard amount="179" label="Teachers"/><StatCard amount="165" label="Staffs"/><StatCard amount="893" label="Awards" blue/></section>
        <div className="content-grid">
          <article className="panel students-panel"><PanelHeading title="Students" action={<Select>Grade 7</Select>}/><div className="donut-wrap"><div className="donut"><div className="donut-center"><small>Total</small><b>427</b></div></div></div><div className="student-legend"><span><i className="dot yellow"/>Girls <b>234</b></span><span><i className="dot blue"/>Boys <b>193</b></span></div></article>
          <article className="panel earnings-panel"><PanelHeading title="Earnings" action={<Select>Last 8 Months</Select>}/><div className="chart-legend"><span><i className="dot yellow"/>Earnings</span><span><i className="dot blue"/>Expenses</span></div><EarningsChart/><div className="month-labels"><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span></div></article>
          <article className="panel attendance-panel"><PanelHeading title="Attendance" action={<Select>Weekly</Select>}/><div className="chart-legend"><span><i className="dot yellow"/>Present</span><span><i className="dot blue"/>Absent</span></div><div className="attendance-chart"><div className="att-labels"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div><div className="attendance-bars">{[["Mon",72],["Tue",55],["Wed",68],["Thu",49],["Fri",70]].map(([day, value])=><div className="bar-column" key={day}><div className="bar" style={{"--present":`${value}%`} as React.CSSProperties}/><span>{day}</span></div>)}</div></div></article>
          <article className="panel activities-panel"><PanelHeading title="Student Activities" action={<button className="more-button" aria-label="More activities"><MoreHorizontal size={15}/></button>}/><div className="activity-list">{activities.map(({icon: Icon,title,text,date,time,tone})=><div className="activity-row" key={title}><span className={`activity-icon ${tone}`}><Icon size={15}/></span><div className="activity-copy"><b>{title}</b><p>{text}</p></div><time>{date}<small>{time}</small></time></div>)}</div></article>
          <article className="panel notice-panel"><PanelHeading title="Notice Board" action={<span className="sort-label">Sort by: <Select>Latest</Select></span>}/><div className="notice-row"><span className="notice-thumb">◉</span><div><b>School Event Reminder</b><p>By Ms. Harper, Event Coordinator</p></div><time>May 29, 2025</time><span className="notice-count">◉ 436</span></div><div className="notice-row"><span className="notice-thumb second">▣</span><div><b>Parent Teacher Meeting</b><p>By School Administration</p></div><time>May 27, 2025</time><span className="notice-count">◉ 218</span></div></article>
          <article className="panel messages-panel"><PanelHeading title="Messages" action={<button className="more-button" aria-label="More messages"><MoreHorizontal size={15}/></button>}/>{[["👩🏽","Alex Campbell","Just wanted to check in on how e...","2:36 PM"],["👩🏻","Mrs. Patel","Thank you for sharing the update...","10:32 AM"]].map(([avatar,name,message,time])=><div className="message-row" key={name}><span className="avatar small-avatar">{avatar}</span><div><b>{name}</b><p>{message}</p></div><time>{time}</time></div>)}</article>
        </div>
      </section>
      <aside className="right-column"><div className="profile-row"><span className="avatar profile-avatar">👨🏽</span><div className="profile-name"><b>{staffName ?? "Brandon Septimus"}</b><small>{staffRole ?? "Admin"}</small></div>{staffName ? <SignOutButton/> : <button className="notification-button" aria-label="Notifications"><Bell size={16}/><i/></button>}</div>
        <section className="calendar-panel"><div className="calendar-heading"><h2>July 2025</h2><div><button aria-label="Previous month"><ChevronLeft size={15}/></button><button aria-label="Next month"><ChevronRight size={15}/></button></div></div><div className="weekdays">{["Su","Mo","Tu","We","Th","Fr","Sa"].map(d=><span key={d}>{d}</span>)}</div><div className="calendar-days">{calendarDays.map(([day,state],i)=><span key={`${day}-${i}`} className={state}>{day}</span>)}</div></section>
        <section className="upcoming-section"><div className="right-heading"><h2>Upcoming Events</h2><button aria-label="More events"><MoreHorizontal size={15}/></button></div><div className="event-list">{events.map(event=><article className="event-card" key={event.title}><time><b>{event.day}</b><span>{event.time}</span></time><p>{event.title}</p><small>{event.grade}</small></article>)}</div></section>
        <section className="recent-section"><div className="right-heading"><h2>Recent Activity</h2><a href="#activity">View All</a></div><div className="recent-entry"><span className="avatar">👩🏽</span><p><b>Mia Gordon</b> won her match, contributing to the team’s overall victory.</p></div><div className="recent-entry"><span className="avatar">👨🏻</span><p><b>Alex Campbell</b> shared a new announcement with Grade 7.</p></div></section>
      </aside>
    </main>
  </div>;
}

export default async function Home() {
  if (!isAuthConfigured()) return <Dashboard/>;
  let session;
  try {
    session = await getCurrentSession();
  } catch {
    redirect("/setup");
  }
  if (!session) redirect("/sign-in");
  const role = session.user.role === "admin" ? "Admin" : "Teacher";
  return <Dashboard staffName={session.user.name} staffRole={role}/>;
}
