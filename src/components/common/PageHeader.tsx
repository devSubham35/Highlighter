import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  action,
  backHref,
  className,
  sticky = false,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  backHref?: string;
  className?: string;
  sticky?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4",
        sticky &&
          "sticky top-14 z-20 border-b border-sidebar-border bg-card/95 py-3 backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {backHref ? (
          <Link
            href={backHref}
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        ) : null}
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
