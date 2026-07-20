import type { IssuePriority, IssueType, ReportStatus } from "@/types";
import type { Report } from "@prisma/client";
import { createHmac, timingSafeEqual } from "node:crypto";

export type IssueRealtimeToken = {
  token: string;
  workspaceId?: string;
  projectId?: string;
  issueId?: string;
  userId: string;
  expiresAt: number;
};

export type IssueRealtimeComment = {
  id: string;
  reportId: string;
  body: string;
  createdAt: string;
  reactionCount: number;
  reactedByMe: boolean;
  reactions: Array<{
    emoji: string;
    count: number;
    reactedByMe: boolean;
  }>;
  author: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
};

export type IssueRealtimeIssue = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: ReportStatus;
  screenshotUrl: string | null;
  pageUrl: string;
  browser: string | null;
  os: string | null;
  device: string | null;
  userAgent: string | null;
  metadata: unknown;
  createdAt: string;
};

export function toIssueRealtimePayload(report: Report): IssueRealtimeIssue {
  return {
    id: report.id,
    projectId: report.projectId,
    title: report.title,
    description: report.description,
    status: report.status,
    screenshotUrl: report.screenshotUrl,
    pageUrl: report.pageUrl,
    browser: report.browser,
    os: report.os,
    device: report.device,
    userAgent: report.userAgent,
    metadata: report.metadata,
    createdAt: report.createdAt.toISOString(),
  };
}

export type IssueRealtimeEvent =
  | {
      type: "issue.created";
      projectId: string;
      issueId: string;
      issue: IssueRealtimeIssue;
    }
  | {
      type: "issue.updated";
      projectId: string;
      issueId: string;
      issue: IssueRealtimeIssue;
      changed: {
        status?: boolean;
        description?: boolean;
        type?: IssueType;
        priority?: IssuePriority;
        assigneeIds?: string[];
        metadata?: boolean;
      };
    }
  | {
      type: "issue:updated";
      projectId: string;
      issueId: string;
      issue: IssueRealtimeIssue;
      changed: {
        status?: boolean;
        type?: IssueType;
        priority?: IssuePriority;
        assigneeIds?: string[];
        metadata?: boolean;
      };
    }
  | {
      type: "issue:assigned";
      projectId: string;
      issueId: string;
      issue: IssueRealtimeIssue;
      assigneeIds: string[];
      actorId: string;
      actorName: string;
    }
  | {
      type: "issue:status_changed";
      projectId: string;
      issueId: string;
      issue: IssueRealtimeIssue;
      status: ReportStatus;
      previousStatus: ReportStatus;
      actorId: string;
      actorName: string;
    }
  | {
      type: "issue:priority_changed";
      projectId: string;
      issueId: string;
      issue: IssueRealtimeIssue;
      priority: IssuePriority;
      actorId: string;
      actorName: string;
    }
  | {
      type: "issue:type_changed";
      projectId: string;
      issueId: string;
      issue: IssueRealtimeIssue;
      issueType: IssueType;
      actorId: string;
      actorName: string;
    }
  | {
      type: "issue.deleted";
      projectId: string;
      issueId: string;
    }
  | {
      type: "issue.comment_created";
      projectId: string;
      issueId: string;
      comment: IssueRealtimeComment;
    }
  | {
      type: "issue.comment_updated";
      projectId: string;
      issueId: string;
      comment: IssueRealtimeComment;
    }
  | {
      type: "issue.comment_deleted";
      projectId: string;
      issueId: string;
      commentId: string;
    }
  | {
      type: "issue.comment_reaction_updated";
      projectId: string;
      issueId: string;
      commentId: string;
      userId: string;
      emoji: string;
      count: number;
      reactedByUser: boolean;
    };

type RealtimeState = {
  tokens: Map<string, IssueRealtimeToken>;
  broadcast?: (event: IssueRealtimeEvent) => void;
};

const realtimeGlobal = globalThis as typeof globalThis & {
  __highlighterRealtime?: RealtimeState;
};

function getState() {
  if (!realtimeGlobal.__highlighterRealtime) {
    realtimeGlobal.__highlighterRealtime = { tokens: new Map() };
  }
  return realtimeGlobal.__highlighterRealtime;
}

function realtimeSecret() {
  return (
    process.env.BETTER_AUTH_SECRET ??
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    "highlighter-development-realtime-secret"
  );
}

function encodeTokenPart(input: unknown) {
  return Buffer.from(JSON.stringify(input)).toString("base64url");
}

function signTokenPayload(payload: string) {
  return createHmac("sha256", realtimeSecret()).update(payload).digest("base64url");
}

function verifySignature(payload: string, signature: string) {
  const expected = Buffer.from(signTokenPayload(payload));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function createRealtimeToken(input: Omit<IssueRealtimeToken, "token" | "expiresAt">) {
  const expiresAt = Date.now() + 5 * 60 * 1000;
  const payload = encodeTokenPart({
    ...input,
    expiresAt,
    nonce: crypto.randomUUID(),
  });
  const token = `${payload}.${signTokenPayload(payload)}`;
  const entry: IssueRealtimeToken = {
    ...input,
    token,
    expiresAt,
  };
  getState().tokens.set(token, entry);
  return entry;
}

export function consumeRealtimeToken(token: string) {
  const [payload, signature] = token.split(".");
  if (payload && signature && verifySignature(payload, signature)) {
    try {
      const entry = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Omit<
        IssueRealtimeToken,
        "token"
      >;
      if (entry.expiresAt > Date.now() && entry.userId) {
        return { ...entry, token };
      }
    } catch {
      return null;
    }
  }

  const state = getState();
  const entry = state.tokens.get(token);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    state.tokens.delete(token);
    return null;
  }
  state.tokens.delete(token);
  return entry;
}

export function setRealtimeBroadcaster(broadcast: (event: IssueRealtimeEvent) => void) {
  getState().broadcast = broadcast;
}

export function publishIssueEvent(event: IssueRealtimeEvent) {
  const broadcast = getState().broadcast;
  if (broadcast) {
    broadcast(event);
    return;
  }

  void publishIssueEventInternal(event);
}

async function publishIssueEventInternal(event: IssueRealtimeEvent) {
  const body = JSON.stringify(event);
  const port = process.env.PORT ?? "3000";
  const hostname = process.env.HOSTNAME ?? "localhost";
  const endpoint =
    process.env.REALTIME_INTERNAL_URL ??
    `http://${hostname}:${port}/__highlighter/realtime/publish`;

  try {
    await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-realtime-signature": signTokenPayload(body),
      },
      body,
    });
  } catch {
    // Realtime delivery is best-effort after the database transaction succeeds.
  }
}
