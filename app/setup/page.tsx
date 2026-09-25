import Link from "next/link";
import { ArrowLeft, Database, KeyRound, Terminal } from "lucide-react";
import { isAuthConfigured } from "@/lib/auth";
import "./setup.css";
import CopySetupCommand from "@/components/setup/copy-setup-command";

export const dynamic = "force-dynamic";

export default function SetupPage() {
  const configured = isAuthConfigured();
  return <main className="setup-page"><section className="setup-card"><Link className="setup-back" href="/"><ArrowLeft size={14}/> Edusync</Link><span className="setup-icon"><Database size={20}/></span><p className="setup-eyebrow">FIRST-TIME CONFIGURATION</p><h1>Connect your school database</h1><p className="setup-intro">Staff sign-in and real student records stay locked until the database and session secret are configured.</p><ol className="setup-steps"><li><span>1</span><div><b>Create a PostgreSQL database</b><p>Use a private database you control. Keep its connection string secret.</p></div></li><li><span>2</span><div><b>Set the local environment</b><p>Copy <code>.env.example</code> to <code>.env.local</code>, then set the database URL, a random 32+ character auth secret, and your app URL.</p></div></li><li><span>3</span><div><b>Create the database tables</b><p>Run <code>npm run db:auth</code>, <code>npm run db:students</code>, and <code>npm run db:school</code>.</p></div></li><li><span>4</span><div><b>Create the first administrator</b><p>Run <code>npm run db:create-admin</code>. The command prompts for an email, name, and password.</p></div></li></ol>{configured?<div className="setup-status ready"><b>Environment values found.</b><span>Run the database commands above. If they are already complete, <Link href="/sign-in">go to staff sign-in <ArrowLeft size={12}/></Link>.</span></div>:<div className="setup-status"><KeyRound size={15}/><span>Environment values are missing or incomplete. Preview screens are available, but no sign-in or student data is active.</span></div>}<div className="setup-terminal"><Terminal size={15}/><span>Setup guide: <b>README.md</b></span><CopySetupCommand/></div></section></main>;
}
