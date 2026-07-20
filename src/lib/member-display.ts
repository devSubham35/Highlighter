import type { WorkspaceMember } from "@/types";

export function memberDisplayName(member: WorkspaceMember, currentUserId?: string) {
  return member.id === currentUserId ? "Assign to me" : member.name || member.email;
}
