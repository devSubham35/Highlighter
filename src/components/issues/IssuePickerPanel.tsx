"use client";

import { IssueUserAvatar } from "@/components/issues/IssueUserAvatar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Check, Search } from "lucide-react";
import { useMemo, useState } from "react";

export type IssuePickerItem = {
  value: string;
  label: string;
  icon?: React.ReactNode;
  subtitle?: string;
  avatarName?: string;
  avatarImage?: string | null;
};

export function IssuePickerPanel({
  searchPlaceholder,
  items,
  value,
  values,
  multiple = false,
  onSelect,
  onValuesChange,
  emptyMessage = "No results found",
}: {
  searchPlaceholder: string;
  items: IssuePickerItem[];
  value?: string;
  values?: string[];
  multiple?: boolean;
  onSelect?: (value: string) => void;
  onValuesChange?: (values: string[]) => void;
  emptyMessage?: string;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(query) ||
        item.subtitle?.toLowerCase().includes(query),
    );
  }, [items, search]);

  const selectedSet = new Set(multiple ? (values ?? []) : value ? [value] : []);

  function handleClick(itemValue: string) {
    if (multiple && onValuesChange) {
      const next = selectedSet.has(itemValue)
        ? (values ?? []).filter((id) => id !== itemValue)
        : [...(values ?? []), itemValue];
      onValuesChange(next);
      return;
    }
    onSelect?.(itemValue);
  }

  return (
    <div className="w-72 overflow-hidden rounded-lg border border-sidebar-border bg-popover text-popover-foreground shadow-xl">
      <div className="flex items-center gap-2 border-b border-sidebar-border px-3 py-2.5">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={searchPlaceholder}
          className="h-8 flex-1 border-0 bg-transparent px-0 text-sm text-popover-foreground shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
          autoFocus
        />
      </div>
      <div className="max-h-64 overflow-y-auto p-1">
        {filtered.length === 0 ? (
          <p className="px-3 py-2 text-xs text-muted-foreground">{emptyMessage}</p>
        ) : (
          filtered.map((item) => {
            const isSelected = selectedSet.has(item.value);
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => handleClick(item.value)}
                className={cn(
                  "grid w-full cursor-pointer grid-cols-[1rem_1.5rem_minmax(0,1fr)_auto] items-center gap-x-2 rounded-md px-2 py-2 text-left text-sm transition-colors",
                  "hover:bg-secondary hover:text-secondary-foreground dark:hover:bg-secondary/90",
                  isSelected && "bg-primary/10 font-medium text-primary hover:bg-primary/15",
                  !item.avatarName && !item.icon && "grid-cols-[1rem_minmax(0,1fr)_auto]",
                )}
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center",
                    isSelected ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {isSelected ? <Check className="h-3.5 w-3.5" /> : null}
                </span>
                {item.avatarName ? (
                  <IssueUserAvatar
                    name={item.avatarName}
                    image={item.avatarImage}
                    className="h-6 w-6 shrink-0 text-xs"
                  />
                ) : item.icon ? (
                  <span className="flex shrink-0 items-center justify-center">{item.icon}</span>
                ) : (
                  <span aria-hidden />
                )}
                <span className="min-w-0 truncate font-medium">{item.label}</span>
                <span aria-hidden />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
