import { PageHeader } from "@/components/common/PageHeader";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { FolderKanban, LayoutGrid } from "lucide-react";
import { headers } from "next/headers";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session!.user.id;

  const orgFilter = { organization: { memberships: { some: { userId } } } };

  const [projects, activeProjects] = await Promise.all([
    db.project.count({ where: orgFilter }),
    db.project.count({ where: { ...orgFilter, archived: false } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="A quick look at your visual feedback pipeline."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard label="Projects" value={projects} icon={FolderKanban} />
        <StatsCard label="Active projects" value={activeProjects} icon={LayoutGrid} />
      </div>
    </div>
  );
}
