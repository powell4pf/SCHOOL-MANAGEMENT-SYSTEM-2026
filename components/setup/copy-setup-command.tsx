"use client";

export default function CopySetupCommand() {
  async function copy() {
    try {
      await navigator.clipboard.writeText("Copy-Item .env.example .env.local");
    } catch {
      // Clipboard access may be unavailable in an insecure context.
    }
  }

  return <button type="button" onClick={copy}>Copy first command</button>;
}
