import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Docs | Highlighter",
  description: "Highlighter REST API documentation",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
