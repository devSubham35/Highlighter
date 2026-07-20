import { canAccessAllWorkspaceProjects, jsonError, requireProjectAccess } from "@/lib/api/helpers";
import { db } from "@/lib/db";
import { updateProjectSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/projects/[projectId]">) {
  const { projectId } = await ctx.params;
  const access = await requireProjectAccess(projectId, "read");
  if ("error" in access) return access.error;

  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { _count: { select: { reports: true } } },
  });

  return NextResponse.json(project);
}

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/projects/[projectId]">) {
  const { projectId } = await ctx.params;
  const access = await requireProjectAccess(projectId, "read");
  if ("error" in access) return access.error;
  if (!canAccessAllWorkspaceProjects(access.membership.role)) return jsonError("Forbidden", 403);

  const parsed = updateProjectSchema.safeParse(await req.json());
  if (!parsed.success) {
    return jsonError(parsed.error.flatten(), 400);
  }

  const project = await db.project.update({ where: { id: projectId }, data: parsed.data });
  return NextResponse.json(project);
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/projects/[projectId]">) {
  const { projectId } = await ctx.params;
  const access = await requireProjectAccess(projectId, "read");
  if ("error" in access) return access.error;
  if (!canAccessAllWorkspaceProjects(access.membership.role)) return jsonError("Forbidden", 403);

  await db.project.delete({ where: { id: projectId } });
  return NextResponse.json({ ok: true });
}
