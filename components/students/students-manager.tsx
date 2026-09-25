"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft, ArrowUpRight, CalendarDays, Check, ChevronDown,
  ChevronLeft, ChevronRight, CircleHelp, Download, GraduationCap, Mail,
  Phone, Plus, Search, SlidersHorizontal, Users, X,
} from "lucide-react";
import SignOutButton from "@/components/auth/sign-out-button";

type StudentStatus = "Active" | "On leave";
type Student = {
  id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  grade: string;
  className: string;
  gender: string;
  dateOfBirth: string;
  guardian: string;
  guardianPhone: string;
  email: string;
  enrolledOn: string;
  status: StudentStatus;
};

const sampleStudents: Student[] = [
  { id:"s-001", firstName:"Mia", lastName:"Gordon", admissionNumber:"EDU-2025-001", grade:"Grade 7", className:"7A", gender:"Female", dateOfBirth:"2012-04-18", guardian:"Olivia Gordon", guardianPhone:"+254 700 000 101", email:"mia.gordon@example.test", enrolledOn:"2025-01-08", status:"Active" },
  { id:"s-002", firstName:"Alex", lastName:"Campbell", admissionNumber:"EDU-2025-002", grade:"Grade 8", className:"8B", gender:"Male", dateOfBirth:"2011-09-03", guardian:"Jordan Campbell", guardianPhone:"+254 700 000 102", email:"alex.campbell@example.test", enrolledOn:"2025-01-08", status:"Active" },
  { id:"s-003", firstName:"Aiden", lastName:"Kim", admissionNumber:"EDU-2025-003", grade:"Grade 7", className:"7B", gender:"Male", dateOfBirth:"2012-11-22", guardian:"Jamie Kim", guardianPhone:"+254 700 000 103", email:"aiden.kim@example.test", enrolledOn:"2025-01-09", status:"Active" },
  { id:"s-004", firstName:"Sophia", lastName:"Martinez", admissionNumber:"EDU-2025-004", grade:"Grade 9", className:"9A", gender:"Female", dateOfBirth:"2010-06-14", guardian:"Taylor Martinez", guardianPhone:"+254 700 000 104", email:"sophia.martinez@example.test", enrolledOn:"2025-01-10", status:"Active" },
  { id:"s-005", firstName:"Ethan", lastName:"Wong", admissionNumber:"EDU-2025-005", grade:"Grade 8", className:"8A", gender:"Male", dateOfBirth:"2011-01-30", guardian:"Morgan Wong", guardianPhone:"+254 700 000 105", email:"ethan.wong@example.test", enrolledOn:"2025-01-10", status:"On leave" },
  { id:"s-006", firstName:"Amara", lastName:"Njoroge", admissionNumber:"EDU-2025-006", grade:"Grade 6", className:"6B", gender:"Female", dateOfBirth:"2013-08-09", guardian:"Sam Njoroge", guardianPhone:"+254 700 000 106", email:"amara.njoroge@example.test", enrolledOn:"2025-01-11", status:"Active" },
  { id:"s-007", firstName:"Noah", lastName:"Otieno", admissionNumber:"EDU-2025-007", grade:"Grade 7", className:"7A", gender:"Male", dateOfBirth:"2012-02-05", guardian:"Lee Otieno", guardianPhone:"+254 700 000 107", email:"noah.otieno@example.test", enrolledOn:"2025-01-12", status:"Active" },
  { id:"s-008", firstName:"Zuri", lastName:"Wambui", admissionNumber:"EDU-2025-008", grade:"Grade 9", className:"9B", gender:"Female", dateOfBirth:"2010-12-11", guardian:"Casey Wambui", guardianPhone:"+254 700 000 108", email:"zuri.wambui@example.test", enrolledOn:"2025-01-12", status:"Active" },
];

const blankStudent = {
  firstName:"", lastName:"", admissionNumber:"", grade:"Grade 7", className:"7A",
  gender:"", dateOfBirth:"", guardian:"", guardianPhone:"", email:"", enrolledOn:"", status:"Active" as StudentStatus,
};

function initials(student: Student) {
  return `${student.firstName[0] ?? ""}${student.lastName[0] ?? ""}`.toUpperCase();
}

function formattedDate(value: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", { day:"2-digit", month:"short", year:"numeric" }).format(new Date(`${value}T00:00:00`));
}

function Metric({ icon: Icon, label, value, note, tone }: { icon: typeof Users; label: string; value: string; note: string; tone: string }) {
  return <article className="student-metric"><span className={`metric-icon ${tone}`}><Icon size={18}/></span><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>;
}

function Field({ label, name, type = "text", required = false, value, onChange, placeholder }: {
  label:string; name:string; type?:string; required?:boolean; value:string;
  onChange:(name:string,value:string)=>void; placeholder?:string;
}) {
  return <label className="student-field"><span>{label}{required && <i> *</i>}</span><input name={name} type={type} required={required} value={value} placeholder={placeholder} onChange={event=>onChange(name,event.target.value)}/></label>;
}

export default function StudentsManager({ mode, role, staffName }: { mode:"preview"|"live"; role:"admin"|"teacher"; staffName?:string }) {
  const isPreview = mode === "preview";
  const canManage = role === "admin";
  const [students, setStudents] = useState<Student[]>(isPreview ? sampleStudents : []);
  const [query, setQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState("All grades");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(isPreview ? sampleStudents.length : 0);
  const [summary, setSummary] = useState({ total:sampleStudents.length, active:sampleStudents.filter(student=>student.status === "Active").length, grades:new Set(sampleStudents.map(student=>student.grade)).size });
  const [loading, setLoading] = useState(!isPreview);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [selected, setSelected] = useState<Student | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState(blankStudent);

  useEffect(() => {
    if (isPreview) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setLoadError("");
      const params = new URLSearchParams({ page:String(page), q:query.trim() });
      if (gradeFilter !== "All grades") params.set("grade", gradeFilter);
      if (statusFilter !== "All statuses") params.set("status", statusFilter);
      try {
        const response = await fetch(`/api/students?${params}`, { signal:controller.signal, cache:"no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Student records could not be loaded.");
        setStudents(data.students);
        setTotal(data.total);
        setSummary(data.summary);
      } catch (error) {
        if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : "Student records could not be loaded.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [isPreview, page, query, gradeFilter, statusFilter, reloadKey]);

  function updateField(name:string, value:string) {
    setForm(current=>({...current,[name]:value}));
    setNotice("");
  }

  async function addStudent(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const duplicate = isPreview && students.some(student=>student.admissionNumber.toLocaleLowerCase() === form.admissionNumber.trim().toLocaleLowerCase());
    if (duplicate) {
      setNotice("That admission number is already in use.");
      return;
    }
    const created:Student = {
      ...form,
      firstName:form.firstName.trim(), lastName:form.lastName.trim(), admissionNumber:form.admissionNumber.trim(),
      guardian:form.guardian.trim(), guardianPhone:form.guardianPhone.trim(), email:form.email.trim().toLocaleLowerCase(),
      id:isPreview ? globalThis.crypto.randomUUID() : "pending",
    };
    if (isPreview) setStudents(current=>[created,...current]);
    else {
      try {
        const response = await fetch("/api/students", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(created) });
        const payload = await response.json();
        if (!response.ok) {
          setNotice(payload.error || "The student could not be saved.");
          return;
        }
      } catch {
        setNotice("The student could not be saved. Check your connection and try again.");
        return;
      }
      setPage(1);
      setReloadKey(current=>current+1);
    }
    setQuery(""); setGradeFilter("All grades"); setStatusFilter("All statuses");
    setForm(blankStudent); setShowAdd(false);
    setNotice(`${created.firstName} ${created.lastName} was ${isPreview ? "added to this preview" : "saved"}.`);
  }

  const filtered = useMemo(() => {
    if (!isPreview) return students;
    const term = query.trim().toLocaleLowerCase();
    return students.filter(student => {
      const matchesTerm = !term || [student.firstName,student.lastName,student.admissionNumber,student.grade,student.className,student.guardian].some(value=>value.toLocaleLowerCase().includes(term));
      return matchesTerm && (gradeFilter === "All grades" || student.grade === gradeFilter) && (statusFilter === "All statuses" || student.status === statusFilter);
    });
  }, [isPreview, students, query, gradeFilter, statusFilter]);

  const activeCount = isPreview ? students.filter(student=>student.status === "Active").length : summary.active;
  const gradeCount = isPreview ? new Set(students.map(student=>student.grade)).size : summary.grades;
  const recordTotal = isPreview ? filtered.length : total;
  const pageCount = isPreview ? 1 : Math.max(1, Math.ceil(total / 10));
  const firstRecord = recordTotal ? (page-1)*10+1 : 0;
  const lastRecord = Math.min(page*10, recordTotal);

  function resetFilters() {
    setQuery(""); setGradeFilter("All grades"); setStatusFilter("All statuses"); setPage(1);
  }

  return <main className="students-page">
    <header className="students-topbar"><Link className="back-dashboard" href="/"><ArrowLeft size={15}/> Dashboard</Link><div className={`preview-pill ${isPreview ? "" : "live-pill"}`}><span/>{isPreview ? "Preview mode" : "Live records"}</div><div className="students-user" aria-label={`${staffName ?? "Brandon Septimus"}, ${role}`}><span>{(staffName ?? "Brandon Septimus").split(/\s+/).map(name=>name[0]).slice(0,2).join("").toUpperCase()}</span><b>{staffName ?? "Brandon Septimus"}</b><ChevronDown size={14}/></div>{!isPreview && <SignOutButton/>}</header>
      <div className="students-content">
      <div className="students-breadcrumb">School Management <ChevronRight size={12}/> <span>Students</span></div>
      <section className="students-title-row"><div><div className="eyebrow">PEOPLE &amp; CLASSES</div><h1>Students</h1><p>Manage student records, class placement, and enrollment details.</p></div>{canManage && <button className="primary-button" onClick={()=>{setNotice("");setShowAdd(true)}}><Plus size={16}/> Add student</button>}</section>
      <div className={`preview-note ${isPreview ? "" : "live-note"}`}><CircleHelp size={17}/><span>{isPreview ? <><b>Preview data only.</b> Changes stay in this browser session and reset when you refresh. Sign-in and database storage are required before real student information is used.</> : <><b>{canManage ? "Connected to the school database." : "Teacher access is read-only."}</b> Student names, classes, and enrollment status are visible to staff. Guardian contacts and personal details are restricted to admins.</>}</span></div>
      <section className="student-metrics"><Metric icon={Users} label="Total students" value={String(isPreview ? students.length : summary.total)} note="Across all grades" tone="metric-blue"/><Metric icon={GraduationCap} label="Active students" value={String(activeCount)} note="Currently enrolled" tone="metric-green"/><Metric icon={CalendarDays} label="Grades" value={String(gradeCount)} note="With student records" tone="metric-gold"/></section>
      <section className="student-list-card">
        <div className="list-heading"><div><h2>All students</h2><span>{recordTotal} records</span></div><button className="outline-button" disabled title="Export is not available yet"><Download size={14}/> Export</button></div>
        <div className="student-toolbar"><label className="student-search"><Search size={15}/><input value={query} onChange={event=>{setQuery(event.target.value);setPage(1)}} placeholder="Search by name, admission no. or class" aria-label="Search students"/>{query && <button aria-label="Clear search" onClick={()=>{setQuery("");setPage(1)}}><X size={14}/></button>}</label><label className="filter-control"><SlidersHorizontal size={14}/><select aria-label="Filter by grade" value={gradeFilter} onChange={event=>{setGradeFilter(event.target.value);setPage(1)}}><option>All grades</option>{Array.from({length:12},(_,index)=>`Grade ${index+1}`).map(grade=><option key={grade}>{grade}</option>)}</select><ChevronDown size={12}/></label><label className="filter-control status-filter"><select aria-label="Filter by enrollment status" value={statusFilter} onChange={event=>{setStatusFilter(event.target.value);setPage(1)}}><option>All statuses</option><option>Active</option><option>On leave</option></select><ChevronDown size={12}/></label></div>
        {loading ? <div className="students-empty"><span className="loading-spinner"/><b>Loading student records…</b></div> : loadError ? <div className="students-empty"><CircleHelp size={22}/><b>Records unavailable</b><span>{loadError}</span><button onClick={()=>setReloadKey(key=>key+1)}>Try again</button></div> : filtered.length ? <div className="student-table-scroll"><table className="student-table"><thead><tr><th>STUDENT</th><th>ADMISSION NO.</th><th>GRADE / CLASS</th>{canManage && <th>GUARDIAN</th>}<th>ENROLLED</th><th>STATUS</th><th><span className="visually-hidden">Actions</span></th></tr></thead><tbody>{filtered.map(student=><tr key={student.id}><td><button className="student-name-cell" onClick={()=>setSelected(student)}><span className={`student-initials initials-${student.id.slice(-1)}`}>{initials(student)}</span><span><b>{student.firstName} {student.lastName}</b><small>{canManage ? student.email : `Class ${student.className}`}</small></span></button></td><td className="admission-cell">{student.admissionNumber}</td><td>{student.grade}<small className="table-subline">Class {student.className}</small></td>{canManage && <td>{student.guardian}</td>}<td>{formattedDate(student.enrolledOn)}</td><td><span className={`status-badge ${student.status === "Active" ? "status-active" : "status-leave"}`}><i/>{student.status}</span></td><td><button className="row-action" aria-label={`View ${student.firstName} ${student.lastName}`} onClick={()=>setSelected(student)}><ArrowUpRight size={15}/></button></td></tr>)}</tbody></table></div> : <div className="students-empty"><Search size={22}/><b>No students match those filters</b><span>Try another search term or clear a filter.</span><button onClick={resetFilters}>Clear filters</button></div>}
        <footer className="table-footer"><span>Showing <b>{firstRecord}–{lastRecord}</b> of <b>{recordTotal}</b> students</span><div><button aria-label="Previous page" disabled={page <= 1 || isPreview || loading} onClick={()=>setPage(current=>Math.max(1,current-1))}><ChevronLeft size={15}/></button><button className="current-page" aria-label={`Page ${page}`}>{page}</button><button aria-label="Next page" disabled={page >= pageCount || isPreview || loading} onClick={()=>setPage(current=>Math.min(pageCount,current+1))}><ChevronRight size={15}/></button></div></footer>
      </section>
      <footer className="students-footnote"><span>Student records are private school data.</span><span>Edusync School Management <b>•</b> 2026</span></footer>
    </div>

    {showAdd && canManage && <div className="modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)setShowAdd(false)}}><section className="student-modal" role="dialog" aria-modal="true" aria-labelledby="add-student-title"><header><div><h2 id="add-student-title">Add student</h2><p>Enter the student’s basic enrollment details.</p></div><button className="modal-close" onClick={()=>setShowAdd(false)} aria-label="Close"><X size={18}/></button></header><form onSubmit={addStudent}><div className="form-grid"><Field label="First name" name="firstName" required value={form.firstName} onChange={updateField}/><Field label="Last name" name="lastName" required value={form.lastName} onChange={updateField}/><Field label="Admission number" name="admissionNumber" required value={form.admissionNumber} onChange={updateField} placeholder="e.g. EDU-2026-009"/><label className="student-field"><span>Gender</span><select value={form.gender} onChange={event=>updateField("gender",event.target.value)}><option value="">Select gender</option><option>Female</option><option>Male</option><option>Prefer not to say</option></select></label><label className="student-field"><span>Grade</span><select value={form.grade} onChange={event=>{updateField("grade",event.target.value);updateField("className",`${event.target.value.replace("Grade ","")}A`)}}>{Array.from({length:12},(_,index)=>`Grade ${index+1}`).map(grade=><option key={grade}>{grade}</option>)}</select></label><label className="student-field"><span>Class</span><select value={form.className} onChange={event=>updateField("className",event.target.value)}>{Array.from({length:12},(_,index)=>[`${index+1}A`,`${index+1}B`]).flat().map(className=><option key={className}>{className}</option>)}</select></label><Field label="Date of birth" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={updateField}/><Field label="Enrollment date" name="enrolledOn" type="date" required value={form.enrolledOn} onChange={updateField}/><div className="form-divider"><span>Parent or guardian</span></div><Field label="Guardian full name" name="guardian" required value={form.guardian} onChange={updateField}/><Field label="Guardian phone" name="guardianPhone" type="tel" required value={form.guardianPhone} onChange={updateField} placeholder="+254 7xx xxx xxx"/><Field label="Student email (optional)" name="email" type="email" value={form.email} onChange={updateField}/><label className="student-field"><span>Enrollment status</span><select value={form.status} onChange={event=>updateField("status",event.target.value)}><option>Active</option><option>On leave</option></select></label></div>{notice && <p className="form-error" role="alert">{notice}</p>}<div className="modal-actions"><button type="button" className="outline-button" onClick={()=>setShowAdd(false)}>Cancel</button><button type="submit" className="primary-button"><Check size={15}/> {isPreview ? "Add to preview" : "Save student"}</button></div></form></section></div>}

    {selected && <div className="modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)setSelected(null)}}><section className="student-profile-modal" role="dialog" aria-modal="true" aria-labelledby="student-profile-title"><button className="modal-close profile-close" onClick={()=>setSelected(null)} aria-label="Close student profile"><X size={18}/></button><div className="profile-cover"/><div className="profile-content"><span className={`profile-initials initials-${selected.id.slice(-1)}`}>{initials(selected)}</span><span className={`status-badge ${selected.status === "Active" ? "status-active" : "status-leave"}`}><i/>{selected.status}</span><h2 id="student-profile-title">{selected.firstName} {selected.lastName}</h2><p className="profile-admission">{selected.admissionNumber}</p><div className="profile-grade"><GraduationCap size={15}/>{selected.grade} <span>·</span> Class {selected.className}</div><div className="profile-details"><h3>Student information</h3><div><span>Date of birth</span><b>{canManage ? formattedDate(selected.dateOfBirth) : "Restricted"}</b></div><div><span>Gender</span><b>{canManage ? selected.gender || "Not provided" : "Restricted"}</b></div><div><span>Enrollment date</span><b>{formattedDate(selected.enrolledOn)}</b></div>{canManage && <><h3>Parent or guardian</h3><div><span>Name</span><b>{selected.guardian}</b></div><div><span>Phone</span><b><Phone size={13}/>{selected.guardianPhone}</b></div><div><span>Email</span><b><Mail size={13}/>{selected.email || "Not provided"}</b></div></>}</div><button className="outline-button profile-done" onClick={()=>setSelected(null)}>Close profile</button></div></section></div>}
    {notice && !showAdd && !selected && <div className="students-toast" role="status"><span><Check size={14}/></span>{notice}<button onClick={()=>setNotice("")} aria-label="Dismiss"><X size={14}/></button></div>}
  </main>;
}
