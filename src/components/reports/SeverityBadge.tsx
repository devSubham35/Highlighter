import { Badge } from "@/components/ui/badge";
import type { Severity } from "@/types";

const variants: Record<Severity, "secondary" | "warning" | "destructive" | "purple"> = {
  LOW: "secondary",
  MEDIUM: "warning",
  HIGH: "destructive",
  CRITICAL: "purple",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return <Badge variant={variants[severity]}>{severity.toLowerCase()}</Badge>;
}
