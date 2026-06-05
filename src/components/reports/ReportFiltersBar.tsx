"use client";

import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import {
  REPORT_STATUS_FILTER_OPTIONS,
  SEVERITY_FILTER_OPTIONS,
} from "@/lib/report-options";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function ReportFiltersBar({
  defaultSearch,
  defaultStatus,
  defaultSeverity,
}: {
  defaultSearch?: string;
  defaultStatus?: string;
  defaultSeverity?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(defaultSearch ?? "");
  const [status, setStatus] = useState(defaultStatus ?? "");
  const [severity, setSeverity] = useState(defaultSeverity ?? "");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (status) params.set("status", status);
    if (severity) params.set("severity", severity);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-3 rounded-xl border border-sidebar-border bg-card p-3 shadow-sm dark:bg-surface-elevated md:grid-cols-[1fr_auto_auto_auto] md:items-center"
    >
      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search reports"
        aria-label="Search reports"
      />
      <Combobox
        value={status}
        onValueChange={setStatus}
        options={REPORT_STATUS_FILTER_OPTIONS}
        placeholder="All statuses"
        searchable={false}
        aria-label="Filter by status"
        className="min-w-44"
      />
      <Combobox
        value={severity}
        onValueChange={setSeverity}
        options={SEVERITY_FILTER_OPTIONS}
        placeholder="All severities"
        searchable={false}
        aria-label="Filter by severity"
        className="min-w-44"
      />
      <Button type="submit">Filter</Button>
    </form>
  );
}
