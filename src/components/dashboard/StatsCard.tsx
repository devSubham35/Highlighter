import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export function StatsCard({
  label,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendTone = "positive",
  className,
  iconClassName,
  iconBgClassName,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendTone?: "positive" | "negative" | "neutral";
  className?: string;
  iconClassName?: string;
  iconBgClassName?: string;
}) {
  return (
    <Card
      className={cn(
        "rounded-xl border border-sidebar-border bg-card py-0 shadow-none dark:bg-surface-elevated",
        className,
      )}
    >
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            iconBgClassName ?? "bg-primary/10",
          )}
        >
          <Icon className={cn("h-5 w-5", iconClassName ?? "text-primary")} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
          <div className="mt-1 flex min-w-0 items-center gap-2">
            <p className="truncate text-xl font-semibold leading-none tracking-tight text-foreground">
              {value}
            </p>
            {trend ? (
              <span
                className={cn(
                  "inline-flex h-5 shrink-0 items-center rounded-full px-1.5 text-[10px] font-medium",
                  trendTone === "positive" && "bg-success/10 text-success",
                  trendTone === "negative" && "bg-destructive/10 text-destructive",
                  trendTone === "neutral" && "bg-muted text-muted-foreground",
                )}
              >
                {trend}
              </span>
            ) : null}
          </div>
          {subtitle ? (
            <span className="mt-1.5 block truncate text-xs text-muted-foreground">
              {subtitle}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
