"use client";

import { LanguagesIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { LOCALE_LABEL, type Locale } from "./dictionary";
import { useLocale } from "./LocaleProvider";

type Variant = "dark" | "light";

/**
 * A compact `EN | አማ` pill switch. Used in the office-guide header (light
 * on cream), the kiosk header (dark on the hero) and anywhere else we need
 * to let a visitor swap languages.
 *
 * The click updates the shared LocaleProvider — every consumer of `useT`
 * or `useLocale` re-renders automatically.
 */
export function LanguageToggle({
  variant = "light",
  className,
}: {
  variant?: Variant;
  className?: string;
}) {
  const { locale, setLocale } = useLocale();
  const options: Locale[] = ["en", "am"];

  return (
    <div
      role="group"
      aria-label={variant === "dark" ? "Language" : "ቋንቋ"}
      className={cn(
        "inline-flex items-center gap-1 rounded-full p-1 border",
        variant === "dark"
          ? "bg-white/10 border-white/20 backdrop-blur"
          : "bg-white/70 border-golden-dark/30 backdrop-blur",
        className
      )}
    >
      <LanguagesIcon
        className={cn(
          "h-3.5 w-3.5 ml-1 shrink-0",
          variant === "dark" ? "text-white/70" : "text-golden-dark/70"
        )}
        aria-hidden
      />
      {options.map((opt) => {
        const active = locale === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => setLocale(opt)}
            aria-pressed={active}
            className={cn(
              "px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider transition-all",
              active
                ? variant === "dark"
                  ? "bg-golden-classic text-[#2c1f0e] shadow-sm"
                  : "bg-golden-dark text-white shadow-sm"
                : variant === "dark"
                ? "text-white/70 hover:text-white"
                : "text-golden-dark/70 hover:text-golden-dark"
            )}
          >
            {LOCALE_LABEL[opt]}
          </button>
        );
      })}
    </div>
  );
}
