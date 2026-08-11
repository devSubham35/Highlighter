"use client";

import * as React from "react";
import { Popover } from "@base-ui/react/popover";
import { Check, ChevronDown, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ComboboxOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface ComboboxProps {
  value?: string;
  onValueChange?: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  popoverClassName?: string;
  disabled?: boolean;
  emptyMessage?: string;
  searchable?: boolean;
  showSelectedCheck?: boolean;
  optionClassName?: (option: ComboboxOption, selected: boolean) => string | undefined;
  "aria-label"?: string;
}

function Combobox({
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  className,
  popoverClassName,
  disabled = false,
  emptyMessage = "No results found",
  searchable = true,
  showSelectedCheck = true,
  optionClassName,
  "aria-label": ariaLabel,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    const query = search.toLowerCase();
    if (!query) return options;
    return options.filter((option) => option.label.toLowerCase().includes(query));
  }, [options, search]);

  const selected = options.find((option) => option.value === value);
  const popoverOpen = disabled ? false : open;

  const handleSelect = (optionValue: string) => {
    if (disabled) return;
    onValueChange?.(optionValue);
    setOpen(false);
    setSearch("");
  };

  const handleOpenChange = (next: boolean) => {
    if (disabled) {
      setOpen(false);
      setSearch("");
      return;
    }
    setOpen(next);
    if (!next) setSearch("");
  };

  return (
    <Popover.Root open={popoverOpen} onOpenChange={handleOpenChange}>
      <Popover.Trigger
        disabled={disabled}
        aria-label={ariaLabel}
        className={cn(
          "flex h-9 w-full min-w-40 cursor-pointer items-center justify-between gap-2 rounded-md border border-input bg-card px-3 text-sm font-medium whitespace-nowrap transition-colors outline-none select-none",
          "hover:opacity-95 focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:opacity-100",
          !selected && "text-muted-foreground",
          className,
        )}
      >
        <span className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden text-left">
          {selected?.icon ? <span className="flex shrink-0 items-center">{selected.icon}</span> : null}
          <span className="min-w-0 truncate">{selected?.label ?? placeholder}</span>
        </span>
        <ChevronDown className="pointer-events-none h-4 w-4 shrink-0 text-muted-foreground" />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner
          side="bottom"
          align="start"
          sideOffset={4}
          className={cn("isolate z-50 w-(--anchor-width)", popoverClassName)}
        >
          <Popover.Popup className="rounded-lg border border-sidebar-border bg-popover shadow-xl data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            {searchable ? (
              <div className="flex items-center gap-2 border-b border-sidebar-border px-3 py-2">
                <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={searchPlaceholder}
                  disabled={disabled}
                  className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                />
              </div>
            ) : null}

            <div className="max-h-56 overflow-y-auto p-1">
              {filtered.length === 0 ? (
                <p className="px-3 py-2 text-xs text-muted-foreground">{emptyMessage}</p>
              ) : (
                filtered.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <Button
                      key={option.value}
                      type="button"
                      variant="ghost"
                      disabled={disabled}
                      onClick={() => handleSelect(option.value)}
                      className={cn(
                        "relative w-full cursor-pointer justify-start gap-2 px-2.5 text-left text-sm font-normal",
                        showSelectedCheck && "pr-8",
                        "hover:!bg-secondary hover:!text-secondary-foreground dark:hover:!bg-secondary/90",
                        isSelected && "bg-primary/10 font-semibold text-primary hover:bg-primary/15",
                        optionClassName?.(option, isSelected),
                      )}
                    >
                      {option.icon ? <span className="flex shrink-0 items-center">{option.icon}</span> : null}
                      {option.label}
                      {showSelectedCheck && isSelected ? (
                        <span className="pointer-events-none absolute right-2 flex h-4 w-4 items-center justify-center text-current">
                          <Check className="h-3 w-3" />
                        </span>
                      ) : null}
                    </Button>
                  );
                })
              )}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

export { Combobox };
export type { ComboboxOption, ComboboxProps };
