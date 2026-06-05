import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { mergeReportMetadata, parseReportMetadata } from "@/lib/report-metadata";
import { updateReportSchema, updateReportStatusSchema } from "@/lib/validations";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

async function requireReport(reportId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Unauthorized" as const };

  const report = await db.report.findFirst({
    where: {
      id: reportId,
      project: { organization: { memberships: { some: { userId: session.user.id } } } },
    },
    include: { project: true, comments: { include: { author: true }, orderBy: { createdAt: "asc" } } },
  });

  if (!report) return { error: "Not found" as const };
  return { session, report };
}

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/reports/[reportId]">) {
  const { reportId } = await ctx.params;
  const access = await requireReport(reportId);
  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.error === "Unauthorized" ? 401 : 404 });
  }
  return NextResponse.json(access.report);
}

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/reports/[reportId]">) {
  const { reportId } = await ctx.params;
  const access = await requireReport(reportId);
  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.error === "Unauthorized" ? 401 : 404 });
  }

  const body = await req.json();
  const parsed = updateReportSchema.safeParse(body);
  if (!parsed.success) {
    const legacy = updateReportStatusSchema.safeParse(body);
    if (!legacy.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const report = await db.report.update({
      where: { id: reportId },
      data: legacy.data,
    });
    return NextResponse.json(report);
  }

  const existingMetadata = parseReportMetadata(access.report.metadata);
  const nextMetadata = parsed.data.metadata
    ? mergeReportMetadata(existingMetadata, parsed.data.metadata)
    : undefined;

  const report = await db.report.update({
    where: { id: reportId },
    data: {
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
      ...(nextMetadata ? { metadata: nextMetadata } : {}),
    },
  });

  return NextResponse.json(report);
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/reports/[reportId]">) {
  const { reportId } = await ctx.params;
  const access = await requireReport(reportId);
  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.error === "Unauthorized" ? 401 : 404 });
  }

  await db.report.delete({ where: { id: reportId } });
  return NextResponse.json({ ok: true });
}
