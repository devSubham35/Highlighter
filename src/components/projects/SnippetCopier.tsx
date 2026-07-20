"use client";

import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function SnippetCopier({ apiKey }: { apiKey: string }) {
  const [copied, setCopied] = useState(false);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const snippet = `<script
  src="${appUrl}/widget.js"
  data-project-key="${apiKey}">
</script>`;

  async function copy() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative rounded-lg border border-sidebar-border bg-[var(--code-bg)] p-4 pr-12 font-mono text-xs text-[var(--code-fg)]">
      <pre className="overflow-x-auto whitespace-pre-wrap break-all">{snippet}</pre>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="absolute right-2 top-2 text-white hover:bg-white/10"
        onClick={copy}
        aria-label="Copy widget snippet"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}
