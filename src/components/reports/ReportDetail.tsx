"use client";

import { SeverityBadge } from "@/components/reports/SeverityBadge";
import { StatusBadge } from "@/components/reports/StatusBadge";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { isReportStatus, REPORT_STATUS_OPTIONS } from "@/lib/report-options";
import type { ReportStatus, Severity } from "@/types";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Report = {
  id: string;
  title: string;
  description: string | null;
  severity: Severity;
  status: ReportStatus;
  screenshotUrl: string | null;
  pageUrl: string;
  createdAt: Date;
};

export function ReportDetail({ report }: { report: Report }) {
  const router = useRouter();
  const [status, setStatus] = useState(report.status);

  async function updateStatus(nextValue: string) {
    if (!isReportStatus(nextValue)) return;
    setStatus(nextValue);
    await fetch(`/api/reports/${report.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextValue }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            <SeverityBadge severity={report.severity} />
            <StatusBadge status={status} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">{report.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {format(report.createdAt, "MMM d, yyyy h:mm a")} · {report.pageUrl}
          </p>
        </div>
        <Combobox
          value={status}
          onValueChange={updateStatus}
          options={REPORT_STATUS_OPTIONS}
          placeholder="Update status"
          searchable={false}
          aria-label="Update report status"
          className="max-w-48"
        />
      </div>
      {report.description ? (
        <p className="whitespace-pre-wrap rounded-xl border border-sidebar-border bg-card p-4 text-sm text-foreground dark:bg-surface-elevated">
          {report.description}
        </p>
      ) : null}
      {report.screenshotUrl ? (
        <Dialog>
          <DialogTrigger
            render={
              <Button
                type="button"
                variant="outline"
                className="h-auto w-full overflow-hidden rounded-xl border-sidebar-border p-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={report.screenshotUrl} alt="Report screenshot" className="w-full" />
              </Button>
            }
          />
          <DialogContent className="max-w-5xl">
            <DialogBody className="p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={report.screenshotUrl} alt="Report screenshot" className="w-full rounded-lg" />
            </DialogBody>
          </DialogContent>
        </Dialog>
      ) : (
        <div className="flex min-h-72 items-center justify-center rounded-xl border border-sidebar-border bg-muted text-sm text-muted-foreground">
          No screenshot uploaded
        </div>
      )}
    </div>
  );
}
