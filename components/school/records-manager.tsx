"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AlertCircle, CalendarDays, Check, Clock3, Mail, MapPin, Pencil, Plus, RefreshCw, Search, Trash2, Users, X } from "lucide-react";
import SignOutButton from "@/components/auth/sign-out-button";
import type { SchoolKind, SchoolRecord } from "@/lib/school-data";

type Draft = Record<string, string>;
const personKinds = new Set<SchoolKind>(["teacher", "staff"]);
const typeNames: Record<SchoolKind, string> = { teacher: "teacher", staff: "staff member", schedule: "event", exam: "exam", notice: "notice" };

function blankDraft(kind: SchoolKind): Draft {
  if (personKinds.has(kind)) return { employeeNumber: "", firstName: "", lastName: "", email: "", phone: "", department: "", jobTitle: "", status: "Active" };
  return { title: "", description: "", startsAt: "", endsAt: "", location: "", audience: "Whole school", status: kind === "notice" ? "Published" : "Scheduled" };
}

function inputDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function dateTime(value?: string) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function statusClass(value: string) {
  return value.toLowerCase().replaceAll(" ", "-");
}

export default function SchoolRecordsManager({ kind, title, description, role, staffName }: { kind: SchoolKind; title: string; description: string; role: string; staffName: string }) {
  const canManage = role === "admin";
  const [records, setRecords] = useState<SchoolRecord[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SchoolRecord | null>(null);
  const [draft, setDraft] = useState<Draft>(() => blankDraft(kind));
  const [reloadKey, setReloadKey] = useState(0);

  const loadRecords = useCallback(async (signal?: AbortSignal) => {
    try {
      const params = new URLSearchParams({ kind, q: query.trim() });
      const response = await fetch(`/api/school-records?${params}`, { cache: "no-store", signal });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Records could not be loaded.");
      setRecords(payload.records);
      setError("");
    } catch (cause) {
      if (signal?.aborted) return;
      setError(cause instanceof Error ? cause.message : "Records could not be loaded.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [kind, query]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void loadRecords(controller.signal), 180);
    const interval = window.setInterval(() => void loadRecords(), 15_000);
    return () => { window.clearTimeout(timer); window.clearInterval(interval); controller.abort(); };
  }, [loadRecords, reloadKey]);

  function openCreate() {
    setEditing(null);
    setDraft(blankDraft(kind));
    setMessage("");
    setModalOpen(true);
  }

  function openEdit(record: SchoolRecord) {
    const next = Object.fromEntries(Object.entries(record).map(([key, value]) => [key, value == null ? "" : String(value)]));
    if (!personKinds.has(kind)) {
      next.startsAt = inputDate(record.startsAt);
      next.endsAt = inputDate(record.endsAt);
    }
    setEditing(record);
    setDraft({ ...blankDraft(kind), ...next });
    setMessage("");
    setModalOpen(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/school-records", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, kind, ...(editing ? { id: editing.id } : {}) }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "The record could not be saved.");
      setModalOpen(false);
      setMessage(`${title.slice(0, -1) || title} ${editing ? "updated" : "created"}.`);
      setReloadKey(value => value + 1);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "The record could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(record: SchoolRecord) {
    const name = personKinds.has(kind) ? `${record.firstName} ${record.lastName}` : record.title;
    if (!window.confirm(`Remove “${name}” from ${title.toLowerCase()}? This cannot be undone.`)) return;
    setError("");
    try {
      const response = await fetch("/api/school-records", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: record.id, kind }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "The record could not be removed.");
      setMessage(`${name} was removed.`);
      setReloadKey(value => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The record could not be removed.");
    }
  }

  function field(name: string, value: string) {
    setDraft(current => ({ ...current, [name]: value }));
  }

  return <div className="school-records-page">
    <header className="workspace-topbar"><div><span className="workspace-kicker">SCHOOL WORKSPACE</span><h1>{title}</h1></div><div className="workspace-user"><span className="workspace-avatar">{staffName.split(/\s+/).map(part=>part[0]).slice(0,2).join("").toUpperCase()}</span><span className="workspace-user-copy"><b>{staffName}</b><small>{canManage ? "Administrator" : "Teacher · Read only"}</small></span><button className="refresh-button" type="button" onClick={() => setReloadKey(value=>value+1)} disabled={loading} aria-label={`Refresh ${title}`}><RefreshCw size={15}/><span>Refresh</span></button><SignOutButton/></div></header>
    <div className="records-content">
      <div className="records-heading"><div><span className="panel-eyebrow">SCHOOL WORKSPACE / {title.toUpperCase()}</span><h2>{title}</h2><p>{description}</p></div>{canManage && <button className="primary-action" type="button" onClick={openCreate}><Plus size={16}/> Add {typeNames[kind]}</button>}</div>
      {kind === "teacher" && <div className="records-hint"><AlertCircle size={15}/>This directory stores teacher details. Create sign-in accounts separately with the administrator setup command.</div>}
      {message && <div className="records-message" role="status"><Check size={15}/>{message}<button type="button" onClick={()=>setMessage("")} aria-label="Dismiss"><X size={14}/></button></div>}
      {error && <div className="records-error" role="alert"><AlertCircle size={16}/><span>{error}</span><button type="button" onClick={()=>setReloadKey(value=>value+1)}>Try again</button></div>}
      <section className="records-card">
        <div className="records-toolbar"><div><h3>{personKinds.has(kind) ? "Directory" : "All records"}</h3><span>{records.length} {records.length === 1 ? "record" : "records"}</span></div><label className="records-search"><Search size={16}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder={`Search ${title.toLowerCase()}…`} aria-label={`Search ${title}`}/>{query && <button type="button" onClick={()=>setQuery("")} aria-label="Clear search"><X size={14}/></button>}</label></div>
        {loading ? <div className="records-empty"><span className="loading-spinner"/><b>Loading {title.toLowerCase()}…</b></div> : records.length === 0 ? <div className="records-empty"><span className="records-empty-icon">{personKinds.has(kind) ? <Users size={20}/> : <CalendarDays size={20}/>}</span><b>{query ? `No ${title.toLowerCase()} match your search` : `No ${title.toLowerCase()} added yet`}</b><span>{query ? "Try a different name or search term." : canManage ? `Add the first ${typeNames[kind]} to start building your school records.` : "Ask an administrator to add school records."}</span>{canManage && !query && <button className="primary-action" type="button" onClick={openCreate}><Plus size={15}/> Add {typeNames[kind]}</button>}</div> : personKinds.has(kind) ? <PeopleTable records={records} canManage={canManage} onEdit={openEdit} onRemove={remove}/> : <ItemsTable records={records} canManage={canManage} onEdit={openEdit} onRemove={remove}/>}
        <div className="records-card-foot"><span><i className="records-live-dot"/> Changes refresh automatically every 15 seconds.</span><span>Private school records</span></div>
      </section>
    </div>

    {modalOpen && <div className="records-modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)setModalOpen(false)}}><section className="records-modal" role="dialog" aria-modal="true" aria-labelledby="record-modal-title"><header><div><span className="panel-eyebrow">SCHOOL WORKSPACE</span><h2 id="record-modal-title">{editing ? "Edit" : "Add"} {typeNames[kind]}</h2><p>Changes save directly to the school database.</p></div><button type="button" className="records-close" onClick={()=>setModalOpen(false)} aria-label="Close"><X size={18}/></button></header>
      <form onSubmit={submit}>
        {personKinds.has(kind) ? <div className="records-form-grid">
          <TextField label="First name" name="firstName" value={draft.firstName ?? ""} set={field} required/>
          <TextField label="Last name" name="lastName" value={draft.lastName ?? ""} set={field} required/>
          <TextField label="Employee number" name="employeeNumber" value={draft.employeeNumber ?? ""} set={field} required placeholder="e.g. TCH-001"/>
          <TextField label="Work email" name="email" type="email" value={draft.email ?? ""} set={field} required/>
          <TextField label="Phone (optional)" name="phone" type="tel" value={draft.phone ?? ""} set={field}/>
          <TextField label="Department" name="department" value={draft.department ?? ""} set={field} required placeholder={kind === "teacher" ? "e.g. Mathematics" : "e.g. Administration"}/>
          <TextField label="Job title" name="jobTitle" value={draft.jobTitle ?? ""} set={field} required placeholder={kind === "teacher" ? "e.g. Mathematics Teacher" : "e.g. Office Manager"}/>
          <label className="records-field"><span>Employment status</span><select value={draft.status ?? "Active"} onChange={event=>field("status",event.target.value)}><option>Active</option><option>On leave</option><option>Inactive</option></select></label>
        </div> : <div className="records-form-grid">
          <TextField className="span-two" label="Title" name="title" value={draft.title ?? ""} set={field} required maxLength={140}/>
          <label className="records-field span-two"><span>Description</span><textarea maxLength={2000} rows={4} value={draft.description ?? ""} onChange={event=>field("description",event.target.value)} placeholder="Add details for the school community"/></label>
          {kind !== "notice" && <TextField label="Starts" name="startsAt" type="datetime-local" value={draft.startsAt ?? ""} set={field} required/>}
          {kind !== "notice" && <TextField label="Ends (optional)" name="endsAt" type="datetime-local" value={draft.endsAt ?? ""} set={field}/>} 
          {kind !== "notice" && <TextField label="Location" name="location" value={draft.location ?? ""} set={field} placeholder="Room or venue"/>}
          <TextField label="Audience" name="audience" value={draft.audience ?? "Whole school"} set={field} placeholder="Whole school or a grade"/>
          <label className="records-field"><span>Status</span><select value={draft.status ?? (kind === "notice" ? "Published" : "Scheduled")} onChange={event=>field("status",event.target.value)}>{kind === "notice" ? <><option>Published</option><option>Draft</option></> : <><option>Scheduled</option><option>Cancelled</option></>}</select></label>
        </div>}
        {message && <p className="records-form-error" role="alert">{message}</p>}
        <div className="records-modal-actions"><button type="button" className="secondary-action" onClick={()=>setModalOpen(false)}>Cancel</button><button type="submit" className="primary-action" disabled={saving}>{saving ? "Saving…" : <><Check size={15}/>{editing ? "Save changes" : "Save record"}</>}</button></div>
      </form>
    </section></div>}
  </div>;
}

function TextField({ label, name, value, set, type = "text", required = false, placeholder, maxLength, className = "" }: { label: string; name: string; value: string; set: (name:string,value:string)=>void; type?: string; required?: boolean; placeholder?: string; maxLength?: number; className?: string }) {
  return <label className={`records-field ${className}`}><span>{label}{required && <i> *</i>}</span><input name={name} type={type} value={value} required={required} maxLength={maxLength} placeholder={placeholder} onChange={event=>set(name,event.target.value)}/></label>;
}

function PeopleTable({ records, canManage, onEdit, onRemove }: { records: SchoolRecord[]; canManage: boolean; onEdit: (record:SchoolRecord)=>void; onRemove: (record:SchoolRecord)=>void }) {
  return <div className="school-table-scroll"><table className="school-table"><thead><tr><th>NAME</th><th>EMPLOYEE NO.</th><th>DEPARTMENT / ROLE</th><th>EMAIL</th><th>STATUS</th>{canManage && <th>ACTIONS</th>}</tr></thead><tbody>{records.map(record=><tr key={record.id}><td><span className="person-cell"><b>{record.firstName} {record.lastName}</b><small>{record.phone || "No phone listed"}</small></span></td><td>{record.employeeNumber}</td><td><span className="person-cell"><b>{record.department}</b><small>{record.jobTitle}</small></span></td><td><a className="records-email" href={`mailto:${record.email}`}><Mail size={13}/>{record.email}</a></td><td><span className={`record-status ${statusClass(record.status)}`}>{record.status}</span></td>{canManage && <td><div className="record-actions"><button type="button" aria-label={`Edit ${record.firstName} ${record.lastName}`} onClick={()=>onEdit(record)}><Pencil size={14}/></button><button type="button" aria-label={`Remove ${record.firstName} ${record.lastName}`} onClick={()=>onRemove(record)}><Trash2 size={14}/></button></div></td>}</tr>)}</tbody></table></div>;
}

function ItemsTable({ records, canManage, onEdit, onRemove }: { records: SchoolRecord[]; canManage: boolean; onEdit: (record:SchoolRecord)=>void; onRemove: (record:SchoolRecord)=>void }) {
  return <div className="school-table-scroll"><table className="school-table"><thead><tr><th>TITLE</th><th>DATE &amp; TIME</th><th>LOCATION</th><th>AUDIENCE</th><th>STATUS</th>{canManage && <th>ACTIONS</th>}</tr></thead><tbody>{records.map(record=><tr key={record.id}><td><span className="item-title-cell"><b>{record.title}</b><small>{record.description || "No additional details"}</small></span></td><td><span className="item-date-cell"><Clock3 size={13}/>{dateTime(record.startsAt)}</span></td><td><span className="item-date-cell">{record.location ? <><MapPin size={13}/>{record.location}</> : "—"}</span></td><td>{record.audience || "Whole school"}</td><td><span className={`record-status ${statusClass(record.status)}`}>{record.status}</span></td>{canManage && <td><div className="record-actions"><button type="button" aria-label={`Edit ${record.title}`} onClick={()=>onEdit(record)}><Pencil size={14}/></button><button type="button" aria-label={`Remove ${record.title}`} onClick={()=>onRemove(record)}><Trash2 size={14}/></button></div></td>}</tr>)}</tbody></table></div>;
}
