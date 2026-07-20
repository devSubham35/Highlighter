"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function IssueDescriptionEditor({
  description,
  onSave,
}: {
  description: string | null;
  onSave: (description: string | null) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(description ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(description ?? "");
  }, [description, editing]);

  async function handleSave() {
    setSaving(true);
    const trimmed = draft.trim();
    await onSave(trimmed ? trimmed : null);
    setSaving(false);
    setEditing(false);
  }

  return (
    <section className="border-b border-sidebar-border bg-card px-5 py-4 dark:bg-surface-elevated">
      <h3 className="text-sm font-semibold text-foreground">Description</h3>
      {!editing ? (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-2 w-full cursor-text rounded-md bg-muted/70 px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted dark:bg-white/5 dark:hover:bg-white/10"
        >
          <span className={cn(!description?.trim() && "italic text-muted-foreground")}>
            {description?.trim() ? description : "No description"}
          </span>
        </button>
      ) : (
        <div className="mt-2 space-y-3">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="h-32 resize-none text-sm"
            placeholder="Add a description…"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={() => {
                setDraft(description ?? "");
                setEditing(false);
              }}
            >
              Cancel
            </Button>
            <Button type="button" size="sm" disabled={saving} onClick={() => void handleSave()}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
