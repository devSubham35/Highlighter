"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Download, Minus, Plus, RotateCcw, X } from "lucide-react";
import { useEffect, useState } from "react";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.2;

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
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState<{ x: number; y: number; originX: number; originY: number } | null>(null);

  useEffect(() => {
    if (!open) {
      setZoom(MIN_ZOOM);
      setPosition({ x: 0, y: 0 });
      setDragStart(null);
    }
  }, [open]);

  function clampZoom(nextZoom: number) {
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(nextZoom.toFixed(2))));
  }

  function updateZoom(nextZoom: number) {
    const clamped = clampZoom(nextZoom);
    setZoom(clamped);
    if (clamped === MIN_ZOOM) setPosition({ x: 0, y: 0 });
  }

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
        overlayClassName="bg-background/80 backdrop-blur-sm"
        className="flex h-[min(94vh,920px)] w-[min(96vw,1180px)] max-w-none flex-col overflow-hidden rounded-xl border border-sidebar-border bg-card p-0 shadow-2xl dark:bg-surface-elevated"
      >
        <div className="flex h-13 shrink-0 items-center justify-between border-b border-sidebar-border bg-card/90 px-4 backdrop-blur-md dark:bg-surface-elevated">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">Scroll to zoom</p>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Zoom out"
              onClick={() => updateZoom(zoom - ZOOM_STEP)}
              disabled={zoom <= MIN_ZOOM}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="min-w-12 text-center text-xs font-medium tabular-nums text-muted-foreground">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Zoom in"
              onClick={() => updateZoom(zoom + ZOOM_STEP)}
              disabled={zoom >= MAX_ZOOM}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Reset zoom"
              onClick={() => updateZoom(MIN_ZOOM)}
              disabled={zoom === MIN_ZOOM && position.x === 0 && position.y === 0}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <div className="mx-1 h-5 w-px bg-sidebar-border" />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Download screenshot"
              onClick={() => void handleDownload()}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Close"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div
          className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-muted/40 p-4 dark:bg-background"
          onWheel={(event) => {
            event.preventDefault();
            updateZoom(zoom + (event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP));
          }}
          onMouseDown={(event) => {
            if (zoom <= MIN_ZOOM) return;
            setDragStart({
              x: event.clientX,
              y: event.clientY,
              originX: position.x,
              originY: position.y,
            });
          }}
          onMouseMove={(event) => {
            if (!dragStart) return;
            setPosition({
              x: dragStart.originX + event.clientX - dragStart.x,
              y: dragStart.originY + event.clientY - dragStart.y,
            });
          }}
          onMouseUp={() => setDragStart(null)}
          onMouseLeave={() => setDragStart(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={screenshotUrl}
            alt={title}
            draggable={false}
            className="max-h-full max-w-full select-none rounded-md border border-sidebar-border bg-card object-contain"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
              transition: dragStart ? "none" : "transform 120ms ease-out",
              cursor: zoom > MIN_ZOOM ? (dragStart ? "grabbing" : "grab") : "zoom-in",
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
