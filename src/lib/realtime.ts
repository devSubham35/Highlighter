import type { IssuePriority, IssueType, ReportStatus } from "@/types";
import type { Report } from "@prisma/client";

export type IssueRealtimeToken = {
  token: string;
  projectId: string;
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

export function createRealtimeToken(input: Omit<IssueRealtimeToken, "token" | "expiresAt">) {
  const token = crypto.randomUUID();
  const entry: IssueRealtimeToken = {
    ...input,
    token,
    expiresAt: Date.now() + 5 * 60 * 1000,
  };
  getState().tokens.set(token, entry);
  return entry;
}

export function consumeRealtimeToken(token: string) {
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
  getState().broadcast?.(event);
}
