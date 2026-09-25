import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createStudent, listStudents, validateStudent } from "@/lib/student-records";

export const runtime = "nodejs";

async function getAuthorizedSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthorizedSession();
    if (!session) return NextResponse.json({ error: "Sign in to view student records." }, { status: 401 });
    const role = session.user.role;
    if (role !== "admin" && role !== "teacher") return NextResponse.json({ error: "You do not have access to student records." }, { status: 403 });

    const search = request.nextUrl.searchParams;
    const query = (search.get("q") ?? "").trim().slice(0, 100);
    const requestedGrade = search.get("grade") ?? "";
    const grade = /^Grade (?:[1-9]|1[0-2])$/.test(requestedGrade) ? requestedGrade : "";
    const requestedStatus = search.get("status") ?? "";
    const status = ["Active", "On leave"].includes(requestedStatus) ? requestedStatus : "";
    const page = Math.max(1, Math.min(100_000, Number.parseInt(search.get("page") ?? "1", 10) || 1));
    const records = await listStudents({ query, grade, status, page, pageSize: 10, canSeeContacts: role === "admin" });
    return NextResponse.json(records, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Student records could not be loaded. Check database setup and try again." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthorizedSession();
    if (!session) return NextResponse.json({ error: "Sign in to add a student." }, { status: 401 });
    if (session.user.role !== "admin") return NextResponse.json({ error: "Only an admin can add student records." }, { status: 403 });

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: "The request body must be valid JSON." }, { status: 400 });
    }
    const validation = validateStudent(payload);
    if (!validation.data) return NextResponse.json({ error: validation.error }, { status: 400 });

    const student = await createStudent(validation.data, session.user.id);
    return NextResponse.json({ student }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      return NextResponse.json({ error: "That admission number or student email is already in use." }, { status: 409 });
    }
    return NextResponse.json({ error: "Student record could not be saved. Check database setup and try again." }, { status: 503 });
  }
}
