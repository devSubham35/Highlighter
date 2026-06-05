import type { ComboboxOption } from "@/components/ui/combobox";

export const PROJECT_SORT_OPTIONS: ComboboxOption[] = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
];

export const PROJECT_SORT_FIELD_OPTIONS: ComboboxOption[] = [
  { value: "created", label: "Date Created" },
  { value: "lastIssue", label: "Last Issue" },
];

export type ProjectSort = (typeof PROJECT_SORT_OPTIONS)[number]["value"];
export type ProjectSortField = (typeof PROJECT_SORT_FIELD_OPTIONS)[number]["value"];
export type ProjectViewMode = "grid" | "list";

export const INITIAL_PROJECT_FILTERS = {
  sortBy: "newest" as ProjectSort,
  sortField: "created" as ProjectSortField,
};

export function isDefaultProjectFilters(filters: typeof INITIAL_PROJECT_FILTERS) {
  return (
    filters.sortBy === INITIAL_PROJECT_FILTERS.sortBy &&
    filters.sortField === INITIAL_PROJECT_FILTERS.sortField
  );
}
