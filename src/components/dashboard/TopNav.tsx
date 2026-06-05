"use client";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Highlighter, List, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useEffect, useState } from "react";

export function TopNav({
  user,
  mobileOpen,
  onMenuToggle,
}: {
  user: { name?: string | null; email?: string | null };
  mobileOpen: boolean;
  onMenuToggle: () => void;
}) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const initials = (user.name ?? user.email ?? "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="fixed top-0 left-0 z-50 flex h-14 w-full items-center border-b border-sidebar-border px-4">
      <div className="mr-2 shrink-0 xl:hidden">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          onClick={onMenuToggle}
        >
          <List className="h-4 w-4" />
        </Button>
      </div>

      <Link href="/dashboard" className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Highlighter className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none text-foreground">Highlighter</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Visual feedback</p>
        </div>
      </Link>

      <div className="ml-auto flex items-center gap-2">
        <div className="mr-1 hidden text-right md:block">
          <p className="text-sm font-medium leading-none text-foreground">{user.name ?? "Workspace"}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{user.email}</p>
        </div>

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

        <div
          aria-hidden
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary"
        >
          {initials}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Log out"
          className="text-muted-foreground hover:text-destructive"
          onClick={() =>
            signOut({
              fetchOptions: {
                onSuccess: () => {
                  window.location.href = "/login";
                },
              },
            })
          }
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
