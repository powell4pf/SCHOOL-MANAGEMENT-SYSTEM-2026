import Link from "next/link";
import { ArrowLeft, GraduationCap } from "lucide-react";
import SignInForm from "@/components/auth/sign-in-form";
import { isAuthConfigured } from "@/lib/auth";
import { getCurrentSession } from "@/lib/session";
import "./signin.css";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SignInPage() {
  const configured = isAuthConfigured();
  if (configured) {
    let hasSession = false;
    try {
      hasSession = Boolean(await getCurrentSession());
    } catch {
      redirect("/setup");
    }
    if (hasSession) redirect("/");
  }
  return <main className="signin-page"><section className="signin-card"><Link className="signin-brand" href="/"><span><GraduationCap size={18}/></span><b>Edusync</b></Link><div className="signin-intro"><div className="signin-eyebrow">SCHOOL MANAGEMENT</div><h1>Welcome back</h1><p>Sign in to continue to your school workspace.</p></div>{!configured && <div className="signin-setup"><b>Setup needed before staff can sign in.</b><span>Configure PostgreSQL and the Better Auth secret in <code>.env.local</code>, then run the setup steps.</span><Link href="/setup">View setup instructions <ArrowLeft size={12}/></Link></div>}<SignInForm configured={configured}/><footer>Protected staff access <i/> Edusync School Management</footer></section><aside className="signin-art"><div className="signin-art-shape shape-one"/><div className="signin-art-shape shape-two"/><div className="art-content"><span className="art-symbol">E</span><h2>Every learner.<br/>Every possibility.</h2><p>One connected space for your school community to learn, grow, and succeed.</p><div className="art-dots"><i/><i/><i/></div></div></aside></main>;
}
