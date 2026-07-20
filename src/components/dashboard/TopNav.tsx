"use client";

import { NotificationsDrawer } from "@/components/dashboard/NotificationsDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Menu, Moon, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function TopNav({
  onMenuClick,
  compact = false,
}: {
  onMenuClick?: () => void;
  compact?: boolean;
}) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

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

      <div className="min-w-0 flex-1" />

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        {!compact ? (
          <>
            <div className="relative hidden w-72 min-w-0 sm:block lg:w-96">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search anything..."
                className="h-9 rounded-md bg-muted/30 pl-9 pr-16 text-sm"
              />
              <kbd className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground lg:inline">
                Cmd K
              </kbd>
            </div>
            <NotificationsDrawer />
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
