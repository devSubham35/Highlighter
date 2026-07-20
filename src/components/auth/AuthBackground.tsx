export function AuthBackground({ variant = "full" }: { variant?: "full" | "panel" | "form" }) {
  if (variant === "form") {
    return (
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-primary/6 blur-3xl" />

        <div className="absolute right-8 top-[18%] h-28 w-40 rotate-6 rounded-2xl border border-dashed border-primary/15 bg-[var(--auth-panel-soft)]" />
        <div className="absolute bottom-[22%] right-[12%] h-20 w-32 -rotate-3 rounded-2xl border border-dashed border-primary/12 bg-[var(--auth-panel-softer)]" />
        <div className="absolute left-[8%] top-[38%] h-16 w-24 rotate-[-8deg] rounded-2xl border border-dashed border-primary/10 bg-[var(--auth-panel-softer)]" />

        <svg
          className="absolute bottom-[30%] right-[28%] h-24 w-24 text-primary/15"
          viewBox="0 0 96 96"
          fill="none"
        >
          <path
            d="M12 72 L12 24 L60 24"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="5 5"
            strokeLinecap="round"
          />
          <path d="M52 16 L68 24 L52 32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>

        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--auth-grid)_1px,transparent_1px),linear-gradient(to_bottom,var(--auth-grid)_1px,transparent_1px)] bg-size-[3rem_3rem] mask-[radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      </div>
    );
  }

  if (variant === "panel") {
    return (
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-1/4 h-80 w-80 rounded-full bg-primary/12 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-success/10 blur-3xl" />

        <div className="absolute right-[10%] top-[12%] h-3 w-3 rounded-full bg-primary/20" />
        <div className="absolute left-[15%] top-[55%] h-2 w-2 rounded-full bg-primary/15" />
        <div className="absolute bottom-[18%] right-[20%] h-2.5 w-2.5 rounded-full bg-primary/10" />

        <div className="absolute left-[6%] top-[20%] h-24 w-36 -rotate-12 rounded-2xl border border-primary/10 bg-[var(--auth-panel-soft)]" />
        <div className="absolute bottom-[12%] left-[30%] h-14 w-20 rotate-6 rounded-xl border border-dashed border-primary/15 bg-[var(--auth-panel-soft)]" />

        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_30%_40%,color-mix(in_srgb,var(--primary)_14%,transparent),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--auth-grid)_1px,transparent_1px),linear-gradient(to_bottom,var(--auth-grid)_1px,transparent_1px)] bg-size-[2.5rem_2.5rem] mask-[radial-gradient(ellipse_at_30%_50%,black,transparent_75%)]" />
      </div>
    );
  }

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,color-mix(in_srgb,var(--primary)_8%,transparent),transparent)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--auth-grid-soft)_1px,transparent_1px),linear-gradient(to_bottom,var(--auth-grid-soft)_1px,transparent_1px)] bg-size-[3.5rem_3.5rem] mask-[radial-gradient(ellipse_at_center,black,transparent_85%)]" />
    </div>
  );
}
