"use client";

import { useMemo, useState } from "react";
import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Kept structural so this component works with the `Role` from
// `types/auth.d.ts` (returned by `useGetRolesQuery`) as well as the
// richer `Role` from `types/user.ts`.
interface RoleOption {
  role_id: string;
  name: string;
  description?: string;
  is_active?: boolean;
}

/**
 * Bordered popover picker for assigning one or more roles to a user.
 * Shows a golden-outlined trigger with each selected role rendered as a
 * removable chip. Panel supports search + shows active/inactive state.
 *
 * Kept generic so the create-user and edit-user modals can share it —
 * the parent owns the `selectedIds` state and the toggle handler.
 */
export function RoleMultiSelect({
  roles,
  selectedIds,
  onChange,
  disabled,
  placeholder = "Assign one or more roles",
  loading,
}: {
  roles: RoleOption[];
  selectedIds: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const activeRoles = useMemo(
    () => roles.filter((r) => r.is_active !== false),
    [roles]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeRoles;
    return activeRoles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q)
    );
  }, [activeRoles, search]);

  const selectedRoles = useMemo(
    () => roles.filter((r) => selectedIds.includes(r.role_id)),
    [roles, selectedIds]
  );

  const toggle = (roleId: string) => {
    if (disabled) return;
    onChange(
      selectedIds.includes(roleId)
        ? selectedIds.filter((id) => id !== roleId)
        : [...selectedIds, roleId]
    );
  };

  const remove = (roleId: string) => {
    onChange(selectedIds.filter((id) => id !== roleId));
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors",
              open
                ? "border-golden-dark ring-2 ring-golden-dark/20"
                : "border-input hover:border-golden-classic/60",
              disabled && "opacity-60 cursor-not-allowed"
            )}
          >
            <span
              className={cn(
                "truncate",
                selectedRoles.length === 0 && "text-muted-foreground"
              )}
            >
              {selectedRoles.length === 0
                ? placeholder
                : `${selectedRoles.length} role${
                    selectedRoles.length === 1 ? "" : "s"
                  } selected`}
            </span>
            <ChevronDownIcon
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                open && "rotate-180"
              )}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="p-0 w-[--radix-popover-trigger-width] max-h-[300px] overflow-hidden"
        >
          <div className="p-2 border-b border-golden-classic/20">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search roles…"
              className="h-8 text-sm"
              autoFocus
            />
          </div>
          <div className="max-h-[220px] overflow-y-auto py-1">
            {loading ? (
              <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                Loading roles…
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                {search
                  ? "No roles match your search."
                  : "No active roles yet. Create one first."}
              </div>
            ) : (
              filtered.map((role) => {
                const isSelected = selectedIds.includes(role.role_id);
                return (
                  <button
                    key={role.role_id}
                    type="button"
                    onClick={() => toggle(role.role_id)}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                      isSelected
                        ? "bg-golden-metallic/60 text-golden-dark"
                        : "hover:bg-golden-metallic/30"
                    )}
                  >
                    <span
                      className={cn(
                        "h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-colors",
                        isSelected
                          ? "bg-golden-dark border-golden-dark text-white"
                          : "border-golden-classic/50"
                      )}
                    >
                      {isSelected && <CheckIcon className="h-3 w-3" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {role.name}
                      </p>
                      {role.description && (
                        <p className="text-[11px] text-muted-foreground truncate">
                          {role.description}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>

      {selectedRoles.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedRoles.map((role) => (
            <span
              key={role.role_id}
              className="inline-flex items-center gap-1 rounded-full bg-golden-metallic border border-golden-classic/40 text-golden-dark text-xs font-medium pl-2.5 pr-1 py-0.5"
            >
              {role.name}
              <button
                type="button"
                onClick={() => remove(role.role_id)}
                className="rounded-full p-0.5 hover:bg-golden-classic/40 transition-colors"
                aria-label={`Remove ${role.name}`}
              >
                <XIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
