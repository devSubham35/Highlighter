"use client";

import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  INITIAL_PROJECT_FILTERS,
  PROJECT_SORT_FIELD_OPTIONS,
  PROJECT_SORT_OPTIONS,
  isDefaultProjectFilters,
  type ProjectSort,
  type ProjectSortField,
  type ProjectViewMode,
} from "@/lib/project-filters";
import { cn } from "@/lib/utils";
import { Filter, LayoutGrid, List, Search } from "lucide-react";
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
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<ProjectSort>(INITIAL_PROJECT_FILTERS.sortBy);
  const [sortField, setSortField] = useState<ProjectSortField>(INITIAL_PROJECT_FILTERS.sortField);
  const [draftSortBy, setDraftSortBy] = useState<ProjectSort>(INITIAL_PROJECT_FILTERS.sortBy);
  const [draftSortField, setDraftSortField] = useState<ProjectSortField>(
    INITIAL_PROJECT_FILTERS.sortField,
  );

  useEffect(() => {
    if (!filterOpen) return;
    setDraftSortBy(sortBy);
    setDraftSortField(sortField);
  }, [filterOpen, sortBy, sortField]);

  const filtersAreDefault = isDefaultProjectFilters({ sortBy, sortField });

  const handleApplyFilters = () => {
    setSortBy(draftSortBy);
    setSortField(draftSortField);
    setFilterOpen(false);
  };

  const handleCancelFilters = () => {
    setFilterOpen(false);
  };

  const handleResetFilters = () => {
    setSortBy(INITIAL_PROJECT_FILTERS.sortBy);
    setSortField(INITIAL_PROJECT_FILTERS.sortField);
    setDraftSortBy(INITIAL_PROJECT_FILTERS.sortBy);
    setDraftSortField(INITIAL_PROJECT_FILTERS.sortField);
  };

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
        const aDate = sortField === "lastIssue" ? a.lastIssueAt ?? a.createdAt : a.createdAt;
        const bDate = sortField === "lastIssue" ? b.lastIssueAt ?? b.createdAt : b.createdAt;
        const aTime = new Date(aDate).getTime();
        const bTime = new Date(bDate).getTime();
        return sortBy === "newest" ? bTime - aTime : aTime - bTime;
      });
  }, [projects, search, sortBy, sortField, status]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-xl border border-sidebar-border bg-white p-4 dark:bg-surface-elevated lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="inline-flex rounded-lg border border-sidebar-border bg-muted/40 p-1">
            <Button
              type="button"
              variant={status === "active" ? "secondary" : "ghost"}
              size="sm"
              className={cn("h-8 rounded-md px-3", status === "active" && "bg-card shadow-sm")}
              onClick={() => setStatus("active")}
            >
              Active <span className="ml-1 text-muted-foreground">{activeCount}</span>
            </Button>
            <Button
              type="button"
              variant={status === "archived" ? "secondary" : "ghost"}
              size="sm"
              className={cn("h-8 rounded-md px-3", status === "archived" && "bg-card shadow-sm")}
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
              className="h-10 bg-white pr-9 dark:bg-background"
            />
            <Search className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <div className="inline-flex rounded-lg border border-sidebar-border bg-muted/40 p-1">
            <Button
              type="button"
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              className={cn("h-8 rounded-md px-3", viewMode === "grid" && "bg-card shadow-sm")}
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
              Grid view
            </Button>
            <Button
              type="button"
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className={cn("h-8 rounded-md px-3", viewMode === "list" && "bg-card shadow-sm")}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
              List view
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger
                className={cn(
                  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-white px-3 text-sm font-medium dark:bg-background",
                  "transition-colors hover:bg-muted/50",
                )}
              >
                <Filter className="h-4 w-4" />
                Filter
              </PopoverTrigger>
              <PopoverContent className="w-72 space-y-4">
                <p className="text-sm font-semibold text-foreground">Filter projects</p>
                <div className="space-y-2">
                  <Label>Sort by</Label>
                  <Combobox
                    value={draftSortBy}
                    onValueChange={(value) => setDraftSortBy(value as ProjectSort)}
                    options={PROJECT_SORT_OPTIONS}
                    searchable={false}
                    aria-label="Sort by"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sort field</Label>
                  <Combobox
                    value={draftSortField}
                    onValueChange={(value) => setDraftSortField(value as ProjectSortField)}
                    options={PROJECT_SORT_FIELD_OPTIONS}
                    searchable={false}
                    aria-label="Sort field"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 border-t border-sidebar-border pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="h-10 px-5"
                    onClick={handleCancelFilters}
                  >
                    Cancel
                  </Button>
                  <Button type="button" size="lg" className="h-10 px-5" onClick={handleApplyFilters}>
                    Apply
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10"
              disabled={filtersAreDefault}
              onClick={handleResetFilters}
            >
              Reset
            </Button>
          </div>

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
            viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-4" : "flex flex-col gap-3",
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
