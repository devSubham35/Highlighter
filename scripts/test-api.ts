/**
 * Integration test runner for Highlighter API routes.
 * Usage: npx tsx scripts/test-api.ts [baseUrl]
 */

import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

function loadEnvFile(filename: string) {
  const filePath = resolve(process.cwd(), filename);
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const BASE = process.argv[2] ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const TRUSTED_ORIGIN = process.env.BETTER_AUTH_URL ?? BASE;
const TEST_EMAIL = `api-test-${Date.now()}@example.com`;
const TEST_PASSWORD = "testpassword123";
const TEST_NAME = "API Test User";

type TestResult = { name: string; method: string; path: string; status: number; ok: boolean; detail?: string };

const results: TestResult[] = [];
let cookie = "";

function record(name: string, method: string, path: string, status: number, ok: boolean, detail?: string) {
  results.push({ name, method, path, status, ok, detail });
  const mark = ok ? "PASS" : "FAIL";
  console.log(`${mark} ${method} ${path} → ${status}${detail ? ` (${detail})` : ""}`);
}

async function request(
  method: string,
  path: string,
  body?: unknown,
  opts?: { auth?: boolean; cors?: boolean },
): Promise<{ status: number; json: unknown; headers: Headers }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Origin: TRUSTED_ORIGIN,
  };
  if (opts?.auth && cookie) headers.Cookie = cookie;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const setCookie =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : (res.headers.get("set-cookie")?.split(/,(?=\s*[^;]+=)/) ?? []);
  for (const part of setCookie) {
    const session = part.split(";")[0]?.trim();
    if (session) cookie = cookie ? `${cookie}; ${session}` : session;
  }

  let json: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = text.slice(0, 200);
    }
  }

  return { status: res.status, json, headers: res.headers };
}

function assertStatus(name: string, method: string, path: string, status: number, expected: number | number[]) {
  const expectedList = Array.isArray(expected) ? expected : [expected];
  const ok = expectedList.includes(status);
  record(name, method, path, status, ok, ok ? undefined : `expected ${expectedList.join("|")}`);
  return ok;
}

async function main() {
  console.log(`\nHighlighter API tests @ ${BASE}\n`);

  // --- Public / docs ---
  {
    const { status } = await request("GET", "/api/openapi");
    assertStatus("OpenAPI JSON", "GET", "/api/openapi", status, 200);
  }
  {
    const { status } = await request("GET", "/api/docs");
    assertStatus("Swagger UI HTML", "GET", "/api/docs", status, 200);
  }

  // --- Auth ---
  {
    const { status, json } = await request("POST", "/api/auth/sign-up/email", {
      name: TEST_NAME,
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    assertStatus("Sign up", "POST", "/api/auth/sign-up/email", status, [200, 201]);
    if (!cookie) record("Session cookie", "POST", "/api/auth/sign-up/email", 0, false, "no cookie set");
  }

  // --- Users ---
  {
    const { status, json } = await request("GET", "/api/users/me", undefined, { auth: true });
    assertStatus("Get current user", "GET", "/api/users/me", status, 200);
    const user = json as { workspaceCount?: number };
    if (typeof user.workspaceCount !== "number") {
      record("User workspaceCount", "GET", "/api/users/me", status, false, "missing workspaceCount");
    }
  }
  {
    const { status } = await request("PATCH", "/api/users/me", { name: "API Tester Updated" }, { auth: true });
    assertStatus("Update profile", "PATCH", "/api/users/me", status, 200);
  }

  // --- Workspaces ---
  let workspaceId = "";
  {
    const { status, json } = await request("GET", "/api/workspaces", undefined, { auth: true });
    assertStatus("List workspaces", "GET", "/api/workspaces", status, 200);
    const list = json as unknown[];
    if (!Array.isArray(list)) record("Workspaces array", "GET", "/api/workspaces", status, false);
  }
  {
    const { status, json } = await request(
      "POST",
      "/api/workspaces",
      { name: `API Test Workspace ${Date.now()}`, inviteEmail: "" },
      { auth: true },
    );
    const workspaceOk = assertStatus("Create workspace", "POST", "/api/workspaces", status, 201);
    workspaceId = (json as { id?: string }).id ?? "";
    if (!workspaceId && workspaceOk) {
      record("Workspace id", "POST", "/api/workspaces", status, false, JSON.stringify(json).slice(0, 120));
    }
  }

  if (!workspaceId) {
    console.error("\nCannot continue without workspaceId. Check DB migration (workspaces table).\n");
    summarize();
    process.exit(1);
  }

  {
    const { status } = await request("GET", `/api/workspaces/${workspaceId}`, undefined, { auth: true });
    assertStatus("Get workspace", "GET", `/api/workspaces/${workspaceId}`, status, 200);
  }
  {
    const { status } = await request(
      "PATCH",
      `/api/workspaces/${workspaceId}`,
      { name: `API Test Workspace Updated` },
      { auth: true },
    );
    assertStatus("Update workspace", "PATCH", `/api/workspaces/${workspaceId}`, status, 200);
  }
  {
    const { status } = await request("GET", `/api/workspaces/${workspaceId}/members`, undefined, { auth: true });
    assertStatus("List members", "GET", `/api/workspaces/${workspaceId}/members`, status, 200);
  }

  // --- Projects ---
  let projectId = "";
  let apiKey = "";
  {
    const { status } = await request("GET", "/api/projects", undefined, { auth: true });
    assertStatus("List projects missing workspaceId", "GET", "/api/projects", status, 400);
  }
  {
    const { status, json } = await request(
      "GET",
      `/api/projects?workspaceId=${workspaceId}`,
      undefined,
      { auth: true },
    );
    assertStatus("List projects", "GET", `/api/projects?workspaceId=`, status, 200);
    if (!Array.isArray(json)) record("Projects array", "GET", "/api/projects", status, false);
  }
  {
    const { status, json } = await request(
      "POST",
      "/api/projects",
      {
        workspaceId,
        name: "API Test Project",
        websiteUrl: "https://example.com",
      },
      { auth: true },
    );
    assertStatus("Create project", "POST", "/api/projects", status, 201);
    const project = json as { id?: string; apiKey?: string };
    projectId = project.id ?? "";
    apiKey = project.apiKey ?? "";
  }

  if (projectId) {
    const { status } = await request("GET", `/api/projects/${projectId}`, undefined, { auth: true });
    assertStatus("Get project", "GET", `/api/projects/${projectId}`, status, 200);
  }

  // --- Invitations ---
  let invitationToken = "";
  {
    const { status } = await request("GET", "/api/invitations", undefined, { auth: true });
    assertStatus("List invitations missing workspaceId", "GET", "/api/invitations", status, 400);
  }
  {
    const { status, json } = await request(
      "GET",
      `/api/invitations?workspaceId=${workspaceId}`,
      undefined,
      { auth: true },
    );
    assertStatus("List invitations", "GET", `/api/invitations?workspaceId=`, status, 200);
    if (!Array.isArray(json)) record("Invitations array", "GET", "/api/invitations", status, false);
  }
  {
    const { status, json } = await request(
      "POST",
      "/api/invitations",
      { email: `invite-${Date.now()}@example.com`, role: "MEMBER", workspaceId },
      { auth: true },
    );
    assertStatus("Create invitation", "POST", "/api/invitations", status, 201);
    invitationToken = (json as { token?: string }).token ?? "";
  }
  let invitationId = "";
  if (invitationToken) {
    const { status, json } = await request("GET", `/api/invitations/token/${invitationToken}`);
    assertStatus("Public invite preview", "GET", `/api/invitations/token/:token`, status, 200);
    const preview = json as { valid?: boolean; workspace?: { id: string }; id?: string };
    if (preview.valid !== true) record("Invite valid flag", "GET", "/api/invitations/token/:token", status, false);
    if (!preview.workspace?.id) record("Invite workspace", "GET", "/api/invitations/token/:token", status, false);
    invitationId = preview.id ?? "";
  }
  if (invitationId) {
    const { status } = await request("DELETE", `/api/invitations/${invitationId}`, undefined, { auth: true });
    assertStatus("Revoke invitation", "DELETE", `/api/invitations/:id`, status, 200);
  }

  // --- Widget: upload + report ---
  {
    const { status } = await request("POST", "/api/users/me/change-password", {
      currentPassword: TEST_PASSWORD,
      newPassword: TEST_PASSWORD,
      revokeOtherSessions: false,
    }, { auth: true });
    assertStatus("Change password", "POST", "/api/users/me/change-password", status, 200);
  }

  if (apiKey) {
    const { status } = await request("OPTIONS", "/api/upload");
    assertStatus("Upload CORS preflight", "OPTIONS", "/api/upload", status, 204);
    const { status: reportsOptions } = await request("OPTIONS", "/api/reports");
    assertStatus("Reports CORS preflight", "OPTIONS", "/api/reports", reportsOptions, 204);
    const { status: uploadStatus } = await request("POST", "/api/upload", {
      contentType: "image/png",
      projectKey: apiKey,
    });
    // May be 500 if R2 not configured
    assertStatus("Presigned upload URL", "POST", "/api/upload", uploadStatus, [200, 500]);

    const { status: reportStatus, json } = await request("POST", "/api/reports", {
      projectApiKey: apiKey,
      title: "API test report",
      severity: "MEDIUM",
      pageUrl: "https://example.com/page",
      description: "Created by test-api script",
    });
    assertStatus("Widget create report", "POST", "/api/reports", reportStatus, 201);
    const reportId = (json as { id?: string }).id ?? "";

    if (reportId) {
      const { status: getStatus } = await request("GET", `/api/reports/${reportId}`, undefined, { auth: true });
      assertStatus("Get report", "GET", `/api/reports/${reportId}`, getStatus, 200);

      const { status: patchStatus } = await request(
        "PATCH",
        `/api/reports/${reportId}`,
        { status: "IN_PROGRESS" },
        { auth: true },
      );
      assertStatus("Update report status", "PATCH", `/api/reports/${reportId}`, patchStatus, 200);

      const { status: listStatus } = await request(
        "GET",
        `/api/reports?projectId=${projectId}`,
        undefined,
        { auth: true },
      );
      assertStatus("List reports", "GET", "/api/reports?projectId=", listStatus, 200);

      const { status: delStatus } = await request("DELETE", `/api/reports/${reportId}`, undefined, { auth: true });
      assertStatus("Delete report", "DELETE", `/api/reports/${reportId}`, delStatus, 200);
    }
  }

  // --- Unauthorized checks ---
  {
    const saved = cookie;
    cookie = "";
    const { status } = await request("GET", "/api/workspaces");
    assertStatus("Unauthorized workspaces", "GET", "/api/workspaces", status, 401);
    cookie = saved;
  }

  // --- Cleanup ---
  if (projectId) {
    const { status } = await request("DELETE", `/api/projects/${projectId}`, undefined, { auth: true });
    assertStatus("Delete project", "DELETE", `/api/projects/${projectId}`, status, 200);
  }
  {
    const { status } = await request("DELETE", `/api/workspaces/${workspaceId}`, undefined, { auth: true });
    assertStatus("Delete workspace", "DELETE", `/api/workspaces/${workspaceId}`, status, 200);
  }

  summarize();
  const failed = results.filter((r) => !r.ok).length;
  process.exit(failed > 0 ? 1 : 0);
}

function summarize() {
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n--- ${passed} passed, ${failed} failed (${results.length} total) ---\n`);
  if (failed > 0) {
    console.log("Failures:");
    for (const r of results.filter((x) => !x.ok)) {
      console.log(`  - ${r.name}: ${r.method} ${r.path} → ${r.status}${r.detail ? ` (${r.detail})` : ""}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
