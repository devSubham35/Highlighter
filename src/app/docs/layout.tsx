import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Docs | Highlight",
  description: "Highlight REST API documentation",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
