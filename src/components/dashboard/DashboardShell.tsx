"use client";

import { TopNav } from "@/components/dashboard/TopNav";

export function DashboardShell({
  user,
  children,
}: {
  user: { name?: string | null; email?: string | null };
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-background">
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-app-glow" />
      <TopNav user={user} />
      <main className="relative min-h-screen pt-14">
        <div className="px-4 pt-4 pb-6 md:px-8 md:pt-6 md:pb-8">{children}</div>
      </main>
    </div>
  );
}
