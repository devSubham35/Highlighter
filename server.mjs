import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME ?? "localhost";
const port = Number(process.env.PORT ?? 3000);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const realtimeState = (globalThis.__highlighterRealtime ??= { tokens: new Map() });

function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [token, entry] of realtimeState.tokens.entries()) {
    if (entry.expiresAt <= now) realtimeState.tokens.delete(token);
  }
}

function consumeToken(token) {
  cleanupExpiredTokens();
  const entry = realtimeState.tokens.get(token);
  if (!entry) return null;
  realtimeState.tokens.delete(token);
  return entry;
}

function projectRoom(projectId) {
  return `project:${projectId}`;
}

function issueRoom(projectId, issueId) {
  return `project:${projectId}:issue:${issueId}`;
}

await app.prepare();

const server = createServer((req, res) => {
  const parsedUrl = parse(req.url, true);
  void handle(req, res, parsedUrl);
});

const io = new SocketIOServer(server, {
  path: "/api/realtime",
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
    projectId: token.projectId,
    issueId: token.issueId,
    userId: token.userId,
  };

  if (token.issueId) {
    socket.join(issueRoom(token.projectId, token.issueId));
  } else {
    socket.join(projectRoom(token.projectId));
  }

  socket.emit("subscribed", { projectId: token.projectId, issueId: token.issueId });
});

realtimeState.broadcast = (event) => {
  io.to(projectRoom(event.projectId)).emit("issue:event", event);
  io.to(issueRoom(event.projectId, event.issueId)).emit("issue:event", event);
};

const tokenCleanup = setInterval(() => {
  cleanupExpiredTokens();
}, 30000);

io.engine.on("close", () => {
  clearInterval(tokenCleanup);
});

server.listen(port, () => {
  console.log(`> Ready on http://${hostname}:${port}`);
  console.log("> Socket.IO endpoint ready on /api/realtime");
});
