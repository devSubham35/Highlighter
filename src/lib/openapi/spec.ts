import { openApiSchemas } from "./schemas";

const errorRef = { $ref: "#/components/schemas/ErrorResponse" };

function jsonResponse(description: string, schema: object, example?: unknown) {
  return {
    description,
    content: {
      "application/json": {
        schema,
        ...(example !== undefined ? { example } : {}),
      },
    },
  };
}

export const OPENAPI_VERSION = "1.1.0";

export function getOpenApiSpec(baseUrl = "http://localhost:3000") {
  return {
    openapi: "3.0.3",
    info: {
      title: "Highlighter API",
      version: OPENAPI_VERSION,
      description:
        "REST API for Highlighter — visual bug reporting SaaS. Authenticated dashboard routes use session cookies from Better Auth. Widget routes accept public project API keys and support CORS.",
      contact: { name: "Highlighter" },
    },
    servers: [{ url: baseUrl, description: "Local development" }],
    tags: [
      { name: "Auth", description: "Better Auth session endpoints (cookie-based)" },
      { name: "Users", description: "Current user profile and account settings" },
      { name: "Workspaces", description: "Workspace management" },
      { name: "Members", description: "Workspace team members" },
      { name: "Projects", description: "Project and widget configuration" },
      { name: "Reports", description: "Issue reports from widget and dashboard" },
      { name: "Invitations", description: "Workspace member invitations" },
      { name: "Upload", description: "Screenshot presigned upload (widget)" },
      { name: "Documentation", description: "OpenAPI spec and Swagger UI" },
    ],
    paths: {
      "/api/auth/sign-up/email": {
        post: {
          tags: ["Auth"],
          summary: "Register with email and password",
          operationId: "signUpEmail",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SignUpRequest" },
                example: {
                  name: "Jane Doe",
                  email: "jane@example.com",
                  password: "password123",
                },
              },
            },
          },
          responses: {
            "200": jsonResponse("User created and session established", {
              type: "object",
              properties: {
                token: { type: "string" },
                user: { $ref: "#/components/schemas/User" },
              },
            }),
            "400": jsonResponse("Validation error", errorRef),
            "422": jsonResponse("Email already exists or invalid credentials", errorRef),
          },
        },
      },
      "/api/auth/sign-in/email": {
        post: {
          tags: ["Auth"],
          summary: "Sign in with email and password",
          operationId: "signInEmail",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SignInRequest" },
                example: { email: "jane@example.com", password: "password123" },
              },
            },
          },
          responses: {
            "200": jsonResponse("Session established", {
              type: "object",
              properties: {
                token: { type: "string" },
                user: { $ref: "#/components/schemas/User" },
              },
            }),
            "401": jsonResponse("Invalid credentials", errorRef, { error: "Invalid email or password" }),
            "400": jsonResponse("Validation error", errorRef),
          },
        },
      },
      "/api/auth/sign-out": {
        post: {
          tags: ["Auth"],
          summary: "Sign out and clear session",
          operationId: "signOut",
          security: [{ sessionCookie: [] }],
          responses: {
            "200": jsonResponse("Signed out", { type: "object" }),
          },
        },
      },
      "/api/auth/get-session": {
        get: {
          tags: ["Auth"],
          summary: "Get current session",
          operationId: "getSession",
          security: [{ sessionCookie: [] }],
          responses: {
            "200": jsonResponse("Active session", { $ref: "#/components/schemas/SessionResponse" }),
            "401": jsonResponse("Not authenticated", { type: "null" }),
          },
        },
      },
      "/api/auth/update-user": {
        post: {
          tags: ["Auth"],
          summary: "Update current user (Better Auth)",
          operationId: "updateUserAuth",
          security: [{ sessionCookie: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdateUserProfileRequest" },
                example: { name: "Jane Doe" },
              },
            },
          },
          responses: {
            "200": jsonResponse("User updated", { type: "object", properties: { status: { type: "boolean" } } }),
            "400": jsonResponse("Validation error", errorRef),
            "401": jsonResponse("Unauthorized", errorRef, { error: "Unauthorized" }),
          },
        },
      },
      "/api/auth/change-password": {
        post: {
          tags: ["Auth"],
          summary: "Change password (Better Auth)",
          operationId: "changePasswordAuth",
          security: [{ sessionCookie: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ChangePasswordRequest" },
                example: {
                  currentPassword: "oldpassword123",
                  newPassword: "newpassword456",
                  revokeOtherSessions: true,
                },
              },
            },
          },
          responses: {
            "200": jsonResponse("Password changed", { type: "object" }),
            "400": jsonResponse("Invalid current password", errorRef),
            "401": jsonResponse("Unauthorized", errorRef, { error: "Unauthorized" }),
          },
        },
      },
      "/api/users/me": {
        get: {
          tags: ["Users"],
          summary: "Get current user profile",
          operationId: "getCurrentUser",
          security: [{ sessionCookie: [] }],
          responses: {
            "200": jsonResponse("User profile", { $ref: "#/components/schemas/UserProfile" }),
            "401": jsonResponse("Unauthorized", errorRef, { error: "Unauthorized" }),
          },
        },
        patch: {
          tags: ["Users"],
          summary: "Update current user profile",
          operationId: "updateCurrentUser",
          security: [{ sessionCookie: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdateUserProfileRequest" },
                example: { name: "Jane Doe" },
              },
            },
          },
          responses: {
            "200": jsonResponse("Updated profile", { $ref: "#/components/schemas/User" }),
            "400": jsonResponse("Validation error", errorRef),
            "401": jsonResponse("Unauthorized", errorRef, { error: "Unauthorized" }),
          },
        },
      },
      "/api/users/me/change-password": {
        post: {
          tags: ["Users"],
          summary: "Change current user password",
          operationId: "changeCurrentUserPassword",
          security: [{ sessionCookie: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ChangePasswordRequest" },
              },
            },
          },
          responses: {
            "200": jsonResponse("Password changed", { $ref: "#/components/schemas/OkResponse" }),
            "400": jsonResponse("Invalid current password", errorRef),
            "401": jsonResponse("Unauthorized", errorRef, { error: "Unauthorized" }),
          },
        },
      },
      "/api/workspaces": {
        get: {
          tags: ["Workspaces"],
          summary: "List workspaces for current user",
          operationId: "listWorkspaces",
          security: [{ sessionCookie: [] }],
          responses: {
            "200": jsonResponse("Workspace list", {
              type: "array",
              items: { $ref: "#/components/schemas/WorkspaceSummary" },
            }),
            "401": jsonResponse("Unauthorized", errorRef, { error: "Unauthorized" }),
          },
        },
        post: {
          tags: ["Workspaces"],
          summary: "Create a workspace",
          operationId: "createWorkspace",
          security: [{ sessionCookie: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateWorkspaceRequest" },
                example: { name: "Acme Design", inviteEmail: "" },
              },
            },
          },
          responses: {
            "201": jsonResponse("Workspace created", { $ref: "#/components/schemas/Workspace" }),
            "400": jsonResponse("Validation error", errorRef),
            "401": jsonResponse("Unauthorized", errorRef, { error: "Unauthorized" }),
            "409": jsonResponse("Duplicate workspace name", errorRef, {
              error: "A workspace with this name already exists.",
            }),
          },
        },
      },
      "/api/workspaces/{workspaceId}": {
        get: {
          tags: ["Workspaces"],
          summary: "Get workspace details",
          operationId: "getWorkspace",
          security: [{ sessionCookie: [] }],
          parameters: [
            {
              name: "workspaceId",
              in: "path",
              required: true,
              schema: { type: "string", example: "clxws123abc456" },
            },
          ],
          responses: {
            "200": jsonResponse("Workspace detail", { $ref: "#/components/schemas/WorkspaceDetail" }),
            "401": jsonResponse("Unauthorized", errorRef, { error: "Unauthorized" }),
            "404": jsonResponse("Workspace not found", errorRef, { error: "Not found" }),
          },
        },
        patch: {
          tags: ["Workspaces"],
          summary: "Update workspace name",
          operationId: "updateWorkspace",
          security: [{ sessionCookie: [] }],
          parameters: [
            {
              name: "workspaceId",
              in: "path",
              required: true,
              schema: { type: "string", example: "clxws123abc456" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdateWorkspaceRequest" },
                example: { name: "Acme Design Team" },
              },
            },
          },
          responses: {
            "200": jsonResponse("Updated workspace", { $ref: "#/components/schemas/WorkspaceSummary" }),
            "400": jsonResponse("Validation error", errorRef),
            "401": jsonResponse("Unauthorized", errorRef, { error: "Unauthorized" }),
            "403": jsonResponse("Insufficient role", errorRef, { error: "Forbidden" }),
            "404": jsonResponse("Workspace not found", errorRef, { error: "Not found" }),
            "409": jsonResponse("Duplicate workspace name", errorRef),
          },
        },
        delete: {
          tags: ["Workspaces"],
          summary: "Delete a workspace",
          operationId: "deleteWorkspace",
          security: [{ sessionCookie: [] }],
          parameters: [
            {
              name: "workspaceId",
              in: "path",
              required: true,
              schema: { type: "string", example: "clxws123abc456" },
            },
          ],
          responses: {
            "200": jsonResponse("Workspace deleted", { $ref: "#/components/schemas/OkResponse" }),
            "401": jsonResponse("Unauthorized", errorRef, { error: "Unauthorized" }),
            "403": jsonResponse("Owner role required", errorRef, { error: "Forbidden" }),
            "404": jsonResponse("Workspace not found", errorRef, { error: "Not found" }),
          },
        },
      },
      "/api/workspaces/{workspaceId}/members": {
        get: {
          tags: ["Members"],
          summary: "List workspace members",
          operationId: "listWorkspaceMembers",
          security: [{ sessionCookie: [] }],
          parameters: [
            {
              name: "workspaceId",
              in: "path",
              required: true,
              schema: { type: "string", example: "clxws123abc456" },
            },
          ],
          responses: {
            "200": jsonResponse("Member list", {
              type: "array",
              items: { $ref: "#/components/schemas/Member" },
            }),
            "401": jsonResponse("Unauthorized", errorRef, { error: "Unauthorized" }),
            "404": jsonResponse("Workspace not found", errorRef, { error: "Not found" }),
          },
        },
      },
      "/api/workspaces/{workspaceId}/members/{userId}": {
        patch: {
          tags: ["Members"],
          summary: "Update member role",
          operationId: "updateMemberRole",
          security: [{ sessionCookie: [] }],
          parameters: [
            {
              name: "workspaceId",
              in: "path",
              required: true,
              schema: { type: "string", example: "clxws123abc456" },
            },
            {
              name: "userId",
              in: "path",
              required: true,
              schema: { type: "string", example: "clx1abc123def456" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdateMemberRoleRequest" },
                example: { role: "ADMIN" },
              },
            },
          },
          responses: {
            "200": jsonResponse("Updated member", { $ref: "#/components/schemas/Member" }),
            "400": jsonResponse("Validation error", errorRef),
            "401": jsonResponse("Unauthorized", errorRef, { error: "Unauthorized" }),
            "403": jsonResponse("Owner role required", errorRef, { error: "Forbidden" }),
            "404": jsonResponse("Member not found", errorRef, { error: "Member not found" }),
          },
        },
        delete: {
          tags: ["Members"],
          summary: "Remove member or leave workspace",
          operationId: "removeMember",
          security: [{ sessionCookie: [] }],
          parameters: [
            {
              name: "workspaceId",
              in: "path",
              required: true,
              schema: { type: "string", example: "clxws123abc456" },
            },
            {
              name: "userId",
              in: "path",
              required: true,
              schema: { type: "string", example: "clx1abc123def456" },
            },
          ],
          responses: {
            "200": jsonResponse("Member removed", { $ref: "#/components/schemas/OkResponse" }),
            "401": jsonResponse("Unauthorized", errorRef, { error: "Unauthorized" }),
            "403": jsonResponse("Insufficient role", errorRef, { error: "Forbidden" }),
            "404": jsonResponse("Member not found", errorRef, { error: "Member not found" }),
          },
        },
      },
      "/api/workspaces/{workspaceId}/invitations": {
        get: {
          tags: ["Invitations"],
          summary: "List workspace invitations",
          operationId: "listWorkspaceInvitations",
          security: [{ sessionCookie: [] }],
          parameters: [
            {
              name: "workspaceId",
              in: "path",
              required: true,
              schema: { type: "string", example: "clxws123abc456" },
            },
          ],
          responses: {
            "200": jsonResponse("Invitation list", {
              type: "array",
              items: { $ref: "#/components/schemas/Invitation" },
            }),
            "401": jsonResponse("Unauthorized", errorRef, { error: "Unauthorized" }),
            "403": jsonResponse("Admin role required", errorRef, { error: "Forbidden" }),
          },
        },
      },
      "/api/projects": {
        get: {
          tags: ["Projects"],
          summary: "List projects in a workspace",
          operationId: "listProjects",
          security: [{ sessionCookie: [] }],
          parameters: [
            {
              name: "workspaceId",
              in: "query",
              required: true,
              schema: { type: "string", example: "clxws123abc456" },
              description: "Workspace ID to list projects for",
            },
            {
              name: "enriched",
              in: "query",
              required: false,
              schema: { type: "boolean", default: true },
              description: "Include openCount, imageCount, and lastIssueAt stats",
            },
          ],
          responses: {
            "200": jsonResponse("Project list with stats", {
              type: "array",
              items: { $ref: "#/components/schemas/ProjectListItem" },
            }),
            "400": jsonResponse("Missing workspaceId", errorRef, { error: "workspaceId required" }),
            "401": jsonResponse("Unauthorized", errorRef, { error: "Unauthorized" }),
            "403": jsonResponse("Not a workspace member", errorRef, { error: "Forbidden" }),
          },
        },
        post: {
          tags: ["Projects"],
          summary: "Create a project",
          operationId: "createProject",
          security: [{ sessionCookie: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateProjectRequest" },
                example: {
                  workspaceId: "clxws123abc456",
                  name: "Marketing Site",
                  websiteUrl: "https://example.com",
                  widgetPosition: "bottom-right",
                },
              },
            },
          },
          responses: {
            "201": jsonResponse("Project created", { $ref: "#/components/schemas/Project" }),
            "400": jsonResponse("Validation error", errorRef),
            "401": jsonResponse("Unauthorized", errorRef, { error: "Unauthorized" }),
            "403": jsonResponse("Insufficient role (MEMBER cannot create)", errorRef, { error: "Forbidden" }),
          },
        },
      },
      "/api/projects/{projectId}": {
        get: {
          tags: ["Projects"],
          summary: "Get project by ID",
          operationId: "getProject",
          security: [{ sessionCookie: [] }],
          parameters: [
            {
              name: "projectId",
              in: "path",
              required: true,
              schema: { type: "string", example: "clxproj123abc456" },
            },
          ],
          responses: {
            "200": jsonResponse("Project details", { $ref: "#/components/schemas/Project" }),
            "401": jsonResponse("Unauthorized", errorRef, { error: "Unauthorized" }),
            "404": jsonResponse("Project not found", errorRef, { error: "Not found" }),
          },
        },
        patch: {
          tags: ["Projects"],
          summary: "Update project settings",
          operationId: "updateProject",
          security: [{ sessionCookie: [] }],
          parameters: [
            {
              name: "projectId",
              in: "path",
              required: true,
              schema: { type: "string", example: "clxproj123abc456" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdateProjectRequest" },
                example: { name: "Marketing Site v2", archived: false },
              },
            },
          },
          responses: {
            "200": jsonResponse("Updated project", { $ref: "#/components/schemas/Project" }),
            "400": jsonResponse("Validation error", errorRef),
            "401": jsonResponse("Unauthorized", errorRef, { error: "Unauthorized" }),
            "404": jsonResponse("Project not found", errorRef, { error: "Not found" }),
          },
        },
        delete: {
          tags: ["Projects"],
          summary: "Delete a project",
          operationId: "deleteProject",
          security: [{ sessionCookie: [] }],
          parameters: [
            {
              name: "projectId",
              in: "path",
              required: true,
              schema: { type: "string", example: "clxproj123abc456" },
            },
          ],
          responses: {
            "200": jsonResponse("Project deleted", { $ref: "#/components/schemas/OkResponse" }),
            "401": jsonResponse("Unauthorized", errorRef, { error: "Unauthorized" }),
            "404": jsonResponse("Project not found", errorRef, { error: "Not found" }),
          },
        },
      },
      "/api/reports": {
        get: {
          tags: ["Reports"],
          summary: "List reports (dashboard)",
          operationId: "listReports",
          security: [{ sessionCookie: [] }],
          parameters: [
            {
              name: "projectId",
              in: "query",
              required: false,
              schema: { type: "string", example: "clxproj123abc456" },
              description: "Filter by project",
            },
            {
              name: "status",
              in: "query",
              required: false,
              schema: { $ref: "#/components/schemas/ReportStatus" },
              description: "Filter by status",
            },
            {
              name: "severity",
              in: "query",
              required: false,
              schema: { $ref: "#/components/schemas/Severity" },
              description: "Filter by severity",
            },
            {
              name: "search",
              in: "query",
              required: false,
              schema: { type: "string", example: "checkout" },
              description: "Case-insensitive title search",
            },
          ],
          responses: {
            "200": jsonResponse("Reports (max 50, newest first)", {
              type: "array",
              items: { $ref: "#/components/schemas/Report" },
            }),
            "401": jsonResponse("Unauthorized", errorRef, { error: "Unauthorized" }),
          },
        },
        post: {
          tags: ["Reports"],
          summary: "Submit a report (widget)",
          description:
            "Public endpoint used by the embedded widget. Rate limited to 10 requests per minute per IP. Supports CORS.",
          operationId: "createReport",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateReportRequest" },
                example: {
                  projectApiKey: "project_live_abc123xyz789",
                  title: "Checkout button overlaps on mobile",
                  description: "The primary CTA is hidden behind the footer on iPhone 14.",
                  severity: "HIGH",
                  pageUrl: "https://example.com/checkout",
                  screenshotUrl: "https://pub-example.r2.dev/screenshots/project_live_abc/checkout.png",
                  browser: "Chrome",
                  viewportWidth: 390,
                  viewportHeight: 844,
                },
              },
            },
          },
          responses: {
            "201": jsonResponse("Report submitted", { $ref: "#/components/schemas/CreateReportResponse" }),
            "400": jsonResponse("Validation error", errorRef),
            "404": jsonResponse("Invalid project API key", errorRef, { error: "Invalid project key" }),
            "429": jsonResponse("Rate limit exceeded", errorRef, { error: "Rate limit exceeded" }),
          },
        },
        options: {
          tags: ["Reports"],
          summary: "CORS preflight for widget",
          operationId: "reportsOptions",
          responses: { "204": { description: "CORS preflight OK" } },
        },
      },
      "/api/reports/{reportId}": {
        get: {
          tags: ["Reports"],
          summary: "Get report detail",
          operationId: "getReport",
          security: [{ sessionCookie: [] }],
          parameters: [
            {
              name: "reportId",
              in: "path",
              required: true,
              schema: { type: "string", example: "clxreport123abc456" },
            },
          ],
          responses: {
            "200": jsonResponse("Report detail", { $ref: "#/components/schemas/Report" }),
            "401": jsonResponse("Unauthorized", errorRef, { error: "Unauthorized" }),
            "404": jsonResponse("Report not found", errorRef, { error: "Not found" }),
          },
        },
        patch: {
          tags: ["Reports"],
          summary: "Update report status, description, or metadata",
          operationId: "updateReport",
          security: [{ sessionCookie: [] }],
          parameters: [
            {
              name: "reportId",
              in: "path",
              required: true,
              schema: { type: "string", example: "clxreport123abc456" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  oneOf: [
                    { $ref: "#/components/schemas/UpdateReportRequest" },
                    { $ref: "#/components/schemas/UpdateReportStatusRequest" },
                  ],
                },
                examples: {
                  fullUpdate: {
                    summary: "Update status and metadata",
                    value: {
                      status: "IN_PROGRESS",
                      description: "Assigned to frontend team",
                      metadata: {
                        type: "BUG",
                        priority: "HIGH",
                        assigneeIds: ["clxuser123"],
                      },
                    },
                  },
                  statusOnly: {
                    summary: "Legacy status-only update",
                    value: { status: "RESOLVED" },
                  },
                },
              },
            },
          },
          responses: {
            "200": jsonResponse("Updated report", { $ref: "#/components/schemas/Report" }),
            "400": jsonResponse("Validation error", errorRef),
            "401": jsonResponse("Unauthorized", errorRef, { error: "Unauthorized" }),
            "404": jsonResponse("Report not found", errorRef, { error: "Not found" }),
          },
        },
        delete: {
          tags: ["Reports"],
          summary: "Delete a report",
          operationId: "deleteReport",
          security: [{ sessionCookie: [] }],
          parameters: [
            {
              name: "reportId",
              in: "path",
              required: true,
              schema: { type: "string", example: "clxreport123abc456" },
            },
          ],
          responses: {
            "200": jsonResponse("Report deleted", { $ref: "#/components/schemas/OkResponse" }),
            "401": jsonResponse("Unauthorized", errorRef, { error: "Unauthorized" }),
            "404": jsonResponse("Report not found", errorRef, { error: "Not found" }),
          },
        },
      },
      "/api/invitations": {
        get: {
          tags: ["Invitations"],
          summary: "List invitations for a workspace",
          operationId: "listInvitations",
          security: [{ sessionCookie: [] }],
          parameters: [
            {
              name: "workspaceId",
              in: "query",
              required: true,
              schema: { type: "string", example: "clxws123abc456" },
            },
          ],
          responses: {
            "200": jsonResponse("Invitation list", {
              type: "array",
              items: { $ref: "#/components/schemas/Invitation" },
            }),
            "400": jsonResponse("Missing workspaceId", errorRef, { error: "workspaceId required" }),
            "401": jsonResponse("Unauthorized", errorRef, { error: "Unauthorized" }),
            "403": jsonResponse("Admin role required", errorRef, { error: "Forbidden" }),
          },
        },
        post: {
          tags: ["Invitations"],
          summary: "Invite a member to a workspace",
          operationId: "inviteMember",
          security: [{ sessionCookie: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/InviteMemberRequest" },
                example: {
                  email: "teammate@example.com",
                  role: "MEMBER",
                  workspaceId: "clxws123abc456",
                },
              },
            },
          },
          responses: {
            "201": jsonResponse("Invitation created", { $ref: "#/components/schemas/Invitation" }),
            "400": jsonResponse("Validation error", errorRef),
            "401": jsonResponse("Unauthorized", errorRef, { error: "Unauthorized" }),
            "403": jsonResponse("Insufficient role", errorRef, { error: "Forbidden" }),
            "409": jsonResponse("Member or pending invite exists", errorRef),
          },
        },
      },
      "/api/invitations/accept": {
        post: {
          tags: ["Invitations"],
          summary: "Accept a workspace invitation",
          operationId: "acceptInvitation",
          security: [{ sessionCookie: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AcceptInvitationRequest" },
                example: { token: "clxtoken123abc456" },
              },
            },
          },
          responses: {
            "200": jsonResponse("Invitation accepted", { $ref: "#/components/schemas/AcceptInvitationResponse" }),
            "400": jsonResponse("Invalid or expired invitation", errorRef),
            "401": jsonResponse("Unauthorized", errorRef, { error: "Unauthorized" }),
            "403": jsonResponse("Email mismatch", errorRef),
            "404": jsonResponse("Invitation not found", errorRef),
            "409": jsonResponse("Already a member", errorRef),
          },
        },
      },
      "/api/invitations/token/{token}": {
        get: {
          tags: ["Invitations"],
          summary: "Preview invitation by token",
          operationId: "getInvitationByToken",
          parameters: [
            {
              name: "token",
              in: "path",
              required: true,
              schema: { type: "string", example: "clxtoken123abc456" },
            },
          ],
          responses: {
            "200": jsonResponse("Invitation preview", { $ref: "#/components/schemas/InvitationPreview" }),
            "404": jsonResponse("Invitation not found", errorRef),
          },
        },
      },
      "/api/invitations/{invitationId}": {
        delete: {
          tags: ["Invitations"],
          summary: "Revoke a workspace invitation",
          operationId: "revokeInvitation",
          security: [{ sessionCookie: [] }],
          parameters: [
            {
              name: "invitationId",
              in: "path",
              required: true,
              schema: { type: "string", example: "clxinvite123abc456" },
            },
          ],
          responses: {
            "200": jsonResponse("Invitation revoked", { $ref: "#/components/schemas/OkResponse" }),
            "401": jsonResponse("Unauthorized", errorRef, { error: "Unauthorized" }),
            "403": jsonResponse("Admin role required", errorRef, { error: "Forbidden" }),
            "404": jsonResponse("Invitation not found", errorRef),
          },
        },
      },
      "/api/upload": {
        post: {
          tags: ["Upload"],
          summary: "Get presigned upload URL for a screenshot",
          description: "Public widget endpoint. Returns a presigned PUT URL for R2 storage. Supports CORS.",
          operationId: "createUploadUrl",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UploadRequest" },
                example: {
                  contentType: "image/png",
                  projectKey: "project_live_abc123xyz789",
                },
              },
            },
          },
          responses: {
            "200": jsonResponse("Presigned upload URL", { $ref: "#/components/schemas/UploadResponse" }),
            "400": jsonResponse("Invalid content type", errorRef, { error: "Invalid content type" }),
          },
        },
        options: {
          tags: ["Upload"],
          summary: "CORS preflight for upload",
          operationId: "uploadOptions",
          responses: { "204": { description: "CORS preflight OK" } },
        },
      },
      "/api/docs": {
        get: {
          tags: ["Documentation"],
          summary: "Swagger UI HTML",
          operationId: "getDocs",
          responses: {
            "200": {
              description: "Swagger UI HTML page",
              content: { "text/html": { schema: { type: "string" } } },
            },
          },
        },
      },
      "/api/openapi": {
        get: {
          tags: ["Documentation"],
          summary: "OpenAPI 3.0 JSON spec",
          operationId: "getOpenApi",
          responses: {
            "200": jsonResponse("OpenAPI specification", { type: "object" }),
          },
        },
      },
    },
    components: {
      securitySchemes: {
        sessionCookie: {
          type: "apiKey",
          in: "cookie",
          name: "better-auth.session_token",
          description:
            "Session cookie set after sign-in via Better Auth. Sign in through the app or POST /api/auth/sign-in/email, then use authenticated routes from the same browser.",
        },
      },
      schemas: openApiSchemas,
    },
  };
}

export type OpenApiSpec = ReturnType<typeof getOpenApiSpec>;
