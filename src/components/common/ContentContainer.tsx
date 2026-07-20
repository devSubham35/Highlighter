import { cn } from "@/lib/utils";

export function ContentContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("mx-auto w-full", className)}>{children}</div>;
}
