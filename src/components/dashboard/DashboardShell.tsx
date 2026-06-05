"use client";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopNav } from "@/components/dashboard/TopNav";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function DashboardShell({
  user,
  children,
}: {
  user: { name?: string | null; email?: string | null };
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="relative min-h-screen bg-background">
      <TopNav
        user={user}
        mobileOpen={mobileOpen}
        onMenuToggle={() => setMobileOpen((open) => !open)}
      />
      <Sidebar
        mobileOpen={mobileOpen}
        collapsed={collapsed}
        onCollapse={() => setCollapsed((value) => !value)}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <main
        className={cn(
          "min-h-screen pt-14 transition-all duration-300",
          collapsed ? "xl:ml-16" : "xl:ml-67",
        )}
      >
        <div className="px-4 pt-4 pb-6 md:px-8 md:pt-6 md:pb-8">{children}</div>
      </main>
    </div>
  );
}
