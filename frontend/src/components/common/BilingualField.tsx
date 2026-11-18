"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Lang = "en" | "am";

/**
 * A tab-pair input that keeps EN and AM values side-by-side without
 * doubling the vertical footprint of the form. The AM tab gets a subtle
 * chip when it has content, so admins can see at a glance whether a
 * translation is missing.
 */
export function BilingualField({
  label,
  htmlFor,
  valueEn,
  valueAm,
  onChangeEn,
  onChangeAm,
  placeholderEn,
  placeholderAm,
  required = false,
  multiline = false,
  rows = 3,
  disabled = false,
  hint,
}: {
  label: string;
  htmlFor?: string;
  valueEn: string;
  valueAm: string;
  onChangeEn: (v: string) => void;
  onChangeAm: (v: string) => void;
  placeholderEn?: string;
  placeholderAm?: string;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  disabled?: boolean;
  hint?: ReactNode;
}) {
  const [active, setActive] = useState<Lang>("en");

  const enId = htmlFor ? `${htmlFor}-en` : undefined;
  const amId = htmlFor ? `${htmlFor}-am` : undefined;

  const enFilled = valueEn.trim().length > 0;
  const amFilled = valueAm.trim().length > 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={active === "en" ? enId : amId}>
          {label}
          {required && <span className="text-destructive"> *</span>}
        </Label>
        <div
          role="tablist"
          aria-label={`${label} language`}
          className="inline-flex items-center gap-0.5 rounded-md border border-input bg-muted/40 p-0.5"
        >
          <LangTab
            active={active === "en"}
            filled={enFilled}
            onClick={() => setActive("en")}
          >
            EN
          </LangTab>
          <LangTab
            active={active === "am"}
            filled={amFilled}
            onClick={() => setActive("am")}
          >
            አማ
          </LangTab>
        </div>
      </div>

      {/* Both inputs are always mounted so unfocused edits don't lose state.
          We just visually hide the inactive one. */}
      <div className="relative">
        <div className={active === "en" ? "" : "hidden"}>
          {multiline ? (
            <Textarea
              id={enId}
              value={valueEn}
              onChange={(e) => onChangeEn(e.target.value)}
              placeholder={placeholderEn}
              rows={rows}
              disabled={disabled}
            />
          ) : (
            <Input
              id={enId}
              value={valueEn}
              onChange={(e) => onChangeEn(e.target.value)}
              placeholder={placeholderEn}
              disabled={disabled}
            />
          )}
        </div>
        <div className={active === "am" ? "" : "hidden"}>
          {multiline ? (
            <Textarea
              id={amId}
              value={valueAm}
              onChange={(e) => onChangeAm(e.target.value)}
              placeholder={placeholderAm}
              rows={rows}
              disabled={disabled}
              lang="am-ET"
            />
          ) : (
            <Input
              id={amId}
              value={valueAm}
              onChange={(e) => onChangeAm(e.target.value)}
              placeholder={placeholderAm}
              disabled={disabled}
              lang="am-ET"
            />
          )}
        </div>
      </div>

      {hint && (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

function LangTab({
  active,
  filled,
  onClick,
  children,
}: {
  active: boolean;
  filled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "relative px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider transition-colors",
        active
          ? "bg-admin-surface text-admin-accent-text shadow-sm border border-golden-dark/20"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
      {filled && (
        <span
          className={cn(
            "absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full",
            active ? "bg-admin-accent" : "bg-admin-chip text-admin-faint"
          )}
          aria-hidden
        />
      )}
    </button>
  );
}
