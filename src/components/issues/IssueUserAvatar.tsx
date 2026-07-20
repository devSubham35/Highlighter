import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { WorkspaceMember } from "@/types";

const DEFAULT_AVATAR_IMAGE = "https://github.com/maxleiter.png";

export function IssueUserAvatar({
  name,
  image,
  className,
}: {
  name: string;
  image?: string | null;
  className?: string;
}) {
  const initial = name.slice(0, 1).toUpperCase();

  return (
    <Avatar className={cn("size-7", className)}>
      <AvatarImage src={image ?? DEFAULT_AVATAR_IMAGE} alt={name} />
      <AvatarFallback className="text-[11px]">{initial}</AvatarFallback>
    </Avatar>
  );
}

export function IssueAvatarGroup({
  members,
  max = 3,
  size = "md",
  className,
}: {
  members: WorkspaceMember[];
  max?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const visibleMembers = members.slice(0, max);
  const hiddenCount = Math.max(members.length - visibleMembers.length, 0);
  const avatarSize = size === "sm" ? "size-7" : "size-8";
  const counterSize = size === "sm" ? "h-7 min-w-7" : "h-8 min-w-8";

  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex -space-x-2.5">
        {visibleMembers.map((member) => (
          <IssueUserAvatar
            key={member.id}
            name={member.name || member.email}
            image={member.image}
            className={cn(avatarSize, "border border-border/60 ring-2 ring-card")}
          />
        ))}
      </div>
      {hiddenCount > 0 ? (
        <span
          className={cn(
            "-ml-2 inline-flex items-center justify-center rounded-full border border-border bg-card px-1.5 text-[11px] font-semibold text-foreground shadow-sm ring-2 ring-card",
            counterSize,
          )}
        >
          +{hiddenCount}
        </span>
      ) : null}
    </div>
  );
}
