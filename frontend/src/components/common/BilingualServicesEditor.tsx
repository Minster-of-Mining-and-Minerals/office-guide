"use client";

import { useState } from "react";
import { AlertTriangleIcon, XIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * A pair of parallel service tag arrays: `services` (EN) and `servicesAm`.
 * Adds are two-step (type EN → press Enter → type AM → press Enter → tag
 * committed). Removes take out the same index from BOTH arrays so the two
 * stay 1:1 aligned, satisfying the backend validator.
 *
 * This component is intentionally strict about that pairing — the server
 * rejects mismatched arrays, so we never allow the UI to produce them.
 */

// Must match `servicesSchema` in `backend/validators/officeValidator.js`.
// Kept as an exported constant so page-level counters can reuse the same
// number without drifting.
export const SERVICE_TAG_CHAR_MAX = 150;

// Threshold at which the counters flip color so admins get a visual warning
// well before hitting the hard cap.
const SERVICE_TAG_CHAR_WARN = 100;
const SERVICES_COUNT_WARN_RATIO = 0.75;

/** Small badge showing `x / max` with an amber warn / red at-cap variant. */
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
            : "text-muted-foreground"
      )}
    >
      {atMax && <AlertTriangleIcon className="h-3 w-3" />}
      {value}/{max}
    </span>
  );
}

export function BilingualServicesEditor({
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
  const [draftEn, setDraftEn] = useState("");
  const [draftAm, setDraftAm] = useState("");
  const [step, setStep] = useState<"en" | "am">("en");

  const atMax = servicesEn.length >= max;
  const servicesWarnAt = Math.floor(max * SERVICES_COUNT_WARN_RATIO);

  // Whichever draft is currently focused drives the per-tag counter under
  // the input row. `activeDraft` is the string being counted right now.
  const activeDraft = step === "en" ? draftEn : draftAm;
  const draftOverLimit = activeDraft.length >= SERVICE_TAG_CHAR_MAX;

  const removeAt = (idx: number) => {
    onChange(
      servicesEn.filter((_, i) => i !== idx),
      servicesAm.filter((_, i) => i !== idx)
    );
  };

  const commit = () => {
    const en = draftEn.trim();
    const am = draftAm.trim();
    if (!en || !am) return;
    // Belt-and-braces: even though the inputs have `maxLength`, an admin
    // might paste in an oversize string with trailing whitespace we then
    // trim to just under the cap. Anything still over — drop, don't send.
    if (en.length > SERVICE_TAG_CHAR_MAX || am.length > SERVICE_TAG_CHAR_MAX) {
      return;
    }
    // Case-insensitive de-dupe on the EN side to prevent visual duplicates.
    const seen = new Set(servicesEn.map((s) => s.toLowerCase()));
    if (seen.has(en.toLowerCase())) {
      setDraftEn("");
      setDraftAm("");
      setStep("en");
      return;
    }
    onChange([...servicesEn, en], [...servicesAm, am]);
    setDraftEn("");
    setDraftAm("");
    setStep("en");
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (step === "en") {
        if (!draftEn.trim()) return;
        setStep("am");
      } else {
        commit();
      }
    } else if (
      e.key === "Backspace" &&
      step === "en" &&
      !draftEn &&
      servicesEn.length > 0
    ) {
      // Backspace on empty EN input pops the last pair.
      removeAt(servicesEn.length - 1);
    } else if (e.key === "Escape") {
      setDraftEn("");
      setDraftAm("");
      setStep("en");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <Label>Services offered</Label>
        <CountBadge
          value={servicesEn.length}
          max={max}
          warnAt={servicesWarnAt}
        />
      </div>

      <div className="rounded-md border border-input bg-admin-surface px-2 py-1.5 focus-within:ring-1 focus-within:ring-golden-dark focus-within:border-golden-dark">
        <div className="flex flex-wrap gap-1.5">
          {servicesEn.map((s, idx) => (
            <span
              key={`${s}-${idx}`}
              className="group inline-flex items-center gap-0.5 rounded-full bg-admin-active/10 border border-golden-dark/20 pl-2.5 pr-1 py-0.5 text-xs font-medium text-admin-accent-text max-w-full"
              title={`${s} · ${servicesAm[idx] ?? ""}`}
            >
              <span className="flex items-center gap-1 min-w-0">
                <span className="truncate max-w-[220px]">{s}</span>
                <span className="text-admin-accent-text shrink-0">·</span>
                <span
                  lang="am-ET"
                  className="truncate max-w-[220px]"
                >
                  {servicesAm[idx] ?? ""}
                </span>
              </span>
              <button
                type="button"
                onClick={() => removeAt(idx)}
                className="h-4 w-4 shrink-0 rounded-full hover:bg-admin-active/10 flex items-center justify-center text-admin-accent-text hover:text-admin-accent-text"
                aria-label={`Remove ${s}`}
              >
                <XIcon className="h-3 w-3" />
              </button>
            </span>
          ))}

          {!atMax && (
            <div className="flex-1 min-w-[200px] flex items-center gap-1.5">
              <span
                className={cn(
                  "shrink-0 inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border",
                  step === "en"
                    ? "bg-admin-accent text-black border-admin-active"
                    : "text-muted-foreground border-input"
                )}
              >
                EN
              </span>
              <input
                value={draftEn}
                onChange={(e) => setDraftEn(e.target.value)}
                onKeyDown={onKey}
                onFocus={() => setStep("en")}
                maxLength={SERVICE_TAG_CHAR_MAX}
                placeholder={
                  servicesEn.length === 0 ? "e.g. Visitor check-in" : "English"
                }
                className="flex-1 min-w-[80px] bg-transparent outline-none text-sm py-1"
              />
              <span
                className={cn(
                  "shrink-0 inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border",
                  step === "am"
                    ? "bg-admin-accent text-black border-admin-active"
                    : "text-muted-foreground border-input"
                )}
              >
                አማ
              </span>
              <input
                lang="am-ET"
                value={draftAm}
                onChange={(e) => setDraftAm(e.target.value)}
                onKeyDown={onKey}
                onFocus={() => setStep("am")}
                maxLength={SERVICE_TAG_CHAR_MAX}
                placeholder="e.g. የጎብኚ መመዝገቢያ"
                className="flex-1 min-w-[80px] bg-transparent outline-none text-sm py-1"
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[11px] text-muted-foreground">
          {atMax
            ? `You've reached the maximum of ${max} services for one office.`
            : "Fill the English tag, press Enter, then type the Amharic tag and press Enter to add. Removing a tag removes both languages at once."}
        </p>
        {!atMax && (
          <CountBadge
            value={activeDraft.length}
            max={SERVICE_TAG_CHAR_MAX}
            warnAt={SERVICE_TAG_CHAR_WARN}
          />
        )}
      </div>

      {draftOverLimit && (
        <p className="text-[11px] text-admin-bad">
          A single service is capped at {SERVICE_TAG_CHAR_MAX} characters. Shorten the
          tag to keep it readable on the kiosk.
        </p>
      )}
    </div>
  );
}
