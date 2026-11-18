"use client";

import { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";

interface DataToolbarProps {
  title: string;
  description?: string;
  search: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  right?: ReactNode;
  filters?: ReactNode;
}

export function DataToolbar({
  title,
  description,
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  right,
  filters,
}: DataToolbarProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-admin-heading">{title}</h1>
          {description && (
            <p className="text-sm text-admin-faint mt-0.5">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">{right}</div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3 rounded-xl border border-admin-border bg-admin-raise px-4 py-3">
        <div className="relative w-full md:w-80">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-admin-accent-text" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9 h-10 bg-admin-raise border-admin-border-strong text-admin-text placeholder:text-admin-faint focus-visible:ring-golden-classic/40 focus-visible:border-admin-active/50"
          />
        </div>
        {filters && <div className="flex items-center gap-2 flex-wrap">{filters}</div>}
      </div>
    </div>
  );
}
