"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function SignOutButton() {
  const router = useRouter();
  async function signOut() {
    await authClient.signOut();
    router.push("/sign-in");
  }

  return <button className="sign-out-button" onClick={signOut} aria-label="Sign out"><LogOut size={14}/><span>Sign out</span></button>;
}
