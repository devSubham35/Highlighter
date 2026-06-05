"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  ChevronsLeft,
  FolderKanban,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

const nav: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

export function Sidebar({
  mobileOpen,
  collapsed,
  onCollapse,
  onCloseMobile,
}: {
  mobileOpen: boolean;
  collapsed: boolean;
  onCollapse: () => void;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const iconOnly = collapsed && !mobileOpen;

  const closeMobile = useCallback(() => onCloseMobile(), [onCloseMobile]);

  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1280px)");
    const onChange = () => {
      if (media.matches) closeMobile();
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [closeMobile]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  const navigate = useCallback(
    (href: string) => {
      router.push(href);
      closeMobile();
    },
    [router, closeMobile],
  );

  return (
    <TooltipProvider delay={150}>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 top-14 z-40 bg-black/50 xl:hidden"
          onClick={closeMobile}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-14 z-40 flex h-[calc(100vh-56px)] w-67 -translate-x-full flex-col border-r border-border/80 bg-sidebar/95 shadow-2xl backdrop-blur-md transition-all duration-300 xl:translate-x-0 xl:shadow-none",
          mobileOpen && "translate-x-0",
          collapsed ? "xl:w-16" : "xl:w-67",
        )}
      >
        <div
          className={cn(
            "hidden shrink-0 p-3 xl:flex",
            collapsed ? "justify-center" : "justify-end",
          )}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="h-7 w-7 text-muted-foreground hover:bg-[#FFFFFF14] hover:text-foreground"
          >
            <ChevronsLeft
              className={cn("h-3.5 w-3.5 transition-transform duration-300", collapsed && "rotate-180")}
            />
          </Button>
        </div>

        <nav
          className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-3 pt-3 xl:pt-0"
          style={iconOnly ? { scrollbarWidth: "none" } : undefined}
        >
          {!iconOnly ? (
            <p className="px-2.5 pb-1 text-[10px] font-semibold tracking-wider text-muted-foreground/70">
              Workspace
            </p>
          ) : (
            <div className="mx-2 my-1 border-t border-sidebar-border" />
          )}

          {nav.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;

            const navButton = (
              <Button
                type="button"
                variant={active ? "secondary" : "ghost"}
                onClick={() => navigate(item.href)}
                className={cn(
                  "h-10 w-full rounded-xl transition-all duration-200",
                  iconOnly ? "justify-center px-0" : "justify-start gap-2.5 px-2.5",
                  active
                    ? "bg-sidebar-accent! text-foreground shadow-[0_1px_2px_rgba(34,197,94,0.08)] dark:bg-[#22C55E1A]!"
                    : "text-muted-foreground hover:bg-sidebar-accent/80! hover:text-foreground dark:hover:bg-[#22C55E14]!",
                )}
              >
                <Icon className={cn("size-[18px] shrink-0", active && "text-primary")} />
                {!iconOnly && <span className="text-[13px] font-semibold">{item.label}</span>}
              </Button>
            );

            return (
              <div key={item.href} className="relative">
                {iconOnly ? (
                  <Tooltip>
                    <TooltipTrigger render={<div className="w-full" />}>{navButton}</TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  navButton
                )}
              </div>
            );
          })}
        </nav>

        {!iconOnly && (
          <div className="shrink-0 border-t border-sidebar-border p-3">
            <div className="rounded-lg bg-primary/10 p-3">
              <p className="text-xs font-semibold text-primary">Need help?</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                Drop the widget script on your site to start collecting reports.
              </p>
            </div>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}
