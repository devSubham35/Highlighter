"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Highlighter, LayoutDashboard, LogOut, Moon, Sun, User } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function TopNav({ user }: { user: { name?: string | null; email?: string | null } }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const initials = (user.name ?? user.email ?? "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function handleLogout() {
    signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/login";
        },
      },
    });
  }

  return (
    <header className="fixed top-0 left-0 z-50 flex h-14 w-full items-center border-b border-border/80 bg-card/95 px-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-md md:px-6">
      <Link href="/workspaces" className="flex min-w-0 items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Highlighter className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-none text-foreground">Highlighter</p>
          <p className="mt-0.5 hidden truncate text-[11px] text-muted-foreground sm:block">
            Visual feedback
          </p>
        </div>
      </Link>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <div className="mr-1 hidden text-right lg:block">
          <p className="text-sm font-medium leading-none text-foreground">{user.name ?? "User"}</p>
          <p className="mt-0.5 max-w-[180px] truncate text-[11px] text-muted-foreground">
            {user.email}
          </p>
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

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                aria-label="Open profile menu"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary transition-colors hover:bg-primary/25"
              >
                {initials}
              </button>
            }
          />
          <DropdownMenuContent align="end" className="min-w-48">
            <div className="px-2 py-1.5 lg:hidden">
              <p className="text-sm font-medium text-foreground">{user.name ?? "User"}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            <DropdownMenuSeparator className="lg:hidden" />
            <DropdownMenuItem onClick={() => router.push("/dashboard")} className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/profile")} className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="gap-2 text-destructive data-highlighted:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
