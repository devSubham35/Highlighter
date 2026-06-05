import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  action,
  className,
  sticky = false,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
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
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
