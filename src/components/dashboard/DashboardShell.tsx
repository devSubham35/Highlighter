"use client";

import { Sidebar, type SidebarWorkspace } from "@/components/dashboard/Sidebar";
import { TopNav } from "@/components/dashboard/TopNav";
import { cn } from "@/lib/utils";
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const hideSidebar = pathname === "/workspaces";

  return (
    <div className="relative min-h-screen bg-background">
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-app-glow" />
      {!hideSidebar ? (
        <Sidebar
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          workspaces={workspaces}
          user={user}
        />
      ) : null}
      <div className={cn("flex min-h-screen flex-col", !hideSidebar && "md:ml-60")}>
        <TopNav
          compact={hideSidebar}
          showLogo={hideSidebar}
          user={user}
          className={hideSidebar ? "md:px-8" : undefined}
          onMenuClick={hideSidebar ? undefined : () => setMobileOpen(true)}
        />
        <main
          className={cn(
            "relative flex-1 px-4 py-4 md:px-8 md:py-6",
            hideSidebar && "overflow-hidden",
          )}
        >
          {hideSidebar ? (
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-workspace-accent" />
          ) : null}
          <div className="relative">{children}</div>
        </main>
      </div>
    </div>
  );
}
