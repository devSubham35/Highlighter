"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import * as RechartsPrimitive from "recharts";
import type { TooltipContentProps } from "recharts";

export type ChartConfig = {
  [key: string]: {
    label?: React.ReactNode;
    color?: string;
  };
};

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }
  return context;
}

export function ChartContainer({
  id,
  className,
  children,
  config,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
  config: ChartConfig;
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-muted-foreground/25 [&_.recharts-tooltip-cursor]:fill-muted/50",
          className,
        )}
        style={
          Object.fromEntries(
            Object.entries(config).map(([key, value]) => [`--color-${key}`, value.color ?? "var(--primary)"]),
          ) as React.CSSProperties
        }
      >
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

export const ChartTooltip = RechartsPrimitive.Tooltip;

export function ChartTooltipContent({
  active,
  payload,
  label,
  className,
}: Partial<TooltipContentProps<number | string, string>> & {
  className?: string;
}) {
  const { config } = useChart();

  if (!active || !payload?.length) return null;

  return (
    <div
      className={cn(
        "grid min-w-36 gap-2 rounded-xl border border-border bg-popover p-3 text-xs text-popover-foreground shadow-xl",
        className,
      )}
    >
      {label ? <div className="font-semibold">{label}</div> : null}
      <div className="grid gap-1.5">
        {payload.map((item) => {
          const key = String(item.dataKey ?? item.name);
          const itemConfig = config[key];
          const color = item.color ?? itemConfig?.color ?? "var(--primary)";

          return (
            <div key={key} className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
                {itemConfig?.label ?? item.name}
              </span>
              <span className="font-semibold text-foreground">{item.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
