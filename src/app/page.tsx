import { LandingPage } from "@/components/landing/LandingPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Highlighter — Visual bug reporting for any website",
  description:
    "Install one script, capture annotated screenshots with full session metadata, and triage issues in a focused dashboard.",
};

export default function Home() {
  return <LandingPage />;
}
