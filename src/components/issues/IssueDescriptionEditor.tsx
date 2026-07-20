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
    if (editing) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setDraft(description ?? "");
    });
    return () => {
      cancelled = true;
    };
  }, [description, editing]);

  async function handleSave() {
    setSaving(true);
    const trimmed = draft.trim();
    await onSave(trimmed ? trimmed : null);
    setSaving(false);
    setEditing(false);
  }

  return (
    <section className="shrink-0 bg-card px-5 pt-4 pb-3 dark:bg-surface-elevated">
      <h3 className="text-[13px] font-semibold text-foreground">Description</h3>
      {!editing ? (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-2 w-full cursor-text rounded-md text-left text-sm leading-5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <span className={cn(description?.trim() && "text-foreground")}>
            {description?.trim() ? description : "Add a description..."}
          </span>
        </button>
      ) : (
        <div className="mt-2 space-y-2">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="h-24 resize-none text-sm"
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
