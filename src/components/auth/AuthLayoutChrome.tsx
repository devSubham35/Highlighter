import { AuthBackground } from "@/components/auth/AuthBackground";
import { AuthGraphic } from "@/components/auth/AuthGraphic";
import { Highlighter } from "lucide-react";
import Link from "next/link";

export function AuthLayoutChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-screen md:grid-cols-2">
      <AuthBackground variant="full" />

      <aside className="bg-auth-panel relative hidden flex-col justify-between overflow-hidden border-r border-border/70 p-10 md:flex lg:p-14">
        <AuthBackground variant="panel" />

        <Link href="/" className="relative z-10 inline-flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/80 text-primary shadow-[var(--shadow-surface)]">
            <Highlighter className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold text-foreground">Highlighter</span>
        </Link>

        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">
              Bug reports with context
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
              Collect screenshots, annotations, and browser details from any site — then triage them in
              one dashboard.
            </p>
          </div>

          <AuthGraphic />
        </div>

        <p className="relative z-10 text-xs text-muted-foreground">Visual bug reporting for product teams</p>
      </aside>

      <main className="relative flex flex-col justify-center overflow-hidden px-6 py-10 md:px-10 lg:px-16">
        <AuthBackground variant="form" />

        <Link href="/" className="relative z-10 mb-8 inline-flex items-center gap-2 md:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Highlighter className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold text-foreground">Highlighter</span>
        </Link>

        <div className="relative z-10 mx-auto w-full max-w-sm">
          <div className="rounded-2xl border border-border/70 bg-card p-8 shadow-[var(--shadow-surface)]">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
