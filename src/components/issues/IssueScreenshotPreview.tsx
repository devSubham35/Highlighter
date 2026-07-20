"use client";

import { useState } from "react";
import { IssueScreenshotLightbox } from "@/components/issues/IssueScreenshotLightbox";
import { cn } from "@/lib/utils";

export function IssueScreenshotPreview({
  screenshotUrl,
  title = "Issue",
}: {
  screenshotUrl: string | null;
  title?: string;
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!screenshotUrl) {
    return (
      <section className="border-b border-sidebar-border bg-card px-5 py-5 dark:bg-background">
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/60 text-sm text-muted-foreground">
          No screenshot
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="border-b border-sidebar-border bg-card px-5 py-4 dark:bg-background">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="h-[72px] w-[96px] shrink-0 cursor-pointer overflow-hidden rounded-md border-2 border-primary bg-muted"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={screenshotUrl} alt="" className="h-full w-full object-cover object-top" />
          </button>
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className={cn(
              "min-h-[min(36vh,280px)] flex-1 overflow-hidden rounded-lg border border-border bg-muted/60 dark:bg-surface-elevated",
              "cursor-pointer transition-opacity hover:opacity-95",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={screenshotUrl}
              alt="Issue screenshot"
              className="h-full max-h-[min(36vh,280px)] w-full object-contain object-top"
            />
          </button>
        </div>
      </section>
      <IssueScreenshotLightbox
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        screenshotUrl={screenshotUrl}
        title={title}
      />
    </>
  );
}
