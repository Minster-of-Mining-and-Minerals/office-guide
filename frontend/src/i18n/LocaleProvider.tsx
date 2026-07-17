"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  dictionary,
  interpolate,
  type DictKey,
  type Locale,
} from "./dictionary";

const COOKIE_NAME = "locale";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // one year
const DEFAULT_LOCALE: Locale = "en";

const readCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
};

const writeCookie = (name: string, value: string) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
};

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<Ctx | null>(null);

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  /** Optional server-side default (SSR-safe). Falls back to `en`. */
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(
    initialLocale ?? DEFAULT_LOCALE
  );

  // Read persisted locale from cookie on mount. Guarded so SSR renders EN
  // by default and we don't get hydration mismatches on Amharic text.
  useEffect(() => {
    const stored = readCookie(COOKIE_NAME);
    if (stored === "en" || stored === "am") {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    writeCookie(COOKIE_NAME, l);
    if (typeof document !== "undefined") {
      document.documentElement.lang = l === "am" ? "am-ET" : "en";
    }
  }, []);

  // Keep <html lang> in sync on mount and whenever locale changes.
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale === "am" ? "am-ET" : "en";
    }
  }, [locale]);

  const t = useCallback(
    (key: DictKey, vars?: Record<string, string | number>) => {
      const template = dictionary[locale][key] ?? dictionary.en[key] ?? key;
      return interpolate(template, vars);
    },
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used inside <LocaleProvider>.");
  }
  return ctx;
}

/** Convenience: `const t = useT();` when you only need translation. */
export function useT() {
  return useContext(LocaleContext)?.t ?? ((key: DictKey) => key);
}
