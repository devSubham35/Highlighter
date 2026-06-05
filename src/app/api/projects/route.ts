import { enrichProjects, jsonError, requireWorkspaceMembership } from "@/lib/api/helpers";
import { generateApiKey } from "@/lib/api-key";
import { db } from "@/lib/db";
import { createProjectSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) {
    return jsonError("workspaceId required", 400);
  }

  const access = await requireWorkspaceMembership(workspaceId);
  if ("error" in access) return access.error;

  const enriched = req.nextUrl.searchParams.get("enriched") !== "false";

  const projects = await db.project.findMany({
    where: { workspaceId },
    include: { _count: { select: { reports: true } } },
    orderBy: { createdAt: "desc" },
  });

  if (!enriched) {
    return NextResponse.json(projects);
  }

  return NextResponse.json(await enrichProjects(projects));
}

export async function POST(req: NextRequest) {
  const parsed = createProjectSchema.safeParse(await req.json());
  if (!parsed.success) {
    return jsonError(parsed.error.flatten(), 400);
  }

  const access = await requireWorkspaceMembership(parsed.data.workspaceId, "ADMIN");
  if ("error" in access) return access.error;

  const project = await db.project.create({
    data: { ...parsed.data, apiKey: generateApiKey() },
  });

  return NextResponse.json(project, { status: 201 });
}
