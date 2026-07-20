export const AVATAR_COLORS = [
  { bg: "bg-[#22c55e]/20", text: "text-[#16a34a]" },
  { bg: "bg-[#4ade80]/25", text: "text-[#15803d]" },
  { bg: "bg-[#f59e0b]/20", text: "text-[#b45309]" },
  { bg: "bg-[#22c55e]/20", text: "text-[#4ade80]" },
  { bg: "bg-[#f97316]/20", text: "text-[#ea580c]" },
] as const;

export function avatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
