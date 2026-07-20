import { getOpenApiSpec } from "../src/lib/openapi";

const EXPECTED_PATHS = [
  "/api/auth/sign-up/email",
  "/api/auth/sign-in/email",
  "/api/auth/sign-out",
  "/api/users/me",
  "/api/users/me/change-password",
  "/api/workspaces",
  "/api/workspaces/{workspaceId}",
  "/api/workspaces/{workspaceId}/members",
  "/api/workspaces/{workspaceId}/members/{userId}",
  "/api/workspaces/{workspaceId}/invitations",
  "/api/projects",
  "/api/projects/{projectId}",
  "/api/reports",
  "/api/reports/{reportId}",
  "/api/invitations",
  "/api/invitations/accept",
  "/api/invitations/token/{token}",
  "/api/invitations/{invitationId}",
  "/api/upload",
  "/api/docs",
  "/api/openapi",
];

const spec = getOpenApiSpec("http://localhost:3000");
const paths = Object.keys(spec.paths);
const missing = EXPECTED_PATHS.filter((p) => !paths.includes(p));
const extra = paths.filter((p) => !EXPECTED_PATHS.includes(p) && !p.startsWith("/api/auth/"));

let failed = false;

if (missing.length) {
  console.error("Missing OpenAPI paths:", missing);
  failed = true;
}

if (extra.length) {
  console.error("Unexpected OpenAPI paths:", extra);
  failed = true;
}

const stalePatterns = [
  /Workspacesummary/,
  /createWorkspaceRequest/,
  /\/api\/Workspaces/,
  /OrganizationSummary/,
  /CreateOrganizationRequest/,
  /UpdateOrganizationRequest/,
  /\/api\/organizations/,
  /organizationId/,
  /\bComment\b/,
  /createCommentSchema/,
  /\/api\/reports\/\{reportId\}\/comments/,
];
const specJson = JSON.stringify(spec);
const badRefs = stalePatterns.flatMap((pattern) => specJson.match(pattern) ?? []);
if (badRefs.length > 0) {
  console.error("Stale references in spec:", [...new Set(badRefs)]);
  failed = true;
}

if (failed) process.exit(1);

console.log(`OpenAPI valid: ${paths.length} paths documented`);
for (const p of EXPECTED_PATHS) console.log(`  ✓ ${p}`);
