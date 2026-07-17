import type { Locale } from "./dictionary";

/**
 * Returns the localized string for `entity[field]` given the active locale.
 *
 * Fallback rules:
 * - If locale === "am" and `entity[field_am]` is a non-empty string, return it.
 * - Otherwise return `entity[field]` (English source).
 * - `null`/`undefined`/empty strings are transparently handled.
 *
 * @example
 *   pickLang(office, "name", locale)                // "አቀባበል" or "Reception"
 *   pickLang(office, "department", locale) ?? "—"   // handles nullable
 */
export function pickLang<
  E extends Record<string, unknown>,
  F extends Extract<keyof E, string>
>(entity: E | null | undefined, field: F, locale: Locale): string | null {
  if (!entity) return null;
  const enValue = entity[field];
  if (locale !== "am") {
    return isNonEmptyString(enValue) ? enValue : null;
  }
  const amKey = `${field}_am` as F;
  const amValue = entity[amKey];
  if (isNonEmptyString(amValue)) return amValue;
  return isNonEmptyString(enValue) ? enValue : null;
}

/**
 * Same logic as `pickLang` but for the parallel `services` / `services_am`
 * arrays: returns the AM item when present, else the EN item at that index.
 */
export function pickServiceList(
  services: string[] | null | undefined,
  servicesAm: string[] | null | undefined,
  locale: Locale
): string[] {
  const en = services ?? [];
  if (locale !== "am") return en;
  const am = servicesAm ?? [];
  return en.map((enTag, i) => {
    const amTag = am[i];
    return isNonEmptyString(amTag) ? amTag : enTag;
  });
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}
