import { getOpenApiSpec } from "@/lib/openapi";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const baseUrl = req.nextUrl.origin;
  const spec = getOpenApiSpec(baseUrl);

  return NextResponse.json(spec, {
    headers: {
      "Cache-Control": "public, max-age=3600",
    },
  });
}
