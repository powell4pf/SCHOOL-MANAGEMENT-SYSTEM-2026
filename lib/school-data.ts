import "server-only";
import { pool } from "@/lib/database";

export type SchoolKind = "teacher" | "staff" | "schedule" | "exam" | "notice";
export type SchoolRecord = {
  id: string;
  kind: SchoolKind;
  employeeNumber?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  department?: string;
  jobTitle?: string;
  title?: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  location?: string;
  audience?: string;
  status: string;
  createdAt: string;
};

type SchoolInput = Omit<SchoolRecord, "id" | "createdAt">;
type PersonRow = {
  id: string; kind: "teacher" | "staff"; employee_number: string; first_name: string; last_name: string;
  email: string; phone: string | null; department: string; job_title: string; status: string; created_at: Date | string;
};
type ItemRow = {
  id: string; kind: "schedule" | "exam" | "notice"; title: string; description: string;
  starts_at: Date | string | null; ends_at: Date | string | null; location: string; audience: string;
  status: string; created_at: Date | string;
};

const iso = (value: Date | string | null | undefined) => value == null ? "" : value instanceof Date ? value.toISOString() : new Date(value).toISOString();
const personStatus = (value: string) => value === "on_leave" ? "On leave" : value === "inactive" ? "Inactive" : "Active";
const itemStatus = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

function mapPerson(row: PersonRow): SchoolRecord {
  return {
    id: row.id, kind: row.kind, employeeNumber: row.employee_number, firstName: row.first_name,
    lastName: row.last_name, email: row.email, phone: row.phone ?? "", department: row.department,
    jobTitle: row.job_title, status: personStatus(row.status), createdAt: iso(row.created_at),
  };
}

function mapItem(row: ItemRow): SchoolRecord {
  return {
    id: row.id, kind: row.kind, title: row.title, description: row.description,
    startsAt: iso(row.starts_at), endsAt: iso(row.ends_at), location: row.location,
    audience: row.audience, status: itemStatus(row.status), createdAt: iso(row.created_at),
  };
}

export async function listSchoolRecords(kind: SchoolKind, query: string) {
  if (kind === "teacher" || kind === "staff") {
    const result = await pool.query<PersonRow>(
      `SELECT id::text, kind, employee_number, first_name, last_name, email, phone, department,
        job_title, status, created_at
       FROM school_people
       WHERE kind = $1 AND ($2 = '' OR concat_ws(' ', first_name, last_name, employee_number, email, department, job_title) ILIKE $3)
       ORDER BY CASE status WHEN 'active' THEN 0 WHEN 'on_leave' THEN 1 ELSE 2 END, lower(last_name), lower(first_name)
       LIMIT 500`,
      [kind, query, `%${query}%`],
    );
    return result.rows.map(mapPerson);
  }
  const result = await pool.query<ItemRow>(
    `SELECT id::text, kind, title, description, starts_at, ends_at, location, audience, status, created_at
     FROM school_items
     WHERE kind = $1 AND ($2 = '' OR concat_ws(' ', title, description, location, audience) ILIKE $3)
     ORDER BY CASE WHEN kind = 'notice' THEN 0 ELSE 1 END,
       CASE WHEN kind = 'notice' THEN created_at END DESC,
       CASE WHEN kind <> 'notice' THEN starts_at END ASC
     LIMIT 500`,
    [kind, query, `%${query}%`],
  );
  return result.rows.map(mapItem);
}

function validDateTime(value: string) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function validateSchoolRecord(kind: SchoolKind, input: unknown): { data?: SchoolInput; error?: string } {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { error: "Enter a valid record." };
  const body = input as Record<string, unknown>;
  const text = (key: string) => typeof body[key] === "string" ? body[key].trim() : "";
  if (kind === "teacher" || kind === "staff") {
    const employeeNumber = text("employeeNumber");
    const firstName = text("firstName");
    const lastName = text("lastName");
    const email = text("email").toLowerCase();
    const phone = text("phone");
    const department = text("department");
    const jobTitle = text("jobTitle");
    const status = body.status;
    if (!employeeNumber || !firstName || !lastName || !email || !department || !jobTitle) return { error: "Complete all required fields." };
    if (employeeNumber.length > 32 || firstName.length > 80 || lastName.length > 80 || email.length > 254 || phone.length > 32 || department.length > 80 || jobTitle.length > 80) return { error: "One or more fields are longer than allowed." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid work email address." };
    if (phone && !/^\+?[0-9][0-9\s().-]{6,31}$/.test(phone)) return { error: "Enter a valid phone number." };
    if (status !== "Active" && status !== "On leave" && status !== "Inactive") return { error: "Choose a valid status." };
    return { data: { kind, employeeNumber, firstName, lastName, email, phone, department, jobTitle, status } };
  }

  const title = text("title");
  const description = text("description");
  const location = text("location");
  const audience = text("audience") || "Whole school";
  const startsAtInput = text("startsAt");
  const endsAtInput = text("endsAt");
  const statusValue = body.status;
  if (!title) return { error: "Enter a title." };
  if (title.length > 140 || description.length > 2000 || location.length > 120 || audience.length > 80) return { error: "One or more fields are longer than allowed." };
  const startsAt = validDateTime(startsAtInput);
  const endsAt = validDateTime(endsAtInput);
  if (startsAt === null || endsAt === null) return { error: "Enter a valid date and time." };
  if (kind !== "notice" && !startsAt) return { error: "Choose a date and time." };
  if (endsAt && startsAt && new Date(endsAt) < new Date(startsAt)) return { error: "The end time must be after the start time." };
  if (kind === "notice" ? statusValue !== "Published" && statusValue !== "Draft" : statusValue !== "Scheduled" && statusValue !== "Cancelled") return { error: "Choose a valid status." };
  const status = statusValue as string;
  return { data: { kind, title, description, startsAt: startsAt || "", endsAt: endsAt || "", location, audience, status } };
}

export async function createSchoolRecord(data: SchoolInput, createdBy: string) {
  if (data.kind === "teacher" || data.kind === "staff") {
    const result = await pool.query<PersonRow>(
      `INSERT INTO school_people (kind, employee_number, first_name, last_name, email, phone, department, job_title, status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id::text, kind, employee_number, first_name, last_name, email, phone, department, job_title, status, created_at`,
      [data.kind, data.employeeNumber, data.firstName, data.lastName, data.email, data.phone || null, data.department, data.jobTitle,
        data.status === "On leave" ? "on_leave" : data.status === "Inactive" ? "inactive" : "active", createdBy],
    );
    return mapPerson(result.rows[0]);
  }
  const result = await pool.query<ItemRow>(
    `INSERT INTO school_items (kind, title, description, starts_at, ends_at, location, audience, status, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING id::text, kind, title, description, starts_at, ends_at, location, audience, status, created_at`,
    [data.kind, data.title, data.description, data.startsAt || null, data.endsAt || null, data.location, data.audience,
      data.status.toLowerCase(), createdBy],
  );
  return mapItem(result.rows[0]);
}

export async function updateSchoolRecord(id: string, data: SchoolInput) {
  if (data.kind === "teacher" || data.kind === "staff") {
    const result = await pool.query<PersonRow>(
      `UPDATE school_people SET employee_number=$3, first_name=$4, last_name=$5, email=$6, phone=$7,
        department=$8, job_title=$9, status=$10, updated_at=now()
       WHERE id=$1::uuid AND kind=$2
       RETURNING id::text, kind, employee_number, first_name, last_name, email, phone, department, job_title, status, created_at`,
      [id, data.kind, data.employeeNumber, data.firstName, data.lastName, data.email, data.phone || null, data.department, data.jobTitle,
        data.status === "On leave" ? "on_leave" : data.status === "Inactive" ? "inactive" : "active"],
    );
    return result.rows[0] ? mapPerson(result.rows[0]) : null;
  }
  const result = await pool.query<ItemRow>(
    `UPDATE school_items SET title=$3, description=$4, starts_at=$5, ends_at=$6, location=$7, audience=$8,
       status=$9, updated_at=now()
     WHERE id=$1::uuid AND kind=$2
     RETURNING id::text, kind, title, description, starts_at, ends_at, location, audience, status, created_at`,
    [id, data.kind, data.title, data.description, data.startsAt || null, data.endsAt || null, data.location, data.audience, data.status.toLowerCase()],
  );
  return result.rows[0] ? mapItem(result.rows[0]) : null;
}

export async function deleteSchoolRecord(id: string, kind: SchoolKind) {
  const table = kind === "teacher" || kind === "staff" ? "school_people" : "school_items";
  const result = await pool.query(`DELETE FROM ${table} WHERE id=$1::uuid AND kind=$2`, [id, kind]);
  return (result.rowCount ?? 0) > 0;
}

export async function getDashboardData() {
  const [studentCounts, gradeCounts, peopleCounts, itemCounts, latestStudents, schedule, exams, notices] = await Promise.all([
    pool.query<{ total: string; active: string }>(`SELECT count(*)::text total, count(*) FILTER (WHERE status='active')::text active FROM students`),
    pool.query<{ grade: string; count: string }>(`SELECT grade, count(*)::text count FROM students GROUP BY grade ORDER BY grade`),
    pool.query<{ teachers: string; staff: string }>(`SELECT count(*) FILTER (WHERE kind='teacher' AND status='active')::text teachers,
      count(*) FILTER (WHERE kind='staff' AND status='active')::text staff FROM school_people`),
    pool.query<{ schedule: string; exams: string; notices: string }>(`SELECT
      count(*) FILTER (WHERE kind='schedule' AND status='scheduled' AND starts_at >= now())::text schedule,
      count(*) FILTER (WHERE kind='exam' AND status='scheduled' AND starts_at >= now())::text exams,
      count(*) FILTER (WHERE kind='notice' AND status='published')::text notices FROM school_items`),
    pool.query<{ id: string; first_name: string; last_name: string; admission_number: string; grade: string; class_name: string; enrolled_on: string }>(
      `SELECT id::text, first_name, last_name, admission_number, grade, class_name, to_char(enrolled_on,'YYYY-MM-DD') enrolled_on
       FROM students ORDER BY created_at DESC LIMIT 6`),
    pool.query<ItemRow>(`SELECT id::text, kind, title, description, starts_at, ends_at, location, audience, status, created_at
      FROM school_items WHERE kind='schedule' AND status='scheduled' AND starts_at >= now() ORDER BY starts_at ASC LIMIT 5`),
    pool.query<ItemRow>(`SELECT id::text, kind, title, description, starts_at, ends_at, location, audience, status, created_at
      FROM school_items WHERE kind='exam' AND status='scheduled' AND starts_at >= now() ORDER BY starts_at ASC LIMIT 5`),
    pool.query<ItemRow>(`SELECT id::text, kind, title, description, starts_at, ends_at, location, audience, status, created_at
      FROM school_items WHERE kind='notice' AND status='published' ORDER BY created_at DESC LIMIT 5`),
  ]);
  const students = studentCounts.rows[0] ?? { total: "0", active: "0" };
  const people = peopleCounts.rows[0] ?? { teachers: "0", staff: "0" };
  const items = itemCounts.rows[0] ?? { schedule: "0", exams: "0", notices: "0" };
  return {
    metrics: {
      students: Number(students.total), activeStudents: Number(students.active),
      teachers: Number(people.teachers), staff: Number(people.staff),
      upcomingSchedule: Number(items.schedule), upcomingExams: Number(items.exams), publishedNotices: Number(items.notices),
    },
    enrollmentByGrade: gradeCounts.rows.map(row => ({ grade: row.grade, count: Number(row.count) })),
    latestStudents: latestStudents.rows.map(row => ({ id: row.id, name: `${row.first_name} ${row.last_name}`, admissionNumber: row.admission_number, grade: row.grade, className: row.class_name, enrolledOn: row.enrolled_on })),
    schedule: schedule.rows.map(mapItem),
    exams: exams.rows.map(mapItem),
    notices: notices.rows.map(mapItem),
    updatedAt: new Date().toISOString(),
  };
}
