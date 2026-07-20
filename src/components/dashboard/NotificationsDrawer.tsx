"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { avatarColor } from "@/lib/avatar-colors";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Bell, CircleDot, UserRoundPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type NotificationItem = {
  id: string;
  kind: "issue_created" | "assignment";
  title: string;
  issueTitle: string;
  issueKey: string;
  projectName: string;
  authorName: string;
  createdAt: string;
  href: string;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function relativeTime(value: string) {
  return formatDistanceToNow(new Date(value), { addSuffix: true }).replace(/^about /, "");
}

export function NotificationsDrawer() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    async function loadNotifications() {
      setLoading(true);
      const response = await fetch("/api/notifications");
      setLoading(false);
      if (!response.ok || cancelled) return;
      const data = (await response.json()) as { notifications?: NotificationItem[] };
      setNotifications(data.notifications ?? []);
    }

    void loadNotifications();

    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="relative hidden sm:inline-flex"
        aria-label="Open notifications"
        onClick={() => setOpen(true)}
      >
        <Bell className="h-4 w-4 text-muted-foreground" />
        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton
          className="left-auto right-0 top-0 h-dvh max-h-dvh w-[min(100vw,420px)] max-w-none translate-x-0 translate-y-0 rounded-none border-y-0 border-r-0 p-0 transition-transform duration-200 ease-out data-ending-style:translate-x-full data-starting-style:translate-x-full"
          overlayClassName="bg-black/30"
        >
          <DialogHeader className="px-5 py-4">
            <DialogTitle>Notifications</DialogTitle>
            <DialogDescription>Recent assignments and new issues.</DialogDescription>
          </DialogHeader>

          <DialogBody className="px-0 py-0">
            {loading ? (
              <div className="divide-y divide-sidebar-border">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex gap-3 px-5 py-4">
                    <div className="size-9 shrink-0 animate-pulse rounded-full bg-muted" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 h-4 w-4 shrink-0 animate-pulse rounded-full bg-muted" />
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                          <div className="h-4 w-full animate-pulse rounded bg-muted" />
                          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                        </div>
                      </div>
                      <div className="ml-6 h-3 w-48 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-5 py-8 text-sm text-muted-foreground">
                No notifications yet.
              </div>
            ) : (
              <div className="divide-y divide-sidebar-border">
                {notifications.map((item) => {
                  const colors = avatarColor(item.authorName);
                  const Icon = item.kind === "assignment" ? UserRoundPlus : CircleDot;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="flex w-full gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/50"
                      onClick={() => {
                        setOpen(false);
                        router.push(item.href);
                      }}
                    >
                      <Avatar className="size-9 shrink-0">
                        <AvatarFallback
                          className={cn("text-xs font-semibold", colors.bg, colors.text)}
                        >
                          {initials(item.authorName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-2">
                          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground">{item.title}</p>
                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                              <span className="font-medium text-foreground">{item.issueKey}</span>{" "}
                              {item.issueTitle}
                            </p>
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {item.authorName} - {item.projectName} - {relativeTime(item.createdAt)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
