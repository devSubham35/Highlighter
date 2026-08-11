"use client";

import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import {
  INITIAL_PROJECT_FILTERS,
  PROJECT_SORT_OPTIONS,
  type ProjectSort,
  type ProjectViewMode,
} from "@/lib/project-filters";
import type { IssueRealtimeEvent } from "@/lib/realtime";
import { useIssueRealtime } from "@/lib/use-issue-realtime";
import { cn } from "@/lib/utils";
import type { ReportStatus } from "@/types";
import {
  Archive,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  FolderPlus,
  LayoutGrid,
  List,
  Search,
  SearchX,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export type ProjectListItem = {
  id: string;
  name: string;
  websiteUrl: string | null;
  archived: boolean;
  createdAt: string;
  openCount: number;
  imageCount: number;
  lastIssueAt: string | null;
};

type StatusFilter = "active" | "archived";
const PROJECT_VIEW_MODE_STORAGE_KEY = "highlight:projects:view-mode";

export function ProjectsView({
  workspaceId,
  projects,
}: {
  workspaceId: string;
  projects: ProjectListItem[];
}) {
  const [projectItems, setProjectItems] = useState(projects);
  const [status, setStatus] = useState<StatusFilter>("active");
  const [viewMode, setViewMode] = useState<ProjectViewMode>("grid");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<ProjectSort>(INITIAL_PROJECT_FILTERS.sortBy);
  const [createOpen, setCreateOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setProjectItems(projects);
    });
    return () => {
      cancelled = true;
    };
  }, [projects]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      const stored = window.localStorage.getItem(PROJECT_VIEW_MODE_STORAGE_KEY);
      if (!cancelled && (stored === "grid" || stored === "list")) {
        setViewMode(stored);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(PROJECT_VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (searchParams.get("create") !== "project") return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setCreateOpen(true);
    });
    router.replace(`/workspaces/${workspaceId}/projects`, { scroll: false });
    return () => {
      cancelled = true;
    };
  }, [router, searchParams, workspaceId]);

  const activeCount = projectItems.filter((project) => !project.archived).length;
  const archivedCount = projectItems.filter((project) => project.archived).length;
  const hasSearch = search.trim().length > 0;
  const sortOptions = useMemo(
    () =>
      PROJECT_SORT_OPTIONS.map((option) => ({
        ...option,
        icon:
          option.value === "newest" ? (
            <ArrowDownWideNarrow className="h-4 w-4" />
          ) : (
            <ArrowUpWideNarrow className="h-4 w-4" />
          ),
      })),
    [],
  );

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    return projectItems
      .filter((project) => (status === "active" ? !project.archived : project.archived))
      .filter((project) => {
        if (!query) return true;
        return (
          project.name.toLowerCase().includes(query) ||
          (project.websiteUrl?.toLowerCase().includes(query) ?? false)
        );
      })
      .sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return sortBy === "newest" ? bTime - aTime : aTime - bTime;
      });
  }, [projectItems, search, sortBy, status]);

  function updateProjectFromEvent(event: IssueRealtimeEvent) {
    if (
      event.type !== "issue.created" &&
      event.type !== "issue:status_changed"
    ) {
      return;
    }

    setProjectItems((current) =>
      current.map((project) => {
        if (project.id !== event.projectId) return project;

        if (event.type === "issue.created") {
          return {
            ...project,
            openCount: event.issue.status === "OPEN" ? project.openCount + 1 : project.openCount,
            imageCount: event.issue.screenshotUrl ? project.imageCount + 1 : project.imageCount,
            lastIssueAt: maxIsoDate(project.lastIssueAt, event.issue.createdAt),
          };
        }

        return {
          ...project,
          openCount: applyStatusDelta(project.openCount, event.previousStatus, event.status, "OPEN"),
        };
      }),
    );
  }

  return (
    <div className="space-y-6">
      {projectItems.map((project) => (
        <ProjectRealtimeBridge
          key={project.id}
          projectId={project.id}
          onEvent={updateProjectFromEvent}
        />
      ))}

      <div className="flex flex-col gap-2 rounded-xl border border-sidebar-border bg-white p-3 dark:bg-surface-elevated lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="inline-flex rounded-lg border border-border/70 bg-white/80 p-0.5 text-xs shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
            <Button
              type="button"
              variant={status === "active" ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "text-xs text-muted-foreground hover:bg-muted/70 hover:text-foreground dark:hover:bg-white/10",
                status === "active" &&
                  "bg-primary text-primary-foreground shadow-none hover:bg-primary hover:text-primary-foreground",
              )}
              onClick={() => setStatus("active")}
            >
              Active{" "}
              <span className={cn("ml-1 text-muted-foreground", status === "active" && "text-primary-foreground/80")}>
                {activeCount}
              </span>
            </Button>
            <Button
              type="button"
              variant={status === "archived" ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "text-xs text-muted-foreground hover:bg-muted/70 hover:text-foreground dark:hover:bg-white/10",
                status === "archived" &&
                  "bg-primary text-primary-foreground shadow-none hover:bg-primary hover:text-primary-foreground",
              )}
              onClick={() => setStatus("archived")}
            >
              Archived{" "}
              <span className={cn("ml-1 text-muted-foreground", status === "archived" && "text-primary-foreground/80")}>
                {archivedCount}
              </span>
            </Button>
          </div>

          <div className="relative min-w-[220px] sm:w-56">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search websites"
              aria-label="Search websites"
              className="h-9 bg-white pr-9 dark:bg-background"
            />
            <Search className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <div className="inline-flex rounded-lg border border-border/70 bg-white/80 p-0.5 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
            <Button
              type="button"
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "text-muted-foreground hover:bg-muted/70 hover:text-foreground dark:hover:bg-white/10",
                viewMode === "grid" &&
                  "bg-primary text-primary-foreground shadow-none hover:bg-primary hover:text-primary-foreground",
              )}
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "text-muted-foreground hover:bg-muted/70 hover:text-foreground dark:hover:bg-white/10",
                viewMode === "list" &&
                  "bg-primary text-primary-foreground shadow-none hover:bg-primary hover:text-primary-foreground",
              )}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Combobox
            value={sortBy}
            onValueChange={(value) => setSortBy(value as ProjectSort)}
            options={sortOptions}
            searchable={false}
            aria-label="Sort by"
            className="h-9 w-36 text-sm"
          />

          <CreateProjectDialog
            workspaceId={workspaceId}
            open={createOpen}
            onOpenChange={setCreateOpen}
          />
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <ProjectsEmptyState
          status={status}
          hasSearch={hasSearch}
          onClearSearch={() => setSearch("")}
          onCreateProject={() => setCreateOpen(true)}
          onViewActive={() => setStatus("active")}
        />
      ) : (
        <div
          className={cn(
            viewMode === "grid"
              ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6"
              : "flex flex-col gap-3.5",
          )}
        >
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              variant={viewMode}
              workspaceId={workspaceId}
              project={{
                id: project.id,
                name: project.name,
                websiteUrl: project.websiteUrl,
                archived: project.archived,
                openCount: project.openCount,
                imageCount: project.imageCount,
                lastIssueAt: project.lastIssueAt,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectsEmptyState({
  status,
  hasSearch,
  onClearSearch,
  onCreateProject,
  onViewActive,
}: {
  status: StatusFilter;
  hasSearch: boolean;
  onClearSearch: () => void;
  onCreateProject: () => void;
  onViewActive: () => void;
}) {
  const isArchived = status === "archived";
  const Icon = hasSearch ? SearchX : isArchived ? Archive : FolderPlus;
  const title = hasSearch
    ? "No projects found"
    : isArchived
      ? "No archived projects"
      : "Create your first project";
  const description = hasSearch
    ? "Try a different website name or clear the search to see all projects."
    : isArchived
      ? "Projects you archive will appear here, away from your active workspace."
      : "Connect a website and start collecting visual feedback from your team.";

  return (
    <section className="flex min-h-72 items-center justify-center rounded-[18px] border border-dashed border-border/80 bg-card px-6 py-12 text-center shadow-sm dark:bg-surface-elevated">
      <div className="mx-auto flex max-w-sm flex-col items-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
          <Icon className="h-5 w-5" />
        </span>
        <h2 className="mt-4 text-base font-semibold text-foreground">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {hasSearch ? (
            <Button type="button" variant="outline" size="sm" onClick={onClearSearch}>
              Clear Search
            </Button>
          ) : isArchived ? (
            <Button type="button" variant="outline" size="sm" onClick={onViewActive}>
              View Active
            </Button>
          ) : (
            <Button type="button" size="sm" onClick={onCreateProject}>
              <FolderPlus className="h-4 w-4" />
              Create Project
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

function ProjectRealtimeBridge({
  projectId,
  onEvent,
}: {
  projectId: string;
  onEvent: (event: IssueRealtimeEvent) => void;
}) {
  useIssueRealtime({
    enabled: Boolean(projectId),
    projectId,
    onEvent,
  });

  return null;
}

function applyStatusDelta(
  current: number,
  previousStatus: ReportStatus,
  nextStatus: ReportStatus,
  watchedStatus: ReportStatus,
) {
  if (previousStatus === nextStatus) return current;
  if (previousStatus === watchedStatus && nextStatus !== watchedStatus) {
    return Math.max(current - 1, 0);
  }
  if (previousStatus !== watchedStatus && nextStatus === watchedStatus) {
    return current + 1;
  }
  return current;
}

function maxIsoDate(current: string | null, next: string) {
  if (!current) return next;
  return new Date(next).getTime() > new Date(current).getTime() ? next : current;
}
