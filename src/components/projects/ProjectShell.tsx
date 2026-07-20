"use client";

import { BreadcrumbHeader } from "@/components/common/BreadcrumbHeader";
import { ContentContainer } from "@/components/common/ContentContainer";
import { usePathname } from "next/navigation";

function currentProjectSection(pathname: string, projectId: string) {
  if (pathname.startsWith(`/projects/${projectId}/widgets`)) return "Widgets";
  if (pathname.startsWith(`/projects/${projectId}/settings`)) return "Settings";
  return "Feedbacks";
}

export function ProjectShell({
  projectId,
  projectName,
  workspaceName,
  workspaceId,
  children,
}: {
  projectId: string;
  projectName: string;
  workspaceName: string;
  websiteUrl: string | null;
  workspaceId: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <ContentContainer>
      <div className="space-y-6">
        <BreadcrumbHeader
          items={[
            { label: workspaceName, href: `/workspaces/${workspaceId}` },
            { label: "Projects", href: `/workspaces/${workspaceId}/projects` },
            { label: projectName, href: `/projects/${projectId}` },
            { label: currentProjectSection(pathname, projectId) },
          ]}
        />
        {children}
      </div>
    </ContentContainer>
  );
}
