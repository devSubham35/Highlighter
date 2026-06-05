"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Download, X } from "lucide-react";

export function IssueScreenshotLightbox({
  open,
  onOpenChange,
  screenshotUrl,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  screenshotUrl: string;
  title: string;
}) {
  async function handleDownload() {
    try {
      const response = await fetch(screenshotUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${title.replace(/\s+/g, "-").slice(0, 40)}-screenshot.png`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(screenshotUrl, "_blank");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/70"
        className="flex h-[min(92vh,900px)] w-[min(96vw,1100px)] max-w-none flex-col overflow-hidden rounded-lg border-0 bg-black/95 p-0 shadow-2xl"
      >
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-white hover:bg-white/15 hover:text-white"
            aria-label="Download screenshot"
            onClick={() => void handleDownload()}
          >
            <Download className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-white hover:bg-white/15 hover:text-white"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center p-4 pt-14">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={screenshotUrl}
            alt={title}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
