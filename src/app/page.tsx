import { LandingPage } from "@/components/landing/LandingPage";
import { auth } from "@/lib/auth";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Highlighter — Visual bug reporting for any website",
  description:
    "Install one script, capture annotated screenshots with full session metadata, and triage issues in a focused dashboard.",
};

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/workspaces");

  return <LandingPage />;
}
