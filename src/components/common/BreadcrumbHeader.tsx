import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function BreadcrumbHeader({
  items,
  description,
  className,
}: {
  items: BreadcrumbItem[];
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <span key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="truncate text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    "truncate text-sm font-medium",
                    isLast ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </span>
              )}
              {!isLast ? <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : null}
            </span>
          );
        })}
      </nav>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}
