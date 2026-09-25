import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createSchoolRecord, deleteSchoolRecord, listSchoolRecords, updateSchoolRecord, validateSchoolRecord, type SchoolKind } from "@/lib/school-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const kinds: SchoolKind[] = ["teacher", "staff", "schedule", "exam", "notice"];
const isKind = (value: unknown): value is SchoolKind => typeof value === "string" && kinds.includes(value as SchoolKind);
const noStore = { "Cache-Control": "private, no-store" };

async function currentSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function GET(request: NextRequest) {
  try {
    const session = await currentSession();
    if (!session) return NextResponse.json({ error: "Sign in to view school records." }, { status: 401 });
    if (session.user.role !== "admin" && session.user.role !== "teacher") return NextResponse.json({ error: "You do not have access to school records." }, { status: 403 });
    const kind = request.nextUrl.searchParams.get("kind");
    if (!isKind(kind)) return NextResponse.json({ error: "Choose a valid record type." }, { status: 400 });
    const query = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 100);
    const records = await listSchoolRecords(kind, query);
    return NextResponse.json({ records, total: records.length }, { headers: noStore });
  } catch {
    return NextResponse.json({ error: "Records could not be loaded. Check the database connection and try again." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await currentSession();
    if (!session) return NextResponse.json({ error: "Sign in to add a record." }, { status: 401 });
    if (session.user.role !== "admin") return NextResponse.json({ error: "Only an admin can add school records." }, { status: 403 });
    const body: unknown = await request.json().catch(() => null);
    const kind = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>).kind : null;
    if (!isKind(kind)) return NextResponse.json({ error: "Choose a valid record type." }, { status: 400 });
    const validation = validateSchoolRecord(kind, body);
    if (!validation.data) return NextResponse.json({ error: validation.error }, { status: 400 });
    const record = await createSchoolRecord(validation.data, session.user.id);
    return NextResponse.json({ record }, { status: 201, headers: noStore });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") return NextResponse.json({ error: "That employee number or email is already in use." }, { status: 409 });
    return NextResponse.json({ error: "The record could not be saved. Check the database connection and try again." }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await currentSession();
    if (!session) return NextResponse.json({ error: "Sign in to update a record." }, { status: 401 });
    if (session.user.role !== "admin") return NextResponse.json({ error: "Only an admin can update school records." }, { status: 403 });
    const body: unknown = await request.json().catch(() => null);
    const values = body && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : {};
    const { id, kind } = values;
    if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) || !isKind(kind)) {
      return NextResponse.json({ error: "Choose a valid record." }, { status: 400 });
    }
    const validation = validateSchoolRecord(kind, values);
    if (!validation.data) return NextResponse.json({ error: validation.error }, { status: 400 });
    const record = await updateSchoolRecord(id, validation.data);
    if (!record) return NextResponse.json({ error: "That record no longer exists. Refresh the list and try again." }, { status: 404 });
    return NextResponse.json({ record }, { headers: noStore });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") return NextResponse.json({ error: "That employee number or email is already in use." }, { status: 409 });
    return NextResponse.json({ error: "The record could not be updated. Check the database connection and try again." }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await currentSession();
    if (!session) return NextResponse.json({ error: "Sign in to remove a record." }, { status: 401 });
    if (session.user.role !== "admin") return NextResponse.json({ error: "Only an admin can remove school records." }, { status: 403 });
    const body: unknown = await request.json().catch(() => null);
    const values = body && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : {};
    const { id, kind } = values;
    if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) || !isKind(kind)) {
      return NextResponse.json({ error: "Choose a valid record." }, { status: 400 });
    }
    const deleted = await deleteSchoolRecord(id, kind);
    if (!deleted) return NextResponse.json({ error: "That record no longer exists. Refresh the list and try again." }, { status: 404 });
    return NextResponse.json({ success: true }, { headers: noStore });
  } catch {
    return NextResponse.json({ error: "The record could not be removed. Check the database connection and try again." }, { status: 503 });
  }
}
