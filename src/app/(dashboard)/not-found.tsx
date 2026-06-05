import { Button } from "@/components/ui/button";
import { ArrowLeft, FolderKanban } from "lucide-react";
import Link from "next/link";

export default function DashboardNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-6xl font-bold tracking-tight text-foreground">404</p>
      <h1 className="mt-3 text-xl font-semibold text-foreground">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        This page does not exist or you may not have access to it.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button variant="outline" render={<Link href="/workspaces" />}>
          <FolderKanban className="h-4 w-4" />
          Workspaces
        </Button>
        <Button render={<Link href="/dashboard" />}>
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Button>
      </div>
    </div>
  );
}
