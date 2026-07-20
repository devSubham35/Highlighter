"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

function Toaster({ ...props }: ToasterProps) {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="bottom-right"
      closeButton
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:rounded-xl group-[.toaster]:border group-[.toaster]:border-border/70 group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:shadow-[var(--shadow-surface-hover)] group-[.toaster]:font-sans",
          success: "group-[.toaster]:border-primary/25 group-[.toaster]:bg-card",
          error: "group-[.toaster]:border-destructive/30 group-[.toaster]:bg-card",
          warning: "group-[.toaster]:border-warning/30 group-[.toaster]:bg-card",
          info: "group-[.toaster]:border-info/30 group-[.toaster]:bg-card",
          title: "group-[.toast]:font-semibold group-[.toast]:text-foreground",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:rounded-lg group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:rounded-lg group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton:
            "group-[.toast]:border-border/60 group-[.toast]:bg-card group-[.toast]:text-foreground",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
