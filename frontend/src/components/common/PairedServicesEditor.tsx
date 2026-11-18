"use client";

import { useMemo } from "react";
import { AlertTriangleIcon, PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Must match `servicesSchema` in `backend/validators/officeValidator.js`.
 * Kept as an exported constant so pages can reuse the same number without
 * drifting.
 */
export const SERVICE_TAG_CHAR_MAX = 150;

/**
 * Row-based bilingual service editor. Each row = one paired tag (EN + AM
 * side by side) with a remove button. Adding a service appends a fresh
 * empty row; committing happens by typing — there is no Enter-to-commit
 * ceremony. The parent array is always in sync 1:1 with the AM array.
 *
 * Replaces `BilingualServicesEditor`, which used a two-step Enter-driven
 * tag-input UX that felt clumsy compared to the new office form.
 */
export function PairedServicesEditor({
  servicesEn,
  servicesAm,
  onChange,
  max = 20,
}: {
  servicesEn: string[];
  servicesAm: string[];
  onChange: (en: string[], am: string[]) => void;
  max?: number;
}) {
  // Normalize array lengths defensively. The backend guarantees the two
  // arrays match, but a partial payload during editing could momentarily
  // desync them.
  const pairCount = Math.max(servicesEn.length, servicesAm.length);
  const rows = useMemo(
    () =>
      Array.from({ length: pairCount }, (_, i) => ({
        en: servicesEn[i] ?? "",
        am: servicesAm[i] ?? "",
      })),
    [pairCount, servicesEn, servicesAm]
  );

  const servicesWarnAt = Math.floor(max * 0.75);
  const atMax = pairCount >= max;

  const updateAt = (idx: number, lang: "en" | "am", value: string) => {
    const nextEn = [...servicesEn];
    const nextAm = [...servicesAm];
    while (nextEn.length < pairCount) nextEn.push("");
    while (nextAm.length < pairCount) nextAm.push("");
    if (lang === "en") nextEn[idx] = value;
    else nextAm[idx] = value;
    onChange(nextEn, nextAm);
  };

  const removeAt = (idx: number) => {
    onChange(
      servicesEn.filter((_, i) => i !== idx),
      servicesAm.filter((_, i) => i !== idx)
    );
  };

  const addRow = () => {
    if (atMax) return;
    onChange([...servicesEn, ""], [...servicesAm, ""]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <Label>Services offered</Label>
        <CountBadge value={pairCount} max={max} warnAt={servicesWarnAt} />
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-admin-border-strong bg-admin-raise p-6 text-center">
          <p className="text-sm text-admin-muted">
            No services yet. Add the first one below — you can list up to{" "}
            <span className="font-medium text-admin-accent-text">{max}</span> per
            office.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row, idx) => {
            const enOver = row.en.length >= SERVICE_TAG_CHAR_MAX;
            const amOver = row.am.length >= SERVICE_TAG_CHAR_MAX;
            const enWarn = !enOver && row.en.length >= 100;
            const amWarn = !amOver && row.am.length >= 100;
            return (
              <div
                key={idx}
                className="group rounded-xl border border-admin-border bg-admin-raise p-3 hover:border-admin-active/40 transition-colors"
              >
                <div className="flex items-start gap-2">
                  {/* Index badge — helps admin see the pair number */}
                  <div className="shrink-0 mt-1.5 h-6 w-6 rounded-full bg-admin-chip border border-admin-border-strong text-admin-muted text-[11px] font-semibold flex items-center justify-center">
                    {idx + 1}
                  </div>

                  <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {/* EN */}
                    <div className="min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="inline-flex items-center rounded-full bg-admin-chip border border-admin-border-strong text-admin-muted px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                          EN
                        </span>
                        <span
                          className={cn(
                            "text-[10px] tabular-nums",
                            enOver
                              ? "text-admin-bad"
                              : enWarn
                                ? "text-admin-warn"
                                : "text-admin-faint"
                          )}
                        >
                          {row.en.length}/{SERVICE_TAG_CHAR_MAX}
                        </span>
                      </div>
                      <Input
                        value={row.en}
                        onChange={(e) => updateAt(idx, "en", e.target.value)}
                        placeholder="Visitor check-in"
                        maxLength={SERVICE_TAG_CHAR_MAX}
                        className={cn(
                          "text-sm",
                          enOver &&
                            "border-admin-bad/30 focus-visible:ring-red-500"
                        )}
                      />
                    </div>

                    {/* AM */}
                    <div className="min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="inline-flex items-center rounded-full bg-admin-chip border border-admin-border-strong text-admin-muted px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                          አማ
                        </span>
                        <span
                          className={cn(
                            "text-[10px] tabular-nums",
                            amOver
                              ? "text-admin-bad"
                              : amWarn
                                ? "text-admin-warn"
                                : "text-admin-faint"
                          )}
                        >
                          {row.am.length}/{SERVICE_TAG_CHAR_MAX}
                        </span>
                      </div>
                      <Input
                        lang="am-ET"
                        value={row.am}
                        onChange={(e) => updateAt(idx, "am", e.target.value)}
                        placeholder="የጎብኚ መመዝገቢያ"
                        maxLength={SERVICE_TAG_CHAR_MAX}
                        className={cn(
                          "text-sm",
                          amOver &&
                            "border-admin-bad/30 focus-visible:ring-red-500"
                        )}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeAt(idx)}
                    aria-label={`Remove service ${idx + 1}`}
                    className="shrink-0 mt-1 h-8 w-8 rounded-lg border border-transparent hover:border-admin-bad/30 hover:bg-admin-bad/20 text-admin-faint hover:text-admin-bad flex items-center justify-center transition-colors"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[11px] text-admin-faint">
          Both languages are required for every service. The order shown
          here is how they appear on the office guide card.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRow}
          disabled={atMax}
          className="border-admin-active/50 text-admin-accent-text bg-transparent hover:bg-admin-active/10"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          {atMax ? `Max ${max} reached` : "Add service"}
        </Button>
      </div>
    </div>
  );
}

// ─── Local helper ──────────────────────────────────────────────────

function CountBadge({
  value,
  max,
  warnAt,
}: {
  value: number;
  max: number;
  warnAt: number;
}) {
  const atMax = value >= max;
  const warn = !atMax && value >= warnAt;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] tabular-nums font-medium transition-colors",
        atMax
          ? "text-admin-bad"
          : warn
            ? "text-admin-warn"
            : "text-admin-faint"
      )}
    >
      {atMax && <AlertTriangleIcon className="h-3 w-3" />}
      {value}/{max}
    </span>
  );
}
