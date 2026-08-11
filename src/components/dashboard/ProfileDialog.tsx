"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Circle, Clock, Coffee, LoaderCircle, Moon, Pencil } from "lucide-react";
import { useEffect, useState } from "react";

export type DashboardUserProfile = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  status?: string | null;
  createdAt?: string | null;
};

const statusOptions: ComboboxOption[] = [
  { value: "Available", label: "Available", icon: <Circle className="h-4 w-4 fill-emerald-500 text-emerald-500" /> },
  { value: "In a meeting", label: "In a meeting", icon: <Clock className="h-4 w-4 text-amber-500" /> },
  { value: "Focus time", label: "Focus time", icon: <Pencil className="h-4 w-4 text-primary" /> },
  { value: "Away", label: "Away", icon: <Coffee className="h-4 w-4 text-orange-500" /> },
  { value: "Offline", label: "Offline", icon: <Moon className="h-4 w-4 text-muted-foreground" /> },
];

export function ProfileDialog({
  open,
  onOpenChange,
  user,
  onUserChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: DashboardUserProfile;
  onUserChange: (user: DashboardUserProfile) => void;
}) {
  const [name, setName] = useState(user.name ?? "");
  const [status, setStatus] = useState(user.status ?? "Available");
  const [saving, setSaving] = useState(false);
  const initials = userInitials(name || user.email || "U");
  const joinedLabel = formatJoinedDate(user.createdAt);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setName(user.name ?? "");
      setStatus(user.status ?? "Available");
    });
    return () => {
      cancelled = true;
    };
  }, [open, user.name, user.status]);

  async function saveProfile() {
    setSaving(true);
    const response = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, status }),
    });
    setSaving(false);

    if (!response.ok) {
      toast.error("Profile update failed", "Check your details and try again.");
      return;
    }

    const updated = (await response.json()) as {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      status?: string | null;
      createdAt?: string | Date | null;
    };

    onUserChange({
      name: updated.name,
      email: updated.email,
      image: updated.image,
      status: updated.status,
      createdAt: updated.createdAt ? new Date(updated.createdAt).toISOString() : user.createdAt,
    });
    toast.success("Profile updated");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton className="max-w-md">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
          <DialogDescription>Update how your profile appears across Highlight.</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-5">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3">
            <Avatar className="size-12">
              {user.image ? <AvatarImage src={user.image} alt={name || "User"} /> : null}
              <AvatarFallback className="font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{name || "User"}</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <label className="block space-y-2">
            <span className="block text-sm font-medium text-foreground">Name</span>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
          </label>

          <label className="block space-y-2">
            <span className="block text-sm font-medium text-foreground">Email</span>
            <Input value={user.email ?? ""} readOnly className="bg-muted/40 text-muted-foreground" />
          </label>

          <label className="block space-y-2">
            <span className="block text-sm font-medium text-foreground">Status</span>
            <Combobox
              value={status}
              onValueChange={setStatus}
              options={statusOptions}
              searchable={false}
              showSelectedCheck={false}
              aria-label="Profile status"
              className="w-full"
            />
          </label>

          <div className="rounded-xl border border-border bg-muted/20 px-3 py-2.5">
            <p className="text-xs font-medium uppercase text-muted-foreground">Joined</p>
            <p className="mt-1 text-sm text-foreground">{joinedLabel}</p>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={saveProfile} disabled={saving || name.trim().length < 2}>
            {saving ? <LoaderCircle className={cn("h-4 w-4 animate-spin")} /> : null}
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function userInitials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";
}

function formatJoinedDate(value: string | null | undefined) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
