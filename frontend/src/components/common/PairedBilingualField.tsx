"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/**
 * Renders BOTH the English and Amharic inputs for a translatable field
 * side by side (or stacked on narrow viewports). Replaces the previous
 * tab-toggle `BilingualField`, which forced admins to click between the
 * two variants to see one at a time.
 *
 * Both inputs share one label + one hint block so the field still reads
 * as a single logical entity. `required` shows a red asterisk on the
 * shared label and adds `required` to the EN input; the AM input is
 * always required-ish in practice but we don't add browser validation
 * to it (the server enforces the pair rule).
 */
export function PairedBilingualField({
  label,
  hint,
  required,
  multiline,
  rows = 3,
  valueEn,
  valueAm,
  onChangeEn,
  onChangeAm,
  placeholderEn,
  placeholderAm,
  maxLength,
  disabled,
  id,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  valueEn: string;
  valueAm: string;
  onChangeEn: (v: string) => void;
  onChangeAm: (v: string) => void;
  placeholderEn?: string;
  placeholderAm?: string;
  maxLength?: number;
  disabled?: boolean;
  /** Optional stable id used to link the shared label to the EN input. */
  id?: string;
}) {
  const enFilled = valueEn.trim().length > 0;
  const amFilled = valueAm.trim().length > 0;

  // Renders one language column. Kept local because both columns share
  // most props/state and pulling this into a sibling file adds indirection
  // for no reuse elsewhere.
  const LangColumn = ({
    lang,
    langLabel,
    value,
    onChange,
    placeholder,
    filled,
  }: {
    lang: "en" | "am";
    langLabel: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    filled: boolean;
  }) => {
    const commonProps = {
      value,
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      ) => onChange(e.target.value),
      placeholder,
      disabled,
      maxLength,
      lang: lang === "am" ? "am-ET" : "en",
      required: required && lang === "en",
      id: lang === "en" ? id : undefined,
    } as const;

    return (
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border transition-colors",
              filled
                ? "bg-golden-dark text-white border-golden-dark"
                : "bg-white text-golden-dark/70 border-golden-classic/40"
            )}
          >
            {langLabel}
          </span>
          {filled && (
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
          )}
        </div>
        {multiline ? (
          <Textarea
            {...commonProps}
            rows={rows}
            className={cn(
              "w-full resize-y",
              lang === "am" && "font-[var(--font-noto-ethiopic)]"
            )}
          />
        ) : (
          <Input
            {...commonProps}
            className={cn(
              "w-full",
              lang === "am" && "font-[var(--font-noto-ethiopic)]"
            )}
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </Label>
        {hint && (
          <span className="text-[11px] text-muted-foreground">{hint}</span>
        )}
      </div>
      <div className="flex flex-col md:flex-row gap-3">
        <LangColumn
          lang="en"
          langLabel="EN"
          value={valueEn}
          onChange={onChangeEn}
          placeholder={placeholderEn}
          filled={enFilled}
        />
        <LangColumn
          lang="am"
          langLabel="አማ"
          value={valueAm}
          onChange={onChangeAm}
          placeholder={placeholderAm}
          filled={amFilled}
        />
      </div>
    </div>
  );
}
