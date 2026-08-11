import { cn } from "@/lib/utils";
import Image from "next/image";

export function BrandLogo({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <span className={cn("relative block h-9 w-36 overflow-hidden", className)}>
      <Image
        src="/assets/logo_light.png"
        alt="Highlight"
        width={1536}
        height={1024}
        priority={priority}
        className="absolute top-1/2 left-0 h-auto w-full max-w-none -translate-y-1/2 dark:hidden"
      />
      <Image
        src="/assets/logo_dark.png"
        alt="Highlight"
        width={1536}
        height={1024}
        priority={priority}
        className="absolute top-1/2 left-0 hidden h-auto w-full max-w-none -translate-y-1/2 dark:block"
      />
    </span>
  );
}
