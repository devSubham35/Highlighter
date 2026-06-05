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

export const createOrganizationFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Organization name is required")
    .max(100, "Organization name is too long"),
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

export const createCommentFormSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comment is required")
    .max(2000, "Comment is too long"),
});

export type LoginFormData = z.infer<typeof loginFormSchema>;
export type RegisterFormData = z.infer<typeof registerFormSchema>;
export type CreateOrganizationFormData = z.infer<typeof createOrganizationFormSchema>;
export type CreateProjectFormData = z.infer<typeof createProjectFormSchema>;
export type CreateCommentFormData = z.infer<typeof createCommentFormSchema>;

export const createOrganizationSchema = createOrganizationFormSchema;

export const createProjectSchema = createProjectFormSchema.extend({
  organizationId: z.string().cuid(),
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
      type: z.enum(["BUG", "IMPROVEMENT"]).optional(),
      priority: z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
      assigneeIds: z.array(z.string().cuid()).optional(),
      reporterName: z.string().max(100).optional(),
      reporterId: z.string().cuid().optional(),
      issueNumber: z.number().int().positive().optional(),
      activityLog: z
        .array(
          z.object({
            id: z.string(),
            kind: z.enum(["reported", "title_ai", "status", "priority", "comment"]),
            at: z.string(),
            actorName: z.string().optional(),
            issueType: z.enum(["BUG", "IMPROVEMENT"]).optional(),
            fromStatus: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
            toStatus: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
            fromPriority: z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
            toPriority: z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
            comment: z.string().optional(),
          }),
        )
        .optional(),
    })
    .optional(),
});

export const createCommentSchema = createCommentFormSchema;

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "MEMBER"]),
  organizationId: z.string().cuid(),
});
