import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MemberRole } from "@prisma/client";

const roleBadgeClass: Record<MemberRole, string> = {
  OWNER: "border-primary/20 bg-primary/10 text-primary dark:border-primary/30 dark:bg-primary/15",
  ADMIN: "border-primary/20 bg-primary/10 text-primary dark:border-primary/30 dark:bg-primary/15",
  MEMBER: "border-primary/20 bg-primary/10 text-primary dark:border-primary/30 dark:bg-primary/15",
  VIEWER:
    "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-300",
};

export function roleLabel(role: MemberRole) {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

export function RoleBadge({
  role,
  className,
}: {
  role: MemberRole;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-6 min-h-6 rounded-full px-3 py-0 text-[11px] font-semibold uppercase leading-none tracking-wide",
        roleBadgeClass[role],
        className,
      )}
    >
      {roleLabel(role)}
    </Badge>
  );
}
