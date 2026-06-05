import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

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
      {image ? <AvatarImage src={image} alt={name} /> : null}
      <AvatarFallback className="text-[11px]">{initial}</AvatarFallback>
    </Avatar>
  );
}
