"use client";

import type { IssueRealtimeEvent } from "@/lib/realtime";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import { useEffect, useRef } from "react";

export function useIssueRealtime({
  enabled,
  projectId,
  issueId,
  onEvent,
}: {
  enabled: boolean;
  projectId?: string;
  issueId?: string;
  onEvent: (event: IssueRealtimeEvent) => void;
}) {
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!enabled || !projectId) return;

    let cancelled = false;
    let socket: Socket | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;

    function scheduleReconnect() {
      if (cancelled || retry) return;
      retry = setTimeout(() => {
        retry = null;
        void connect();
      }, 1500);
    }

    async function connect() {
      try {
        const tokenResponse = await fetch("/api/realtime/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, issueId }),
        });
        if (!tokenResponse.ok) return;

        const { token } = (await tokenResponse.json()) as { token: string };
        if (cancelled) return;

        socket?.disconnect();
        socket = io({
          path: "/api/realtime",
          transports: ["websocket"],
          reconnection: false,
          auth: { token },
        });

        socket.on("issue:event", (event: IssueRealtimeEvent) => {
          onEventRef.current(event);
        });

        socket.on("realtime:error", () => {
          socket?.disconnect();
        });

        socket.on("connect_error", scheduleReconnect);
        socket.on("disconnect", scheduleReconnect);
      } catch {
        scheduleReconnect();
      }
    }

    void connect();

    return () => {
      cancelled = true;
      if (retry) clearTimeout(retry);
      socket?.disconnect();
    };
  }, [enabled, issueId, projectId]);
}
