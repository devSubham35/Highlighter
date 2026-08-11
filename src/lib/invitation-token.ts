import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const TOKEN_VERSION = "inv_v1";

function secret() {
  return process.env.INVITATION_TOKEN_SECRET ?? process.env.BETTER_AUTH_SECRET ?? "highlight-dev-secret";
}

function signPayload(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createInvitationToken(invitationId: string) {
  const nonce = randomBytes(24).toString("base64url");
  const payload = `${TOKEN_VERSION}.${invitationId}.${nonce}`;
  return `${payload}.${signPayload(payload)}`;
}

export function parseInvitationToken(token: string) {
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== TOKEN_VERSION) return null;

  const payload = parts.slice(0, 3).join(".");
  const expected = signPayload(payload);
  const actual = parts[3];

  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);
  if (expectedBuffer.length !== actualBuffer.length) return null;
  if (!timingSafeEqual(expectedBuffer, actualBuffer)) return null;

  return { invitationId: parts[1], nonce: parts[2] };
}

export function invitationUrl(token: string, origin?: string | null) {
  const baseUrl = origin ?? process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  return `${baseUrl.replace(/\/$/, "")}/invite/${encodeURIComponent(token)}`;
}
