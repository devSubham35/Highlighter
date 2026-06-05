import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit, corsHeaders } from "@/lib/http";
import { createReportSchema } from "@/lib/validations";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!checkRateLimit(`report:${ip}`, 10)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: corsHeaders() });
  }

  const parsed = createReportSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400, headers: corsHeaders() });
  }

  const project = await db.project.findUnique({
    where: { apiKey: parsed.data.projectApiKey },
  });
  if (!project) {
    return NextResponse.json({ error: "Invalid project key" }, { status: 404, headers: corsHeaders() });
  }

  const { projectApiKey, ...reportData } = parsed.data;
  void projectApiKey;

  const report = await db.report.create({
    data: { ...reportData, projectId: project.id },
  });

  return NextResponse.json(
    { id: report.id, message: "Report submitted" },
    { status: 201, headers: corsHeaders() },
  );
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status") || undefined;
  const severity = req.nextUrl.searchParams.get("severity") || undefined;
  const projectId = req.nextUrl.searchParams.get("projectId") || undefined;
  const search = req.nextUrl.searchParams.get("search") || undefined;

  const reports = await db.report.findMany({
    where: {
      ...(projectId ? { projectId } : {}),
      ...(status ? { status: status as never } : {}),
      ...(severity ? { severity: severity as never } : {}),
      ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
      project: {
        organization: { memberships: { some: { userId: session.user.id } } },
      },
    },
    include: { project: true, _count: { select: { comments: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(reports);
}
