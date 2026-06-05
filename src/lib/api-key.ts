import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 24);

export function generateApiKey(): string {
  return `project_live_${nanoid()}`;
}
