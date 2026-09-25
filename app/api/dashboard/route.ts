import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDashboardData } from "@/lib/school-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Sign in to view the dashboard." }, { status: 401 });
    if (session.user.role !== "admin" && session.user.role !== "teacher") return NextResponse.json({ error: "You do not have access to the dashboard." }, { status: 403 });
    return NextResponse.json(await getDashboardData(), { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Dashboard data could not be loaded. Check the database connection and try again." }, { status: 503 });
  }
}
