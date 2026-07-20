import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

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
