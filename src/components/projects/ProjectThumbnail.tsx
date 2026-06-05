"use client";

import { cn } from "@/lib/utils";
import { Globe } from "lucide-react";

function getHostname(url: string | null | undefined) {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export function ProjectThumbnail({
  websiteUrl,
  className,
}: {
  websiteUrl: string | null;
  className?: string;
}) {
  const hostname = getHostname(websiteUrl);
  const faviconUrl = hostname ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=128` : null;

  return (
    <div className={cn("relative shrink-0 overflow-hidden", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-primary/5" />
      {faviconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={faviconUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Globe className="h-5 w-5 text-primary/70" />
        </div>
      )}
    </div>
  );
}
