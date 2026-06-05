import { jsonError } from "@/lib/api/helpers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateProjectSchema } from "@/lib/validations";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

async function requireProjectAccess(projectId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: jsonError("Unauthorized", 401) };

  const project = await db.project.findFirst({
    where: {
      id: projectId,
      workspace: { memberships: { some: { userId: session.user.id } } },
    },
  });

  if (!project) return { error: jsonError("Not found", 404) };
  return { session, project };
}

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/projects/[projectId]">) {
  const { projectId } = await ctx.params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;

  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { _count: { select: { reports: true } } },
  });

  return NextResponse.json(project);
}

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/projects/[projectId]">) {
  const { projectId } = await ctx.params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;

  const parsed = updateProjectSchema.safeParse(await req.json());
  if (!parsed.success) {
    return jsonError(parsed.error.flatten(), 400);
  }

  const project = await db.project.update({ where: { id: projectId }, data: parsed.data });
  return NextResponse.json(project);
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/projects/[projectId]">) {
  const { projectId } = await ctx.params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;

  await db.project.delete({ where: { id: projectId } });
  return NextResponse.json({ ok: true });
}
