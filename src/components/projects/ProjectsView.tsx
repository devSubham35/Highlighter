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
import { cn } from "@/lib/utils";
import { LayoutGrid, List, Search } from "lucide-react";
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
const PROJECT_VIEW_MODE_STORAGE_KEY = "highlighter:projects:view-mode";

export function ProjectsView({
  workspaceId,
  projects,
}: {
  workspaceId: string;
  projects: ProjectListItem[];
}) {
  const [status, setStatus] = useState<StatusFilter>("active");
  const [viewMode, setViewMode] = useState<ProjectViewMode>("grid");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<ProjectSort>(INITIAL_PROJECT_FILTERS.sortBy);

  useEffect(() => {
    const stored = window.localStorage.getItem(PROJECT_VIEW_MODE_STORAGE_KEY);
    if (stored === "grid" || stored === "list") {
      setViewMode(stored);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(PROJECT_VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  const activeCount = projects.filter((project) => !project.archived).length;
  const archivedCount = projects.filter((project) => project.archived).length;

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    return projects
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
  }, [projects, search, sortBy, status]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 rounded-xl border border-sidebar-border bg-white p-3 dark:bg-surface-elevated lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="inline-flex rounded-lg border border-sidebar-border bg-muted/40 p-0.5">
            <Button
              type="button"
              variant={status === "active" ? "secondary" : "ghost"}
              size="sm"
              className={cn("text-xs", status === "active" && "bg-card text-primary shadow-sm")}
              onClick={() => setStatus("active")}
            >
              Active <span className="ml-1 text-muted-foreground">{activeCount}</span>
            </Button>
            <Button
              type="button"
              variant={status === "archived" ? "secondary" : "ghost"}
              size="sm"
              className={cn("text-xs", status === "archived" && "bg-card text-primary shadow-sm")}
              onClick={() => setStatus("archived")}
            >
              Archived <span className="ml-1 text-muted-foreground">{archivedCount}</span>
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
          <div className="inline-flex rounded-lg border border-sidebar-border bg-muted/40 p-0.5">
            <Button
              type="button"
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              className={cn(viewMode === "grid" && "bg-card text-primary shadow-sm")}
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className={cn(viewMode === "list" && "bg-card text-primary shadow-sm")}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Combobox
            value={sortBy}
            onValueChange={(value) => setSortBy(value as ProjectSort)}
            options={PROJECT_SORT_OPTIONS}
            searchable={false}
            aria-label="Sort by"
            className="h-9 w-36 text-sm"
          />

          <CreateProjectDialog workspaceId={workspaceId} />
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="rounded-xl border border-sidebar-border bg-card p-10 text-center dark:bg-surface-elevated">
          <p className="text-sm text-muted-foreground">
            {status === "archived"
              ? "No archived projects yet."
              : "No projects match your search."}
          </p>
        </div>
      ) : (
        <div
          className={cn(
            viewMode === "grid"
              ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6"
              : "flex flex-col gap-3",
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
