"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ComboboxOption } from "@/components/ui/combobox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Search } from "lucide-react";
import { useMemo, useState } from "react";

export function MultiSelectCombobox({
  values,
  onValuesChange,
  options,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  className,
  triggerClassName,
  emptyMessage = "No results found",
  ariaLabel,
}: {
  values: string[];
  onValuesChange: (values: string[]) => void;
  options: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  triggerClassName?: string;
  emptyMessage?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    if (!query) return options;
    return options.filter((option) => option.label.toLowerCase().includes(query));
  }, [options, search]);

  const selectedLabels = options
    .filter((option) => values.includes(option.value))
    .map((option) => option.label);

  const label =
    selectedLabels.length === 0
      ? placeholder
      : selectedLabels.length === 1
        ? selectedLabels[0]
        : `${selectedLabels.length} selected`;

  function toggle(value: string) {
    if (values.includes(value)) {
      onValuesChange(values.filter((item) => item !== value));
      return;
    }
    onValuesChange([...values, value]);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={ariaLabel}
        className={cn(
          "flex h-10 w-full min-w-36 items-center justify-between gap-2 rounded-lg border border-input bg-card px-3 text-sm font-medium transition-colors outline-none hover:bg-muted/50",
          !selectedLabels.length && "text-muted-foreground",
          triggerClassName,
          className,
        )}
      >
        <span className="truncate text-left">{label}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="w-(--anchor-width) min-w-56 p-0">
        <div className="flex items-center gap-2 border-b border-sidebar-border px-3 py-2">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="max-h-56 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">{emptyMessage}</p>
          ) : (
            filtered.map((option) => {
              const isSelected = values.includes(option.value);
              return (
                <Button
                  key={option.value}
                  type="button"
                  variant="ghost"
                  onClick={() => toggle(option.value)}
                  className={cn(
                    "relative h-auto w-full justify-start rounded-md px-2 py-2 pr-8 text-left text-sm font-normal",
                    isSelected && "bg-primary/10 font-semibold text-primary hover:bg-primary/15",
                  )}
                >
                  {option.icon ? <span className="mr-2 flex shrink-0 items-center">{option.icon}</span> : null}
                  {option.label}
                  {isSelected ? (
                    <span className="pointer-events-none absolute right-2 flex h-4 w-4 items-center justify-center text-primary">
                      <Check className="h-3 w-3" />
                    </span>
                  ) : null}
                </Button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
