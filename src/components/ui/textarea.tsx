import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-xl border border-input bg-card px-3 py-2 text-base shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-[border-color,box-shadow] duration-200 outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:shadow-[var(--shadow-focus)] disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:shadow-[0_0_0_4px_rgba(239,68,68,0.12)] md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
