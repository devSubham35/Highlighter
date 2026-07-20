"use client";

import { Sidebar, type SidebarWorkspace } from "@/components/dashboard/Sidebar";
import { TopNav } from "@/components/dashboard/TopNav";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isProjectDetail = /^\/projects\/[^/]+/.test(pathname);

  if (isProjectDetail) {
    return (
      <div className="relative min-h-screen bg-background">
        <div aria-hidden className="pointer-events-none fixed inset-0 bg-app-glow" />
        <TopNav compact />
        <main className="relative min-h-screen pt-14">
          <div className="px-4 pt-4 pb-6 md:px-8 md:pt-6 md:pb-8">{children}</div>
        </main>
      </div>
    );
  }

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
