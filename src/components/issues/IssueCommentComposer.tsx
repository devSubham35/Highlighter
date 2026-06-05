"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { AtSign, Paperclip, Smile, Users } from "lucide-react";
import { useState } from "react";

export function IssueCommentComposer({
  onSubmit,
  disabled,
}: {
  onSubmit: (content: string) => Promise<void>;
  disabled?: boolean;
}) {
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState("Everyone");
  const [submitting, setSubmitting] = useState(false);

  async function handleSend() {
    const trimmed = content.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(trimmed);
      setContent("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border border-[#dadce0] bg-white shadow-sm">
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Write a comment..."
        rows={3}
        disabled={disabled || submitting}
        className="w-full resize-none rounded-t-lg border-0 bg-transparent px-4 py-3 text-sm text-foreground outline-none placeholder:text-[#80868b]"
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            void handleSend();
          }
        }}
      />
      <div className="flex items-center justify-between gap-2 border-t border-[#e8eaed] px-3 py-2">
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[#5f6368] hover:text-foreground"
            aria-label="Add emoji"
          >
            <Smile className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[#5f6368] hover:text-foreground"
            aria-label="Attach file"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[#5f6368] hover:text-foreground"
            aria-label="Mention someone"
          >
            <AtSign className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-[#5f6368]",
                "hover:bg-[#f1f3f4] hover:text-foreground",
              )}
            >
              <Users className="h-3.5 w-3.5" />
              {visibility}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {["Everyone", "Team only", "Private"].map((option) => (
                <DropdownMenuItem key={option} onClick={() => setVisibility(option)}>
                  {option}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            type="button"
            size="sm"
            className="h-8 rounded-md px-4 text-xs font-semibold"
            disabled={!content.trim() || submitting || disabled}
            onClick={() => void handleSend()}
          >
            {submitting ? "Sending…" : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
}
