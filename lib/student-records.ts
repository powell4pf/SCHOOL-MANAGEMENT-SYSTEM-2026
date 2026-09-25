import "server-only";
import { pool } from "@/lib/database";

export type StudentRecord = {
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
  status: "Active" | "On leave";
};

type StudentRow = {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  grade: string;
  class_name: string;
  gender: string;
  date_of_birth: string | null;
  guardian_name: string;
  guardian_phone: string;
  student_email: string | null;
  enrolled_on: string;
  status: "active" | "on_leave";
};

function toStudent(row: StudentRow, canSeeContacts: boolean): StudentRecord {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    admissionNumber: row.admission_number,
    grade: row.grade,
    className: row.class_name,
    gender: canSeeContacts && row.gender !== "not_specified" ? row.gender : "",
    dateOfBirth: canSeeContacts ? row.date_of_birth ?? "" : "",
    guardian: canSeeContacts ? row.guardian_name : "",
    guardianPhone: canSeeContacts ? row.guardian_phone : "",
    email: canSeeContacts ? row.student_email ?? "" : "",
    enrolledOn: row.enrolled_on,
    status: row.status === "active" ? "Active" : "On leave",
  };
}

export async function listStudents({ query, grade, status, page, pageSize, canSeeContacts }: {
  query: string; grade: string; status: string; page: number; pageSize: number; canSeeContacts: boolean;
}) {
  const values: (string | number)[] = [];
  const conditions: string[] = [];
  if (query) {
    values.push(`%${query}%`);
    conditions.push(`concat_ws(' ', first_name, last_name, admission_number) ILIKE $${values.length}`);
  }
  if (grade) {
    values.push(grade);
    conditions.push(`grade = $${values.length}`);
  }
  if (status) {
    values.push(status === "Active" ? "active" : "on_leave");
    conditions.push(`status = $${values.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const countResult = await pool.query<{ total: string }>(`SELECT count(*)::text AS total FROM students ${where}`, values);
  const total = Number(countResult.rows[0]?.total ?? 0);
  const offset = (page - 1) * pageSize;
  const pageValues = [...values, pageSize, offset];
  const result = await pool.query<StudentRow>(
    `SELECT id::text, first_name, last_name, admission_number, grade, class_name, gender,
      to_char(date_of_birth, 'YYYY-MM-DD') AS date_of_birth, guardian_name, guardian_phone,
      student_email, to_char(enrolled_on, 'YYYY-MM-DD') AS enrolled_on, status
     FROM students ${where}
     ORDER BY last_name ASC, first_name ASC
     LIMIT $${pageValues.length - 1} OFFSET $${pageValues.length}`,
    pageValues,
  );
  const summaryResult = await pool.query<{ total: string; active: string; grades: string }>(
    `SELECT count(*)::text AS total,
      count(*) FILTER (WHERE status = 'active')::text AS active,
      count(DISTINCT grade)::text AS grades
     FROM students`,
  );
  const summary = summaryResult.rows[0] ?? { total: "0", active: "0", grades: "0" };
  return {
    students: result.rows.map(row => toStudent(row, canSeeContacts)),
    total,
    page,
    pageSize,
    summary: { total: Number(summary.total), active: Number(summary.active), grades: Number(summary.grades) },
  };
}

export async function createStudent(data: Omit<StudentRecord, "id">, createdBy: string) {
  const result = await pool.query<StudentRow>(
    `INSERT INTO students (first_name, last_name, admission_number, grade, class_name, gender,
      date_of_birth, guardian_name, guardian_phone, student_email, enrolled_on, status, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING id::text, first_name, last_name, admission_number, grade, class_name, gender,
      to_char(date_of_birth, 'YYYY-MM-DD') AS date_of_birth, guardian_name, guardian_phone,
      student_email, to_char(enrolled_on, 'YYYY-MM-DD') AS enrolled_on, status`,
    [data.firstName, data.lastName, data.admissionNumber, data.grade, data.className, data.gender || "not_specified",
      data.dateOfBirth || null, data.guardian, data.guardianPhone, data.email || null, data.enrolledOn,
      data.status === "Active" ? "active" : "on_leave", createdBy],
  );
  return toStudent(result.rows[0], true);
}

export function validateStudent(input: unknown): { data?: Omit<StudentRecord, "id">; error?: string } {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { error: "Enter a valid student record." };
  const body = input as Record<string, unknown>;
  const text = (key: string) => typeof body[key] === "string" ? body[key].trim() : "";
  const firstName = text("firstName");
  const lastName = text("lastName");
  const admissionNumber = text("admissionNumber");
  const grade = text("grade");
  const className = text("className");
  const gender = text("gender");
  const dateOfBirth = text("dateOfBirth");
  const guardian = text("guardian");
  const guardianPhone = text("guardianPhone");
  const email = text("email").toLowerCase();
  const enrolledOn = text("enrolledOn");
  const status = body.status;
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const validDate = (value: string) => {
    if (!datePattern.test(value)) return false;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  };

  if (!firstName || !lastName || !admissionNumber || !guardian || !guardianPhone || !enrolledOn) return { error: "Complete all required fields." };
  if (firstName.length > 80 || lastName.length > 80 || admissionNumber.length > 32 || grade.length > 24 || className.length > 24 || gender.length > 24 || guardian.length > 120 || guardianPhone.length > 32 || email.length > 254) return { error: "One or more fields are longer than allowed." };
  if (!/^Grade (?:[1-9]|1[0-2])$/.test(grade) || !/^[A-Za-z0-9-]{1,24}$/.test(className)) return { error: "Choose a valid grade and class." };
  if (gender && !["Female", "Male", "Prefer not to say"].includes(gender)) return { error: "Choose a valid gender option." };
  const phoneDigits = guardianPhone.replace(/\D/g, "").length;
  if (!/^\+?[0-9][0-9\s().-]*$/.test(guardianPhone) || phoneDigits < 7 || phoneDigits > 15) return { error: "Enter a valid guardian phone number." };
  if (dateOfBirth && (!validDate(dateOfBirth) || dateOfBirth > new Date().toISOString().slice(0, 10))) return { error: "Enter a valid date of birth." };
  if (!validDate(enrolledOn) || enrolledOn > new Date().toISOString().slice(0, 10)) return { error: "Enter a valid enrollment date." };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid student email address." };
  if (status !== "Active" && status !== "On leave") return { error: "Choose a valid enrollment status." };

  return { data: { firstName, lastName, admissionNumber, grade, className, gender, dateOfBirth, guardian, guardianPhone, email, enrolledOn, status } };
}
