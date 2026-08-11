"use client";

import { NotificationsDrawer } from "@/components/dashboard/NotificationsDrawer";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signOut } from "@/lib/auth-client";
import { disconnectRealtimeSocket } from "@/lib/use-issue-realtime";
import { cn } from "@/lib/utils";
import { LogOut, Menu, Moon, Search, Settings, Sun, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

const DEFAULT_AVATAR_IMAGE = "https://github.com/maxleiter.png";

export function TopNav({
  onMenuClick,
  compact = false,
  showLogo = false,
  user,
  className,
  contentClassName,
}: {
  onMenuClick?: () => void;
  compact?: boolean;
  showLogo?: boolean;
  user?: { name?: string | null; email?: string | null; image?: string | null };
  className?: string;
  contentClassName?: string;
}) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const profileTriggerRef = useRef<HTMLButtonElement | null>(null);

  const userInitials = (user?.name ?? user?.email ?? "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!profileMenuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (
        profileMenuRef.current?.contains(target) ||
        profileTriggerRef.current?.contains(target)
      ) {
        return;
      }
      setProfileMenuOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setProfileMenuOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileMenuOpen]);

  function handleLogout() {
    disconnectRealtimeSocket();
    signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/login";
        },
      },
    });
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 shrink-0 items-center border-b border-border/80 bg-card/95 px-4 shadow-[var(--control-shadow)] backdrop-blur-md md:px-6",
        className,
      )}
    >
      <div className={cn("mx-auto flex w-full items-center gap-3", contentClassName)}>
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

        {showLogo ? (
          <Link href="/workspaces" className="flex min-w-0 items-center">
            <BrandLogo className="h-8 w-32" priority />
          </Link>
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
                  className="h-9 rounded-md bg-muted/30 pl-9 text-sm"
                />
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

          {user ? (
            <div className="relative">
              <button
                ref={profileTriggerRef}
                type="button"
                aria-label="Open profile menu"
                aria-expanded={profileMenuOpen}
                className="flex size-9 cursor-pointer items-center justify-center rounded-md border border-border bg-card transition-colors hover:bg-muted/60"
                onClick={() => setProfileMenuOpen((open) => !open)}
              >
                <Avatar className="size-7">
                  <AvatarImage src={user.image ?? DEFAULT_AVATAR_IMAGE} alt={user.name ?? "User"} />
                  <AvatarFallback className="text-[11px] font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </button>

              {profileMenuOpen ? (
                <div
                  ref={profileMenuRef}
                  className="absolute top-full right-0 z-50 mt-2 w-56 overflow-hidden rounded-lg border border-sidebar-border bg-popover p-1 shadow-xl outline-none"
                >
                  <button
                    type="button"
                    className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm text-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      router.push("/profile");
                    }}
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </button>
                  <button
                    type="button"
                    className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm text-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      router.push("/settings");
                    }}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </button>
                  <div className="-mx-1 my-1 h-px bg-border" />
                  <button
                    type="button"
                    className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm text-destructive outline-none transition-colors hover:bg-accent"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
