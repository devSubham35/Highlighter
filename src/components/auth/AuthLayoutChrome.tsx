import { AuthBackground } from "@/components/auth/AuthBackground";
import { AuthGraphic } from "@/components/auth/AuthGraphic";
import { Highlighter } from "lucide-react";
import Link from "next/link";

export function AuthLayoutChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-screen md:grid-cols-2">
      <AuthBackground variant="full" />

      <aside className="bg-auth-panel relative hidden flex-col overflow-hidden border-r border-border/70 px-10 py-8 md:flex lg:px-14 lg:py-10">
        <AuthBackground variant="panel" />

        <Link href="/" className="relative z-10 inline-flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/80 text-primary shadow-[var(--shadow-surface)]">
            <Highlighter className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold text-foreground">Highlighter</span>
        </Link>

        <div className="relative z-10 mt-16 space-y-8">
          <div>
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
              Smart Bug Reporting
            </div>
            <h1 className="mt-4 max-w-md text-4xl font-semibold tracking-tight text-foreground">
              Bug reports with
              <span className="block text-primary">context that matters</span>
            </h1>
            <p className="mt-4 max-w-[30rem] text-base leading-7 text-muted-foreground">
              Collect screenshots, annotations, and browser details from any site — then triage them in
              one dashboard.
            </p>
          </div>

          <AuthGraphic />
        </div>

        <div className="relative z-10 mt-auto flex items-center gap-3 pt-8">
          <div className="flex -space-x-2">
            <span className="h-7 w-7 rounded-full border-2 border-white bg-[#d2d6db]" />
            <span className="h-7 w-7 rounded-full border-2 border-white bg-[#f2b5a7]" />
            <span className="h-7 w-7 rounded-full border-2 border-white bg-[#9bc0ff]" />
            <span className="h-7 w-7 rounded-full border-2 border-white bg-[#b5d6a3]" />
          </div>
          <div>
            <p className="text-xs font-medium text-foreground">Loved by 1,000+ teams worldwide</p>
            <p className="text-xs text-muted-foreground">★★★★★ 4.9/5</p>
          </div>
        </div>
      </aside>

      <main className="relative flex flex-col justify-center overflow-hidden px-6 py-10 md:px-10 lg:px-16">
        <AuthBackground variant="form" />

        <Link href="/" className="relative z-10 mb-8 inline-flex items-center gap-2 md:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Highlighter className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold text-foreground">Highlighter</span>
        </Link>

        <div className="relative z-10 mx-auto w-full max-w-md">
          <div className="rounded-2xl border border-border/70 bg-card p-8 shadow-[var(--shadow-surface)] md:p-10">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
