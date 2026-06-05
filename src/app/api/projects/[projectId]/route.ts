import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateProjectSchema } from "@/lib/validations";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

async function requireProjectAccess(projectId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Unauthorized" as const };

  const project = await db.project.findFirst({
    where: {
      id: projectId,
      organization: { memberships: { some: { userId: session.user.id } } },
    },
  });

  if (!project) return { error: "Not found" as const };
  return { session, project };
}

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/projects/[projectId]">) {
  const { projectId } = await ctx.params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.error === "Unauthorized" ? 401 : 404 });
  }

  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { _count: { select: { reports: true } } },
  });

  return NextResponse.json(project);
}

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/projects/[projectId]">) {
  const { projectId } = await ctx.params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.error === "Unauthorized" ? 401 : 404 });
  }

  const parsed = updateProjectSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const project = await db.project.update({ where: { id: projectId }, data: parsed.data });
  return NextResponse.json(project);
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/projects/[projectId]">) {
  const { projectId } = await ctx.params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.error === "Unauthorized" ? 401 : 404 });
  }

  await db.project.delete({ where: { id: projectId } });
  return NextResponse.json({ ok: true });
}
