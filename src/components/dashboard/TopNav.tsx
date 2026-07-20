"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Bell, CircleHelp, Menu, Moon, Plus, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function TopNav({
  onMenuClick,
  compact = false,
}: {
  onMenuClick?: () => void;
  compact?: boolean;
}) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const workspaceMatch = pathname.match(/^\/workspaces\/([^/]+)/);
  const workspaceId = workspaceMatch?.[1];

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border/80 bg-card/95 px-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-md md:px-6">
      {!compact && onMenuClick ? (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <Menu className="h-4 w-4" />
        </Button>
      ) : null}

      {!compact ? (
        <div className="relative hidden min-w-0 flex-1 sm:block sm:max-w-xl">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search anything..."
            className="h-9 rounded-md bg-muted/30 pl-9 text-sm"
          />
          <kbd className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground lg:inline">
            ⌘ K
          </kbd>
        </div>
      ) : (
        <div className="min-w-0 flex-1" />
      )}

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        {!compact ? (
          <>
            <Button type="button" variant="outline" size="icon" className="relative hidden sm:inline-flex">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
            </Button>
            <Button type="button" variant="outline" size="icon" className="hidden sm:inline-flex">
              <CircleHelp className="h-4 w-4 text-muted-foreground" />
            </Button>
            {workspaceId ? (
              <Button
                render={<Link href={`/workspaces/${workspaceId}/projects`} />}
                size="sm"
                className="hidden rounded-md sm:inline-flex"
              >
                <Plus className="h-4 w-4" />
                New project
              </Button>
            ) : null}
          </>
        ) : null}

        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Toggle theme"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              mounted && theme === "dark" ? "scale-0" : "scale-100",
              !mounted && "scale-100",
            )}
          />
          <Moon
            className={cn(
              "absolute h-4 w-4 text-muted-foreground transition-transform",
              mounted && theme === "dark" ? "scale-100" : "scale-0",
              !mounted && "scale-0",
            )}
          />
        </Button>
      </div>
    </header>
  );
}
