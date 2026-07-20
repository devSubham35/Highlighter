"use client";

import { cn } from "@/lib/utils";
import { ArrowLeft, MessageSquare, Puzzle, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Feedbacks", icon: MessageSquare, segment: "" },
  { label: "Widgets", icon: Puzzle, segment: "widgets" },
  { label: "Settings", icon: Settings, segment: "settings" },
] as const;

function getHref(projectId: string, segment: string) {
  return segment === "" ? `/projects/${projectId}` : `/projects/${projectId}/${segment}`;
}

function isActive(pathname: string, projectId: string, segment: string) {
  if (segment === "") {
    return pathname === `/projects/${projectId}`;
  }
  return pathname.startsWith(`/projects/${projectId}/${segment}`);
}

export function ProjectShell({
  projectId,
  projectName,
  websiteUrl,
  workspaceId,
  children,
}: {
  projectId: string;
  projectName: string;
  websiteUrl: string | null;
  workspaceId: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col md:flex-row">
      <aside className="sticky top-14 z-10 hidden h-[calc(100vh-3.5rem)] w-52 shrink-0 flex-col border-r border-border/80 bg-sidebar/95 backdrop-blur-md md:flex">
        <div className="border-b border-border/70 px-3 py-3">
          <Link
            href={`/workspaces/${workspaceId}/projects`}
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm text-muted-foreground transition-all duration-200 hover:bg-sidebar-accent hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span className="truncate">All projects</span>
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          <p className="px-2 pb-1 text-[10px] font-semibold tracking-wider text-muted-foreground/70">
            Project
          </p>
          {navItems.map((item) => {
            const active = isActive(pathname, projectId, item.segment);
            const href = getHref(projectId, item.segment);
            const Icon = item.icon;

            return (
              <Link
                key={item.segment || "feedbacks"}
                href={href}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-sidebar-accent text-foreground shadow-[0_1px_2px_rgba(34,197,94,0.08)]"
                    : "text-muted-foreground hover:bg-sidebar-accent/80 hover:text-foreground",
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="border-b border-sidebar-border bg-card md:hidden">
          <nav className="flex gap-1 overflow-x-auto px-3 py-2">
            {navItems.map((item) => {
              const active = isActive(pathname, projectId, item.segment);
              const href = getHref(projectId, item.segment);
              const Icon = item.icon;

              return (
                <Link
                  key={item.segment || "feedbacks-mobile"}
                  href={href}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className={cn("h-4 w-4", active && "text-primary")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-b border-border/70 bg-card/90 px-4 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] md:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold tracking-tight text-foreground md:text-xl">
                {projectName}
              </h1>
              {websiteUrl ? (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block truncate text-sm text-primary hover:underline"
                >
                  {websiteUrl}
                </a>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">No website URL</p>
              )}
            </div>

            <Link
              href={`/workspaces/${workspaceId}/projects`}
              className="mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-sidebar-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Projects
            </Link>
          </div>
        </div>

        <div className="px-4 py-5 md:px-6">{children}</div>
      </div>
    </div>
  );
}
