import { Badge } from "@/components/ui/badge";
import { Highlighter as HighlightIcon, MousePointer2 } from "lucide-react";

export function HeroMockup() {
  return (
    <div className="relative mx-auto w-full max-w-lg">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-8 rounded-full bg-primary/15 blur-3xl"
      />

      <div className="relative overflow-hidden rounded-2xl border border-sidebar-border bg-card shadow-2xl shadow-primary/10">
        <div className="flex items-center gap-2 border-b border-sidebar-border bg-muted/60 px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--traffic-close)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--traffic-minimize)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--traffic-maximize)]" />
          </div>
          <div className="mx-auto flex h-6 w-48 items-center justify-center rounded-md bg-background/80 px-3 text-[10px] text-muted-foreground">
            yoursite.com/checkout
          </div>
        </div>

        <div className="relative bg-muted/40 p-5">
          <div className="space-y-3 rounded-xl bg-card p-4 shadow-sm ring-1 ring-foreground/5">
            <div className="h-3 w-2/5 rounded-full bg-muted-foreground/20" />
            <div className="grid grid-cols-3 gap-2">
              <div className="h-16 rounded-lg bg-muted" />
              <div className="h-16 rounded-lg bg-muted" />
              <div className="h-16 rounded-lg bg-muted" />
            </div>
            <div className="h-20 rounded-lg border-2 border-dashed border-primary/50 bg-primary/5" />
            <div className="flex gap-2">
              <div className="h-8 w-24 rounded-md bg-primary/20" />
              <div className="h-8 w-20 rounded-md bg-muted" />
            </div>
          </div>

          <div className="absolute bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30">
            <HighlightIcon className="h-5 w-5" />
          </div>

          <div className="absolute left-8 top-16 w-52 rounded-xl border border-sidebar-border bg-card p-3 shadow-xl">
            <div className="flex items-center gap-2">
              <MousePointer2 className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-foreground">Report an issue</span>
            </div>
            <div className="mt-2 h-14 rounded-md border border-primary/40 bg-primary/5" />
            <div className="mt-2 space-y-1.5">
              <div className="h-2 w-full rounded-full bg-muted" />
              <div className="h-2 w-4/5 rounded-full bg-muted" />
            </div>
            <div className="mt-3 flex justify-end">
              <span className="rounded-md bg-primary px-2 py-1 text-[10px] font-medium text-primary-foreground">
                Submit
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-4 -left-4 rounded-xl border border-sidebar-border bg-card px-3 py-2 shadow-lg">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Captured</p>
        <p className="text-sm font-semibold text-foreground">Chrome · macOS</p>
      </div>

      <div className="absolute -right-3 top-10 rounded-xl border border-sidebar-border bg-card px-3 py-2 shadow-lg">
        <Badge variant="success" className="text-[10px]">
          Report submitted
        </Badge>
      </div>
    </div>
  );
}
