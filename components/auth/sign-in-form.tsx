"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function SignInForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured || busy) return;
    setBusy(true);
    setError("");
    const result = await authClient.signIn.email({ email: email.trim().toLowerCase(), password, callbackURL: "/" });
    setBusy(false);
    if (result.error) {
      setError("We couldn’t sign you in. Check your email and password, or contact your school administrator.");
      return;
    }
    router.push("/");
  }

  return <form className="signin-form" onSubmit={submit}>
    <label><span>Work email</span><div className="signin-input"><Mail size={16}/><input type="email" autoComplete="username" required maxLength={254} value={email} onChange={event=>setEmail(event.target.value)} placeholder="name@school.edu" disabled={!configured}/></div></label>
    <label><span>Password</span><div className="signin-input"><LockKeyhole size={16}/><input type={showPassword ? "text" : "password"} autoComplete="current-password" required minLength={12} maxLength={128} value={password} onChange={event=>setPassword(event.target.value)} placeholder="Enter your password" disabled={!configured}/><button type="button" onClick={()=>setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} disabled={!configured}>{showPassword ? <EyeOff size={15}/> : <Eye size={15}/>}</button></div></label>
    {error && <p className="signin-error" role="alert">{error}</p>}
    <button className="signin-submit" type="submit" disabled={!configured || busy}>{busy ? "Signing in…" : "Sign in"}</button>
    <p className="signin-help">Access is provided by your school administrator. Self-service sign-up is disabled.</p>
  </form>;
}
