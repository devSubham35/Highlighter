import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Metadata = {
  browser: string | null;
  browserVersion: string | null;
  os: string | null;
  device: string | null;
  screenWidth: number | null;
  screenHeight: number | null;
  viewportWidth: number | null;
  viewportHeight: number | null;
  pageUrl: string;
  referrer: string | null;
  userAgent: string | null;
  createdAt: Date;
};

export function MetadataPanel({ report }: { report: Metadata }) {
  const rows = [
    ["Browser", `${report.browser ?? "Unknown"} ${report.browserVersion ?? ""}`.trim()],
    ["OS", report.os ?? "Unknown"],
    ["Device", report.device ?? "Unknown"],
    ["Screen", report.screenWidth && report.screenHeight ? `${report.screenWidth} x ${report.screenHeight}` : "Unknown"],
    ["Viewport", report.viewportWidth && report.viewportHeight ? `${report.viewportWidth} x ${report.viewportHeight}` : "Unknown"],
    ["URL", report.pageUrl],
    ["Referrer", report.referrer ?? "None"],
    ["User agent", report.userAgent ?? "Unknown"],
  ];

  return (
    <Card className="border border-sidebar-border shadow-sm dark:bg-surface-elevated">
      <CardHeader>
        <CardTitle>Metadata</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map(([label, value]) => (
          <div key={label}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="break-words text-sm text-foreground">{value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
