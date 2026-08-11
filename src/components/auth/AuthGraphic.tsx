import { Highlighter as HighlightIcon, MousePointer2 } from "lucide-react";

export function AuthGraphic() {
  return (
    <div className="w-full max-w-[35rem]">
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[var(--shadow-surface)]">
        <div className="flex items-center gap-2 border-b border-border/70 bg-muted/50 px-4 py-2.5">
          <div className="flex gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[var(--traffic-close)]" />
            <span className="h-2 w-2 rounded-full bg-[var(--traffic-minimize)]" />
            <span className="h-2 w-2 rounded-full bg-[var(--traffic-maximize)]" />
          </div>
          <div className="mx-auto rounded-md bg-background px-3 py-0.5 text-[10px] text-muted-foreground">
            yoursite.com
          </div>
        </div>

        <div className="relative bg-muted/30 p-7">
          <div className="space-y-3 rounded-xl bg-card p-5 shadow-[var(--control-shadow)]">
            <div className="h-2.5 w-1/4 rounded-full bg-muted-foreground/20" />
            <div className="grid grid-cols-3 gap-3">
              <div className="h-12 rounded-md bg-muted" />
              <div className="h-12 rounded-md bg-muted" />
              <div className="h-12 rounded-md bg-muted" />
            </div>
            <div className="h-16 rounded-md border border-dashed border-primary/40 bg-primary/5" />
          </div>

          <div className="absolute bottom-6 right-6 flex h-11 w-11 items-center justify-center rounded-full [background:var(--button-brand-bg)] text-primary-foreground shadow-[var(--shadow-button)]">
            <HighlightIcon className="h-4 w-4" />
          </div>

          <div className="absolute left-8 top-11 w-48 rounded-xl border border-border/70 bg-card p-2.5 shadow-[var(--shadow-surface)]">
            <div className="flex items-center gap-1.5">
              <MousePointer2 className="h-3 w-3 text-primary" />
              <span className="text-[11px] font-medium">Report an issue</span>
            </div>
            <div className="mt-2 h-11 rounded border border-primary/30 bg-primary/5" />
            <div className="mt-2 h-1.5 w-full rounded-full bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
