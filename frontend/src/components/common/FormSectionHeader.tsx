import { ReactNode } from "react";

/**
 * Small consistent section divider used inside the redesigned create/edit
 * modals for floors and offices. Keeps the visual pattern (chip icon +
 * uppercase label + optional subtitle + hairline) the same everywhere.
 */
export function FormSectionHeader({
  icon,
  label,
  subtitle,
}: {
  icon?: ReactNode;
  label: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        {icon && (
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-golden-metallic border border-golden-classic/30 text-golden-dark">
            {icon}
          </span>
        )}
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-golden-dark">
          {label}
        </span>
        {subtitle && (
          <span className="text-[11px] text-muted-foreground">
            — {subtitle}
          </span>
        )}
      </div>
      <span className="flex-1 h-px bg-gradient-to-r from-golden-classic/30 via-golden-classic/15 to-transparent" />
    </div>
  );
}
