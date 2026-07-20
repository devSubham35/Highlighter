export const openApiSchemas = {
  ErrorResponse: {
    type: "object",
    properties: {
      error: {
        oneOf: [
          { type: "string", example: "Unauthorized" },
          {
            type: "object",
            description: "Zod validation errors",
            properties: {
              formErrors: { type: "array", items: { type: "string" } },
              fieldErrors: { type: "object", additionalProperties: { type: "array", items: { type: "string" } } },
            },
          },
        ],
      },
    },
    required: ["error"],
  },
  OkResponse: {
    type: "object",
    properties: { ok: { type: "boolean", example: true } },
    required: ["ok"],
  },
  User: {
    type: "object",
    properties: {
      id: { type: "string", example: "clx1abc123def456" },
      name: { type: "string", example: "Jane Doe" },
      email: { type: "string", format: "email", example: "jane@example.com" },
      emailVerified: { type: "boolean", example: false },
      image: { type: "string", nullable: true, example: null },
      createdAt: { type: "string", format: "date-time", example: "2026-06-01T10:00:00.000Z" },
      updatedAt: { type: "string", format: "date-time", example: "2026-06-01T10:00:00.000Z" },
    },
  },
  SessionResponse: {
    type: "object",
    properties: {
      session: {
        type: "object",
        properties: {
          id: { type: "string", example: "clxsession123" },
          userId: { type: "string", example: "clx1abc123def456" },
          expiresAt: { type: "string", format: "date-time", example: "2026-06-08T10:00:00.000Z" },
        },
      },
      user: { $ref: "#/components/schemas/User" },
    },
  },
  SignUpRequest: {
    type: "object",
    required: ["name", "email", "password"],
    properties: {
      name: { type: "string", minLength: 2, maxLength: 50, example: "Jane Doe" },
      email: { type: "string", format: "email", example: "jane@example.com" },
      password: { type: "string", minLength: 8, example: "password123" },
    },
  },
  SignInRequest: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", format: "email", example: "jane@example.com" },
      password: { type: "string", minLength: 6, example: "password123" },
    },
  },
  Workspace: {
    type: "object",
    properties: {
      id: { type: "string", example: "clxws123abc456" },
      name: { type: "string", example: "Acme Design" },
      slug: { type: "string", example: "acme-design-x7k2m" },
      ownerId: { type: "string", example: "clx1abc123def456" },
      createdAt: { type: "string", format: "date-time", example: "2026-06-01T10:00:00.000Z" },
      updatedAt: { type: "string", format: "date-time", example: "2026-06-01T10:00:00.000Z" },
    },
  },
  WorkspaceSummary: {
    type: "object",
    properties: {
      id: { type: "string", example: "clxws123abc456" },
      name: { type: "string", example: "Acme Design" },
      slug: { type: "string", example: "acme-design-x7k2m" },
      ownerId: { type: "string", example: "clx1abc123def456" },
      role: { type: "string", enum: ["OWNER", "ADMIN", "MEMBER"], example: "OWNER" },
      projectCount: { type: "integer", example: 3 },
      memberCount: { type: "integer", example: 5 },
      createdAt: { type: "string", format: "date-time", example: "2026-06-01T10:00:00.000Z" },
      updatedAt: { type: "string", format: "date-time", example: "2026-06-01T10:00:00.000Z" },
    },
  },
  WorkspaceDetail: {
    allOf: [
      { $ref: "#/components/schemas/WorkspaceSummary" },
      {
        type: "object",
        properties: {
          pendingInvites: { type: "integer", example: 2 },
          members: {
            type: "array",
            items: { $ref: "#/components/schemas/Member" },
          },
          invitations: {
            type: "array",
            items: { $ref: "#/components/schemas/Invitation" },
            description: "Only included for ADMIN and OWNER roles",
          },
        },
      },
    ],
  },
  UpdateWorkspaceRequest: {
    type: "object",
    required: ["name"],
    properties: {
      name: { type: "string", minLength: 1, maxLength: 100, example: "Acme Design Team" },
    },
  },
  MemberRole: {
    type: "string",
    enum: ["OWNER", "ADMIN", "MEMBER"],
    example: "MEMBER",
  },
  Member: {
    type: "object",
    properties: {
      id: { type: "string", example: "clxmember123abc456" },
      role: { $ref: "#/components/schemas/MemberRole" },
      createdAt: { type: "string", format: "date-time", example: "2026-06-01T10:00:00.000Z" },
      user: { $ref: "#/components/schemas/User" },
    },
  },
  UpdateMemberRoleRequest: {
    type: "object",
    required: ["role"],
    properties: {
      role: { type: "string", enum: ["ADMIN", "MEMBER"], example: "ADMIN" },
    },
  },
  AcceptInvitationRequest: {
    type: "object",
    required: ["token"],
    properties: {
      token: { type: "string", example: "clxtoken123abc456" },
    },
  },
  AcceptInvitationResponse: {
    type: "object",
    properties: {
      ok: { type: "boolean", example: true },
      workspace: { $ref: "#/components/schemas/Workspace" },
      membership: { $ref: "#/components/schemas/Member" },
    },
  },
  InvitationPreview: {
    type: "object",
    properties: {
      id: { type: "string", example: "clxinvite123abc456" },
      email: { type: "string", format: "email", example: "teammate@example.com" },
      role: { $ref: "#/components/schemas/MemberRole" },
      status: { type: "string", enum: ["PENDING", "ACCEPTED", "EXPIRED"], example: "PENDING" },
      expiresAt: { type: "string", format: "date-time", example: "2026-06-08T10:00:00.000Z" },
      valid: { type: "boolean", example: true },
      workspace: {
        type: "object",
        properties: {
          id: { type: "string", example: "clxws123abc456" },
          name: { type: "string", example: "Acme Design" },
        },
      },
    },
  },
  UserProfile: {
    allOf: [
      { $ref: "#/components/schemas/User" },
      {
        type: "object",
        properties: {
          workspaceCount: { type: "integer", example: 2 },
        },
      },
    ],
  },
  UpdateUserProfileRequest: {
    type: "object",
    required: ["name"],
    properties: {
      name: { type: "string", minLength: 2, maxLength: 50, example: "Jane Doe" },
    },
  },
  ChangePasswordRequest: {
    type: "object",
    required: ["currentPassword", "newPassword"],
    properties: {
      currentPassword: { type: "string", example: "oldpassword123" },
      newPassword: { type: "string", minLength: 8, example: "newpassword456" },
      revokeOtherSessions: { type: "boolean", example: true },
    },
  },
  ProjectListItem: {
    allOf: [
      { $ref: "#/components/schemas/Project" },
      {
        type: "object",
        properties: {
          openCount: { type: "integer", example: 4 },
          imageCount: { type: "integer", example: 12 },
          lastIssueAt: { type: "string", format: "date-time", nullable: true, example: "2026-06-05T14:30:00.000Z" },
        },
      },
    ],
  },
  CreateWorkspaceRequest: {
    type: "object",
    required: ["name"],
    properties: {
      name: { type: "string", minLength: 1, maxLength: 100, example: "Acme Design" },
      inviteEmail: {
        type: "string",
        format: "email",
        example: "teammate@example.com",
        description: "Optional email to invite a member when creating the workspace",
      },
    },
  },
  Project: {
    type: "object",
    properties: {
      id: { type: "string", example: "clxproj123abc456" },
      workspaceId: { type: "string", example: "clxws123abc456" },
      name: { type: "string", example: "Marketing Site" },
      websiteUrl: { type: "string", format: "uri", nullable: true, example: "https://example.com" },
      archived: { type: "boolean", example: false },
      apiKey: { type: "string", example: "project_live_abc123xyz789" },
      widgetColor: { type: "string", pattern: "^#[0-9a-f]{6}$" },
      widgetPosition: {
        type: "string",
        enum: ["bottom-right", "bottom-left", "top-right", "top-left"],
        example: "bottom-right",
      },
      createdAt: { type: "string", format: "date-time", example: "2026-06-01T10:00:00.000Z" },
      updatedAt: { type: "string", format: "date-time", example: "2026-06-01T10:00:00.000Z" },
      _count: {
        type: "object",
        properties: { reports: { type: "integer", example: 12 } },
      },
    },
  },
  CreateProjectRequest: {
    type: "object",
    required: ["workspaceId", "name", "websiteUrl"],
    properties: {
      workspaceId: { type: "string", example: "clxws123abc456" },
      name: { type: "string", minLength: 1, maxLength: 100, example: "Marketing Site" },
      websiteUrl: { type: "string", format: "uri", example: "https://example.com" },
      widgetColor: { type: "string", pattern: "^#[0-9a-f]{6}$" },
      widgetPosition: {
        type: "string",
        enum: ["bottom-right", "bottom-left", "top-right", "top-left"],
        example: "bottom-right",
      },
    },
  },
  UpdateProjectRequest: {
    type: "object",
    properties: {
      name: { type: "string", minLength: 1, maxLength: 100, example: "Marketing Site v2" },
      websiteUrl: { type: "string", format: "uri", example: "https://example.com" },
      archived: { type: "boolean", example: false },
      widgetColor: { type: "string", pattern: "^#[0-9a-f]{6}$" },
      widgetPosition: {
        type: "string",
        enum: ["bottom-right", "bottom-left", "top-right", "top-left"],
        example: "bottom-left",
      },
    },
  },
  ReportStatus: {
    type: "string",
    enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
    example: "OPEN",
  },
  Severity: {
    type: "string",
    enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
    example: "HIGH",
  },
  IssueType: {
    type: "string",
    enum: ["BUG", "IMPROVEMENT"],
    example: "BUG",
  },
  IssuePriority: {
    type: "string",
    enum: ["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"],
    example: "MEDIUM",
  },
  ActivityEntry: {
    type: "object",
    properties: {
      id: { type: "string", example: "activity-1" },
      kind: {
        type: "string",
        enum: ["reported", "title_ai", "status", "priority"],
        example: "status",
      },
      at: { type: "string", format: "date-time", example: "2026-06-01T12:00:00.000Z" },
      actorName: { type: "string", example: "Jane Doe" },
      issueType: { $ref: "#/components/schemas/IssueType" },
      fromStatus: { $ref: "#/components/schemas/ReportStatus" },
      toStatus: { $ref: "#/components/schemas/ReportStatus" },
      fromPriority: { $ref: "#/components/schemas/IssuePriority" },
      toPriority: { $ref: "#/components/schemas/IssuePriority" },
    },
  },
  ReportMetadata: {
    type: "object",
    properties: {
      type: { $ref: "#/components/schemas/IssueType" },
      priority: { $ref: "#/components/schemas/IssuePriority" },
      assigneeIds: {
        type: "array",
        items: { type: "string" },
        example: ["clxuser123", "clxuser456"],
      },
      reporterName: { type: "string", example: "Site Visitor" },
      reporterId: { type: "string", example: "clxuser789" },
      issueNumber: { type: "integer", example: 42 },
      activityLog: {
        type: "array",
        items: { $ref: "#/components/schemas/ActivityEntry" },
      },
    },
  },
  Report: {
    type: "object",
    properties: {
      id: { type: "string", example: "clxreport123abc456" },
      projectId: { type: "string", example: "clxproj123abc456" },
      title: { type: "string", example: "Checkout button overlaps on mobile" },
      description: {
        type: "string",
        nullable: true,
        example: "The primary CTA is hidden behind the footer on iPhone 14.",
      },
      severity: { $ref: "#/components/schemas/Severity" },
      status: { $ref: "#/components/schemas/ReportStatus" },
      screenshotUrl: {
        type: "string",
        format: "uri",
        nullable: true,
        example: "https://pub-example.r2.dev/screenshots/project_live_abc/checkout.png",
      },
      pageUrl: { type: "string", format: "uri", example: "https://example.com/checkout" },
      browser: { type: "string", nullable: true, example: "Chrome" },
      browserVersion: { type: "string", nullable: true, example: "125.0.0.0" },
      os: { type: "string", nullable: true, example: "Windows" },
      device: { type: "string", nullable: true, example: "Desktop" },
      screenWidth: { type: "integer", nullable: true, example: 1920 },
      screenHeight: { type: "integer", nullable: true, example: 1080 },
      viewportWidth: { type: "integer", nullable: true, example: 390 },
      viewportHeight: { type: "integer", nullable: true, example: 844 },
      userAgent: { type: "string", nullable: true },
      referrer: { type: "string", nullable: true, example: "https://google.com" },
      metadata: { $ref: "#/components/schemas/ReportMetadata" },
      createdAt: { type: "string", format: "date-time", example: "2026-06-01T10:00:00.000Z" },
      updatedAt: { type: "string", format: "date-time", example: "2026-06-01T10:00:00.000Z" },
      project: { $ref: "#/components/schemas/Project" },
    },
  },
  CreateReportRequest: {
    type: "object",
    required: ["projectApiKey", "title", "severity", "pageUrl"],
    properties: {
      projectApiKey: {
        type: "string",
        pattern: "^project_live_",
        example: "project_live_abc123xyz789",
        description: "Public project API key from the widget settings",
      },
      title: { type: "string", minLength: 1, maxLength: 200, example: "Checkout button overlaps on mobile" },
      description: {
        type: "string",
        maxLength: 5000,
        example: "The primary CTA is hidden behind the footer on iPhone 14.",
      },
      severity: { $ref: "#/components/schemas/Severity" },
      screenshotUrl: {
        type: "string",
        format: "uri",
        example: "https://pub-example.r2.dev/screenshots/project_live_abc/checkout.png",
      },
      pageUrl: { type: "string", format: "uri", example: "https://example.com/checkout" },
      browser: { type: "string", example: "Chrome" },
      browserVersion: { type: "string", example: "125.0.0.0" },
      os: { type: "string", example: "Windows" },
      device: { type: "string", example: "Desktop" },
      screenWidth: { type: "integer", minimum: 1, example: 1920 },
      screenHeight: { type: "integer", minimum: 1, example: 1080 },
      viewportWidth: { type: "integer", minimum: 1, example: 390 },
      viewportHeight: { type: "integer", minimum: 1, example: 844 },
      userAgent: { type: "string", example: "Mozilla/5.0 ..." },
      referrer: { type: "string", format: "uri", example: "https://google.com" },
      metadata: { type: "object", additionalProperties: true },
    },
  },
  CreateReportResponse: {
    type: "object",
    properties: {
      id: { type: "string", example: "clxreport123abc456" },
      message: { type: "string", example: "Report submitted" },
    },
    required: ["id", "message"],
  },
  UpdateReportRequest: {
    type: "object",
    properties: {
      status: { $ref: "#/components/schemas/ReportStatus" },
      description: { type: "string", maxLength: 5000, nullable: true, example: "Updated description" },
      metadata: { $ref: "#/components/schemas/ReportMetadata" },
    },
  },
  UpdateReportStatusRequest: {
    type: "object",
    required: ["status"],
    properties: {
      status: { $ref: "#/components/schemas/ReportStatus" },
    },
  },
  Invitation: {
    type: "object",
    properties: {
      id: { type: "string", example: "clxinvite123abc456" },
      workspaceId: { type: "string", example: "clxws123abc456" },
      email: { type: "string", format: "email", example: "teammate@example.com" },
      role: { type: "string", enum: ["OWNER", "ADMIN", "MEMBER"], example: "MEMBER" },
      status: { type: "string", enum: ["PENDING", "ACCEPTED", "EXPIRED"], example: "PENDING" },
      token: { type: "string", example: "clxtoken123abc456" },
      invitedById: { type: "string", example: "clx1abc123def456" },
      expiresAt: { type: "string", format: "date-time", example: "2026-06-08T10:00:00.000Z" },
      createdAt: { type: "string", format: "date-time", example: "2026-06-01T10:00:00.000Z" },
    },
  },
  InviteMemberRequest: {
    type: "object",
    required: ["email", "role", "workspaceId"],
    properties: {
      email: { type: "string", format: "email", example: "teammate@example.com" },
      role: { type: "string", enum: ["ADMIN", "MEMBER"], example: "MEMBER" },
      workspaceId: { type: "string", example: "clxws123abc456" },
    },
  },
  UploadRequest: {
    type: "object",
    properties: {
      contentType: {
        type: "string",
        example: "image/png",
        description: "Must start with image/ (e.g. image/png, image/jpeg)",
      },
      projectKey: {
        type: "string",
        example: "project_live_abc123xyz789",
        description: "Project API key used to namespace uploaded screenshots",
      },
    },
  },
  UploadResponse: {
    type: "object",
    properties: {
      uploadUrl: {
        type: "string",
        format: "uri",
        example: "https://account.r2.cloudflarestorage.com/bucket/screenshots/...",
        description: "Presigned PUT URL for uploading the screenshot",
      },
      publicUrl: {
        type: "string",
        format: "uri",
        example: "https://pub-example.r2.dev/screenshots/project_live_abc/abc123.png",
      },
      key: {
        type: "string",
        example: "screenshots/project_live_abc123xyz789/abc123.png",
      },
    },
    required: ["uploadUrl", "publicUrl", "key"],
  },
} as const;
