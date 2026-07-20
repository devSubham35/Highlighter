import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MemberRole } from "@prisma/client";

const roleBadgeClass: Record<MemberRole, string> = {
  OWNER:
    "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300",
  ADMIN:
    "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-300",
  MEMBER:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300",
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
