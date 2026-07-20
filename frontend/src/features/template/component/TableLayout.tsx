import React, { useCallback } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageLayoutProps } from "@/types/tableLayout";
import { FilterPopover } from "./FilterDrawer";
import { useSearchParams, useRouter } from "next/navigation";

export const TableLayout: React.FC<PageLayoutProps> = ({
  title,
  description,
  actions = [],
  filters = [],
  children,
  filterColumnsPerRow = 1,
}) => {
  // Get URL state for search
  const searchParams = useSearchParams();
  const router = useRouter();

  const searchQuery = searchParams.get("search") || "";

  const handleSearchChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("search", value);
      params.set("page", "1"); // reset page
      router.push(`${window.location.pathname}?${params.toString()}`);
    },
    [searchParams, router]
  );

  return (
    <div className="p-6 border border-white/10 rounded-xl bg-[#0D1F3C]/80 backdrop-blur shadow-xl">
      <div className="space-y-6">
        {/* Page Header - Single Line Layout */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left side - Title and Description */}
          <div>
            {title && (
              <h1 className="text-2xl font-semibold text-golden-classic">{title}</h1>
            )}
            {description && (
              <p className="text-white/50 text-lg">{description}</p>
            )}
          </div>

          {/* Right side - Search, Filters, and Actions in one line */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 w-64 bg-white/5 border-white/15 text-white placeholder:text-white/30 focus-visible:ring-golden-classic/40 focus-visible:border-golden-classic/50"
              />
            </div>

            {/* Filters */}
            {filters.length > 0 && (
              <FilterPopover
                filters={filters}
                columnsPerRow={filterColumnsPerRow}
              />
            )}

            {actions.length > 0 && (
              <div className="flex items-center space-x-2">
                {actions.map((action, index) => (
                  <Button
                    key={index}
                    variant={action.variant || "default"}
                    size={action.size || "default"}
                    onClick={action.onClick}
                    disabled={action.disabled || action.loading}
                    className="flex items-center space-x-2"
                  >
                    {action.loading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      action.icon && (
                        <span className="h-4 w-4">{action.icon}</span>
                      )
                    )}
                    <span>{action.label}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-transparent mt-4">{children}</div>
      </div>
    </div>
  );
};
