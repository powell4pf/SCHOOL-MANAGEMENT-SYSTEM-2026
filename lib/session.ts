import "server-only";
import { headers } from "next/headers";
import { auth, isAuthConfigured } from "@/lib/auth";

export async function getCurrentSession() {
  if (!isAuthConfigured()) return null;
  return auth.api.getSession({ headers: await headers() });
}
