import { createServer } from "node:http";
import { createHmac, timingSafeEqual } from "node:crypto";
import { parse } from "node:url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME ?? "localhost";
const port = Number(process.env.PORT ?? 3000);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const realtimeState = (globalThis.__highlightRealtime ??= { tokens: new Map() });

function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [token, entry] of realtimeState.tokens.entries()) {
    if (entry.expiresAt <= now) realtimeState.tokens.delete(token);
  }
}

function realtimeSecret() {
  return (
    process.env.BETTER_AUTH_SECRET ??
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    "highlight-development-realtime-secret"
  );
}

function signTokenPayload(payload) {
  return createHmac("sha256", realtimeSecret()).update(payload).digest("base64url");
}

function verifySignature(payload, signature) {
  const expected = Buffer.from(signTokenPayload(payload));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function consumeToken(token) {
  const [payload, signature] = token.split(".");
  if (payload && signature && verifySignature(payload, signature)) {
    try {
      const entry = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
      if (entry.expiresAt > Date.now() && entry.userId) {
        return { ...entry, token };
      }
    } catch {
      return null;
    }
  }

  cleanupExpiredTokens();
  const entry = realtimeState.tokens.get(token);
  if (!entry) return null;
  realtimeState.tokens.delete(token);
  return entry;
}

function projectRoom(projectId) {
  return `project:${projectId}`;
}

function workspaceRoom(workspaceId) {
  return `workspace:${workspaceId}`;
}

function issueRoom(issueId) {
  return `issue:${issueId}`;
}

function roomsForToken(token) {
  const rooms = [];
  if (token.workspaceId) rooms.push(workspaceRoom(token.workspaceId));
  if (token.projectId) rooms.push(projectRoom(token.projectId));
  if (token.issueId) rooms.push(issueRoom(token.issueId));
  return rooms;
}

await app.prepare();

const server = createServer((req, res) => {
  const parsedUrl = parse(req.url, true);
  if (req.method === "POST" && parsedUrl.pathname === "/__highlight/realtime/publish") {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) req.destroy();
    });
    req.on("end", () => {
      const signature = req.headers["x-realtime-signature"];
      if (typeof signature !== "string" || !verifySignature(body, signature)) {
        res.writeHead(401, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "Unauthorized" }));
        return;
      }

      try {
        realtimeState.broadcast?.(JSON.parse(body));
        res.writeHead(204);
        res.end();
      } catch {
        res.writeHead(400, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid payload" }));
      }
    });
    return;
  }

  void handle(req, res, parsedUrl);
});

const io = new SocketIOServer(server, {
  path: "/api/realtime/socket",
  serveClient: false,
});

io.on("connection", (socket) => {
  const tokenValue = socket.handshake.auth?.token;
  const token = typeof tokenValue === "string" ? consumeToken(tokenValue) : null;

  if (!token) {
    socket.emit("realtime:error", { message: "Subscription token expired" });
    socket.disconnect(true);
    return;
  }

  socket.data.subscription = {
    workspaceId: token.workspaceId,
    projectId: token.projectId,
    issueId: token.issueId,
    userId: token.userId,
  };

  socket.join(`user:${token.userId}`);
  io.emit("user:connected", { userId: token.userId });

  socket.on("room:join", (payload) => {
    const roomTokenValue = payload?.token;
    const roomToken = typeof roomTokenValue === "string" ? consumeToken(roomTokenValue) : null;
    if (!roomToken || roomToken.userId !== token.userId) {
      socket.emit("realtime:error", { message: "Invalid room token" });
      return;
    }
    const rooms = roomsForToken(roomToken);
    rooms.forEach((room) => socket.join(room));
    socket.emit("room:joined", {
      workspaceId: roomToken.workspaceId,
      projectId: roomToken.projectId,
      issueId: roomToken.issueId,
    });
  });

  socket.on("room:leave", (payload) => {
    const workspaceId = typeof payload?.workspaceId === "string" ? payload.workspaceId : undefined;
    const projectId = typeof payload?.projectId === "string" ? payload.projectId : undefined;
    const issueId = typeof payload?.issueId === "string" ? payload.issueId : undefined;
    if (workspaceId) socket.leave(workspaceRoom(workspaceId));
    if (projectId) socket.leave(projectRoom(projectId));
    if (issueId) socket.leave(issueRoom(issueId));
  });

  socket.on("disconnect", () => {
    io.emit("user:disconnected", { userId: token.userId });
  });

  socket.emit("subscribed", { userId: token.userId });
});

realtimeState.broadcast = (event) => {
  io.to(projectRoom(event.projectId)).emit("issue:event", event);
  io.to(projectRoom(event.projectId)).emit(event.type, event);
  io.to(issueRoom(event.issueId)).emit("issue:event", event);
  io.to(issueRoom(event.issueId)).emit(event.type, event);
};

const tokenCleanup = setInterval(() => {
  cleanupExpiredTokens();
}, 30000);

io.engine.on("close", () => {
  clearInterval(tokenCleanup);
});

server.listen(port, () => {
  console.log(`> Ready on http://${hostname}:${port}`);
  console.log("> Socket.IO endpoint ready on /api/realtime/socket");
});
