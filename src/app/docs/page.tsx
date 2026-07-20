"use client";

import { OPENAPI_VERSION } from "@/lib/openapi";
import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen bg-white">
      <SwaggerUI
        url={`/api/openapi?v=${OPENAPI_VERSION}`}
        docExpansion="list"
        defaultModelsExpandDepth={1}
        persistAuthorization
        tryItOutEnabled
      />
    </main>
  );
}
