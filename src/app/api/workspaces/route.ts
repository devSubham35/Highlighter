import {
  canAccessAllWorkspaceProjects,
  getWorkspaceCounts,
  jsonError,
  isWorkspaceNameTaken,
  projectAccessWhere,
  requireSession,
} from "@/lib/api/helpers";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slugify";
import { createWorkspaceSchema } from "@/lib/validations";
import { addDays } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const workspaces = await db.workspace.findMany({
    where: {
      deletedAt: null,
      memberships: { some: { userId: authResult.session.user.id } },
    },
    orderBy: { createdAt: "desc" },
    include: {
      memberships: {
        where: { userId: authResult.session.user.id },
        select: { role: true },
      },
      _count: {
        select: {
          memberships: true,
        },
      },
    },
  });

  return NextResponse.json(
    await Promise.all(
      workspaces.map(async (workspace) => {
        const role = workspace.memberships[0]?.role ?? "MEMBER";
        const projectWhere = canAccessAllWorkspaceProjects(role)
          ? { workspaceId: workspace.id, archived: false }
          : {
              workspaceId: workspace.id,
              archived: false,
              ...projectAccessWhere(authResult.session.user.id),
            };

        return {
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
          ownerId: workspace.ownerId,
          role,
          projectCount: await db.project.count({ where: projectWhere }),
          memberCount: workspace._count.memberships,
          createdAt: workspace.createdAt,
          updatedAt: workspace.updatedAt,
        };
      }),
    ),
  );
}

export async function POST(req: NextRequest) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const body = await req.json();
  const parsed = createWorkspaceSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.flatten(), 400);
  }

  if (await isWorkspaceNameTaken(authResult.session.user.id, parsed.data.name)) {
    return jsonError("A workspace with this name already exists.", 409);
  }

  const baseSlug = slugify(parsed.data.name);
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;
  const workspace = await db.workspace.create({
    data: {
      name: parsed.data.name,
      slug,
      ownerId: authResult.session.user.id,
      memberships: { create: { userId: authResult.session.user.id, role: "OWNER" } },
    },
  });

  const inviteEmail = typeof body.inviteEmail === "string" ? body.inviteEmail.trim() : "";
  if (inviteEmail) {
    await db.invitation.create({
      data: {
        workspaceId: workspace.id,
        email: inviteEmail,
        role: "MEMBER",
        invitedById: authResult.session.user.id,
        expiresAt: addDays(new Date(), 7),
      },
    });
  }

  const counts = await getWorkspaceCounts(workspace.id);

  return NextResponse.json({ ...workspace, ...counts, role: "OWNER" }, { status: 201 });
}
