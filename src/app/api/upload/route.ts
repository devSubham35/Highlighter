import { corsHeaders } from "@/lib/http";
import { generatePresignedUploadUrl, getPublicUrl } from "@/lib/r2";
import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { contentType?: string; projectKey?: string };
  const contentType = body.contentType ?? "";
  const projectKey = body.projectKey ?? "unknown";

  if (!contentType.startsWith("image/")) {
    return NextResponse.json({ error: "Invalid content type" }, { status: 400, headers: corsHeaders() });
  }

  const ext = contentType.split("/")[1] || "png";
  const key = `screenshots/${projectKey}/${nanoid()}.${ext}`;
  const uploadUrl = await generatePresignedUploadUrl(key, contentType);

  return NextResponse.json(
    { uploadUrl, publicUrl: getPublicUrl(key), key },
    { headers: corsHeaders() },
  );
}
