"use client";

import { Sidebar, type SidebarWorkspace } from "@/components/dashboard/Sidebar";
import { TopNav } from "@/components/dashboard/TopNav";
import { useState } from "react";

export function DashboardShell({
  user,
  workspaces,
  children,
}: {
  user: { name?: string | null; email?: string | null; image?: string | null };
  workspaces: SidebarWorkspace[];
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-background">
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-app-glow" />
      <Sidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        workspaces={workspaces}
        user={user}
      />
      <div className="flex min-h-screen flex-col md:ml-60">
        <TopNav onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-4 md:px-8 md:py-6">{children}</main>
      </div>
    </div>
  );
}
