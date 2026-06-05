import type { ComboboxOption } from "@/components/ui/combobox";
import { reportStatusIcon } from "@/lib/issue-options";
import type { ReportStatus, Severity } from "@/types";

export const REPORT_STATUS_OPTIONS: ComboboxOption[] = [
  { value: "OPEN", label: "Open", icon: reportStatusIcon("OPEN") },
  { value: "IN_PROGRESS", label: "In progress", icon: reportStatusIcon("IN_PROGRESS") },
  { value: "RESOLVED", label: "Resolved", icon: reportStatusIcon("RESOLVED") },
  { value: "CLOSED", label: "Closed", icon: reportStatusIcon("CLOSED") },
];

export const REPORT_STATUS_FILTER_OPTIONS: ComboboxOption[] = [
  { value: "", label: "All statuses" },
  ...REPORT_STATUS_OPTIONS,
];

export const SEVERITY_OPTIONS: ComboboxOption[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

export const SEVERITY_FILTER_OPTIONS: ComboboxOption[] = [
  { value: "", label: "All severities" },
  ...SEVERITY_OPTIONS,
];

export function isReportStatus(value: string): value is ReportStatus {
  return REPORT_STATUS_OPTIONS.some((option) => option.value === value);
}

export function isSeverity(value: string): value is Severity {
  return SEVERITY_OPTIONS.some((option) => option.value === value);
}
