"use client";

import { IssueDetailModal } from "@/components/issues/IssueDetailModal";
import { IssueRow } from "@/components/issues/IssueRow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseReportMetadata } from "@/lib/report-metadata";
import { toast } from "@/lib/toast";
import type { WorkspaceMember, ReportStatus } from "@/types";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export type IssueItem = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: ReportStatus;
  screenshotUrl: string | null;
  pageUrl: string;
  browser: string | null;
  os: string | null;
  device: string | null;
  userAgent: string | null;
  metadata: unknown;
  createdAt: string;
};

type IssueFilter = "all" | "assigned" | "open" | "unassigned";

export function ProjectDetailsView({
  project,
  issues: initialIssues,
  members,
  currentUserId,
  currentUserName,
}: {
  project: {
    id: string;
    name: string;
    websiteUrl: string | null;
  };
  issues: IssueItem[];
  members: WorkspaceMember[];
  currentUserId: string;
  currentUserName: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [issues, setIssues] = useState(initialIssues);
  const [filter, setFilter] = useState<IssueFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setIssues(initialIssues);
  }, [initialIssues]);

  useEffect(() => {
    const issueId = searchParams.get("issue");
    if (!issueId) return;
    const exists = issues.some((issue) => issue.id === issueId);
    if (!exists) return;
    setSelectedIssueId(issueId);
    setModalOpen(true);
  }, [searchParams, issues]);

  const filteredIssues = useMemo(() => {
    const query = search.trim().toLowerCase();
    return issues.filter((issue) => {
      const metadata = parseReportMetadata(issue.metadata);
      const assigneeIds = metadata.assigneeIds ?? [];

      if (filter === "assigned" && !assigneeIds.includes(currentUserId)) return false;
      if (filter === "open" && issue.status !== "OPEN") return false;
      if (filter === "unassigned" && assigneeIds.length > 0) return false;

      if (!query) return true;
      return (
        issue.title.toLowerCase().includes(query) ||
        issue.description?.toLowerCase().includes(query)
      );
    });
  }, [issues, filter, search, currentUserId]);

  const selectedIssue = issues.find((issue) => issue.id === selectedIssueId) ?? null;

  function openIssue(issueId: string) {
    setSelectedIssueId(issueId);
    setModalOpen(true);
    const params = new URLSearchParams(searchParams.toString());
    params.set("issue", issueId);
    router.replace(`/projects/${project.id}?${params.toString()}`, { scroll: false });
  }

  function closeModal() {
    setModalOpen(false);
    setSelectedIssueId(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("issue");
    const query = params.toString();
    router.replace(query ? `/projects/${project.id}?${query}` : `/projects/${project.id}`, {
      scroll: false,
    });
  }

  const filterButtons: { key: IssueFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "assigned", label: "Assign to me" },
    { key: "open", label: "Open" },
    { key: "unassigned", label: "Unassign" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 rounded-xl border border-sidebar-border bg-card p-3 dark:bg-surface-elevated lg:flex-row lg:items-center lg:justify-between">
        <div className="inline-flex flex-wrap rounded-lg border border-sidebar-border bg-muted/40 p-0.5">
          {filterButtons.map((item) => (
            <Button
              key={item.key}
              type="button"
              variant={filter === item.key ? "secondary" : "ghost"}
              size="sm"
              className={cn("h-7 rounded-md px-2.5", filter === item.key && "bg-card text-primary shadow-sm")}
              onClick={() => setFilter(item.key)}
            >
              {item.label}
            </Button>
          ))}
        </div>
        <div className="relative min-w-[220px] sm:w-64">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search issues"
            aria-label="Search issues"
            className="h-9 bg-white pr-9 dark:bg-background"
          />
          <Search className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      {filteredIssues.length === 0 ? (
        <div className="rounded-xl border border-sidebar-border bg-card p-10 text-center dark:bg-surface-elevated">
          <p className="text-sm text-muted-foreground">No issues match your filters.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredIssues.map((issue) => (
            <IssueRow
              key={issue.id}
              issue={issue}
              projectName={project.name}
              members={members}
              onOpen={() => openIssue(issue.id)}
              onUpdated={(updated) =>
                setIssues((current) =>
                  current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
                )
              }
              onDeleted={(issueId) => {
                setIssues((current) => current.filter((item) => item.id !== issueId));
                if (selectedIssueId === issueId) closeModal();
              }}
            />
          ))}
        </div>
      )}

      <IssueDetailModal
        open={modalOpen}
        onOpenChange={(next) => {
          if (!next) closeModal();
          else setModalOpen(true);
        }}
        issue={selectedIssue}
        issues={issues}
        projectName={project.name}
        members={members}
        currentUserName={currentUserName}
        onNavigate={openIssue}
        onUpdated={(updated) =>
          setIssues((current) =>
            current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
          )
        }
        onDelete={async (issueId) => {
          const response = await fetch(`/api/reports/${issueId}`, { method: "DELETE" });
          if (!response.ok) {
            toast.error("Issue deletion failed", "Could not delete issue.");
            return;
          }
          setIssues((current) => current.filter((item) => item.id !== issueId));
          closeModal();
          toast.success("Issue deleted");
          router.refresh();
        }}
      />
    </div>
  );
}
