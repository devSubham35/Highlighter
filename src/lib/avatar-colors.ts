export const AVATAR_COLORS = [
  { bg: "bg-primary/20", text: "text-primary" },
  { bg: "bg-success/20", text: "text-success" },
  { bg: "bg-warning/20", text: "text-warning" },
  { bg: "bg-info/20", text: "text-info" },
  { bg: "bg-destructive/20", text: "text-destructive" },
] as const;

export function avatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
