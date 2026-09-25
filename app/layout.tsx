import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Edusync | Admin Dashboard",
  description: "School management dashboard",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
