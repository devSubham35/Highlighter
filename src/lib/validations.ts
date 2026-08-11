import { z } from "zod";

export const loginFormSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Please enter a valid email"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

export const registerFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name is too long"),
  email: z.string().trim().min(1, "Email is required").email("Please enter a valid email"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
});

export const createWorkspaceFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Workspace name is required")
    .max(100, "Workspace name is too long"),
  inviteEmail: z
    .string()
    .trim()
    .refine(
      (value) => value.length === 0 || z.string().email().safeParse(value).success,
      "Enter a valid email address",
    ),
});

export const createProjectFormSchema = z.object({
  websiteUrl: z
    .string()
    .trim()
    .min(1, "Website URL is required")
    .url("Enter a valid website URL"),
  name: z
    .string()
    .trim()
    .min(1, "Display name is required")
    .max(100, "Display name is too long"),
});

export type LoginFormData = z.infer<typeof loginFormSchema>;
export type RegisterFormData = z.infer<typeof registerFormSchema>;
export type CreateWorkspaceFormData = z.infer<typeof createWorkspaceFormSchema>;
export type CreateProjectFormData = z.infer<typeof createProjectFormSchema>;

const userIdSchema = z.string().trim().min(1).max(191);

export const memberRoleSchema = z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]);

export const createWorkspaceSchema = z.object({
  name: createWorkspaceFormSchema.shape.name,
  inviteEmail: createWorkspaceFormSchema.shape.inviteEmail.optional(),
});

export const createProjectSchema = createProjectFormSchema.extend({
  workspaceId: z.string().cuid(),
  widgetColor: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
  widgetPosition: z
    .enum(["bottom-right", "bottom-left", "top-right", "top-left"])
    .optional(),
});

export const updateProjectSchema = createProjectFormSchema
  .extend({
    archived: z.boolean().optional(),
    widgetColor: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
    widgetPosition: z
      .enum(["bottom-right", "bottom-left", "top-right", "top-left"])
      .optional(),
  })
  .partial();

export const createReportSchema = z.object({
  projectApiKey: z.string().startsWith("project_live_"),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  screenshotUrl: z.string().url().optional(),
  pageUrl: z.string().url(),
  browser: z.string().optional(),
  browserVersion: z.string().optional(),
  os: z.string().optional(),
  device: z.string().optional(),
  screenWidth: z.number().int().positive().optional(),
  screenHeight: z.number().int().positive().optional(),
  viewportWidth: z.number().int().positive().optional(),
  viewportHeight: z.number().int().positive().optional(),
  userAgent: z.string().optional(),
  referrer: z.string().optional(),
  metadata: z.record(z.string(), z.json()).optional(),
});

export const updateReportStatusSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
});

export const updateReportSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  description: z.string().max(5000).nullable().optional(),
  metadata: z
    .object({
      type: z.enum(["BUG", "TASK", "FEATURE", "IMPROVEMENT", "STORY"]).optional(),
      priority: z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
      assigneeIds: z.array(userIdSchema).optional(),
      reporterName: z.string().max(100).optional(),
      reporterId: userIdSchema.optional(),
      issueNumber: z.number().int().positive().optional(),
      activityLog: z
        .array(
          z.object({
            id: z.string(),
            kind: z.enum(["reported", "title_ai", "status", "priority", "assignment", "type"]),
            at: z.string(),
            actorName: z.string().optional(),
            issueType: z.enum(["BUG", "TASK", "FEATURE", "IMPROVEMENT", "STORY"]).optional(),
            fromIssueType: z.enum(["BUG", "TASK", "FEATURE", "IMPROVEMENT", "STORY"]).optional(),
            toIssueType: z.enum(["BUG", "TASK", "FEATURE", "IMPROVEMENT", "STORY"]).optional(),
            fromStatus: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
            toStatus: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
            fromPriority: z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
            toPriority: z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
            fromAssigneeIds: z.array(userIdSchema).optional(),
            toAssigneeIds: z.array(userIdSchema).optional(),
            toAssigneeNames: z.array(z.string()).optional(),
          }),
        )
        .optional(),
    })
    .optional(),
});

export const createIssueSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(5000).nullable().optional(),
  pageUrl: z.string().trim().min(1, "Page URL is required").url("Enter a valid page URL"),
  type: z.enum(["BUG", "TASK", "FEATURE", "IMPROVEMENT", "STORY"]).default("BUG"),
  priority: z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("NONE"),
  assigneeIds: z.array(userIdSchema).default([]),
});

export type CreateIssueData = z.infer<typeof createIssueSchema>;

export const inviteMemberSchema = z.object({
  email: z.string().email().optional(),
  emails: z.array(z.string().email()).min(1).max(25).optional(),
  role: memberRoleSchema.default("MEMBER"),
  workspaceId: z.string().cuid(),
  projectIds: z.array(z.string().cuid()).default([]),
  message: z.string().trim().max(1200).optional(),
}).refine((value) => Boolean(value.email) || Boolean(value.emails?.length), {
  message: "At least one email address is required",
  path: ["emails"],
});

export const updateWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Workspace name is required")
    .max(100, "Workspace name is too long"),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]).optional(),
  projectIds: z.array(z.string().cuid()).optional(),
  suspended: z.boolean().optional(),
});

export const acceptInvitationSchema = z.object({
  token: z.string().trim().min(1, "Invitation token is required"),
});

export const updateUserProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name is too long"),
  status: z
    .string()
    .trim()
    .min(1, "Status is required")
    .max(80, "Status is too long"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters"),
  revokeOtherSessions: z.boolean().optional(),
});
