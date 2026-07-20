import { ContentContainer } from "@/components/common/ContentContainer";
import { PageHeader } from "@/components/common/PageHeader";

export function ProjectShell({
  projectName,
  websiteUrl,
  workspaceId,
  children,
}: {
  projectId: string;
  projectName: string;
  websiteUrl: string | null;
  workspaceId: string;
  children: React.ReactNode;
}) {
  return (
    <ContentContainer>
      <div className="space-y-6">
        <PageHeader
          title={projectName}
          description={websiteUrl ?? "No website URL"}
          backHref={`/workspaces/${workspaceId}/projects`}
        />
        {children}
      </div>
    </ContentContainer>
  );
}
