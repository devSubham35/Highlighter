"use client";

import type { IssueRealtimeEvent } from "@/lib/realtime";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import { useEffect, useRef } from "react";

type RealtimeSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

type ServerToClientEvents = {
  "issue:event": (event: IssueRealtimeEvent) => void;
  "realtime:error": (payload: { message: string }) => void;
  subscribed: (payload: { userId: string }) => void;
  "room:joined": (payload: { workspaceId?: string; projectId?: string; issueId?: string }) => void;
  "user:connected": (payload: { userId: string }) => void;
  "user:disconnected": (payload: { userId: string }) => void;
};

type ClientToServerEvents = {
  "room:join": (payload: { token: string }) => void;
  "room:leave": (payload: { workspaceId?: string; projectId?: string; issueId?: string }) => void;
};

type RealtimeManager = {
  socket: RealtimeSocket | null;
  connecting?: Promise<RealtimeSocket | null>;
  listeners: Set<(event: IssueRealtimeEvent) => void>;
  subscriptions: Map<
    string,
    { input: { workspaceId?: string; projectId?: string; issueId?: string }; count: number }
  >;
};

const realtimeManager: RealtimeManager = {
  socket: null,
  listeners: new Set(),
  subscriptions: new Map(),
};

async function requestRealtimeToken(input: { workspaceId?: string; projectId?: string; issueId?: string }) {
  const response = await fetch("/api/realtime/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) return null;
  return (await response.json()) as { token: string; expiresAt: string };
}

async function getRealtimeSocket() {
  if (realtimeManager.socket?.connected) return realtimeManager.socket;
  if (realtimeManager.connecting) return realtimeManager.connecting;

  realtimeManager.connecting = (async () => {
    const token = await requestRealtimeToken({});
    if (!token) return null;

    realtimeManager.socket?.disconnect();
    const socket: RealtimeSocket = io({
      path: "/api/realtime/socket",
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 750,
      reconnectionDelayMax: 5000,
      auth: { token: token.token },
    });

    socket.on("issue:event", (event) => {
      realtimeManager.listeners.forEach((listener) => listener(event));
    });
    socket.on("connect", () => {
      realtimeManager.subscriptions.forEach((subscription) => {
        void joinRealtimeRoom(socket, subscription.input);
      });
    });
    socket.on("realtime:error", () => {
      socket.disconnect();
      if (realtimeManager.socket === socket) realtimeManager.socket = null;
    });
    socket.on("disconnect", (reason) => {
      if (realtimeManager.socket !== socket) return;
      if (reason === "io server disconnect") {
        void refreshSocketAuth(socket);
        return;
      }
      if (!socket.active) realtimeManager.socket = null;
    });

    realtimeManager.socket = socket;
    return socket;
  })().finally(() => {
    realtimeManager.connecting = undefined;
  });

  return realtimeManager.connecting;
}

function subscriptionKey(input: { workspaceId?: string; projectId?: string; issueId?: string }) {
  return [input.workspaceId ?? "", input.projectId ?? "", input.issueId ?? ""].join(":");
}

async function joinRealtimeRoom(
  socket: RealtimeSocket,
  input: { workspaceId?: string; projectId?: string; issueId?: string },
) {
  const roomToken = await requestRealtimeToken(input);
  if (!roomToken) return;
  socket.emit("room:join", { token: roomToken.token });
}

async function refreshSocketAuth(socket: RealtimeSocket) {
  const token = await requestRealtimeToken({});
  if (!token || realtimeManager.socket !== socket) {
    realtimeManager.socket = null;
    return;
  }
  socket.auth = { token: token.token };
  socket.connect();
}

export function disconnectRealtimeSocket() {
  realtimeManager.socket?.disconnect();
  realtimeManager.socket = null;
  realtimeManager.connecting = undefined;
  realtimeManager.listeners.clear();
  realtimeManager.subscriptions.clear();
}

export function useIssueRealtime({
  enabled,
  workspaceId,
  projectId,
  issueId,
  onEvent,
}: {
  enabled: boolean;
  workspaceId?: string;
  projectId?: string;
  issueId?: string;
  onEvent: (event: IssueRealtimeEvent) => void;
}) {
  const onEventRef = useRef(onEvent);
  const key = subscriptionKey({ workspaceId, projectId, issueId });

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!enabled || (!workspaceId && !projectId && !issueId)) return;

    let cancelled = false;
    const listener = (event: IssueRealtimeEvent) => onEventRef.current(event);
    realtimeManager.listeners.add(listener);
    const subscription = realtimeManager.subscriptions.get(key);
    if (subscription) {
      subscription.count += 1;
    } else {
      realtimeManager.subscriptions.set(key, {
        input: { workspaceId, projectId, issueId },
        count: 1,
      });
    }

    async function joinRoom() {
      const socket = await getRealtimeSocket();
      if (cancelled || !socket) return;
      await joinRealtimeRoom(socket, { workspaceId, projectId, issueId });
    }

    void joinRoom();

    return () => {
      cancelled = true;
      realtimeManager.listeners.delete(listener);
      const subscription = realtimeManager.subscriptions.get(key);
      if (!subscription || subscription.count <= 1) {
        realtimeManager.subscriptions.delete(key);
        realtimeManager.socket?.emit("room:leave", { workspaceId, projectId, issueId });
      } else {
        subscription.count -= 1;
      }
    };
  }, [enabled, issueId, key, projectId, workspaceId]);
}
