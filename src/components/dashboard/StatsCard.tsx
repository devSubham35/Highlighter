import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export function StatsCard({
  label,
  value,
  subtitle,
  icon: Icon,
  className,
  iconClassName,
  iconBgClassName,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  className?: string;
  iconClassName?: string;
  iconBgClassName?: string;
}) {
  return (
    <Card className={cn("border border-sidebar-border shadow-sm dark:bg-surface-elevated", className)}>
      <CardContent className="flex items-center gap-4 p-4 lg:p-5">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-md",
            iconBgClassName ?? "bg-primary/10",
          )}
        >
          <Icon className={cn("h-5 w-5", iconClassName ?? "text-primary")} />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
          {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
