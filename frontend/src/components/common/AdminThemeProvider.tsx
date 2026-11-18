"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";

/**
 * Day / night mode for the admin panel only.
 *
 * - The admin's choice ("day" | "night" | "auto") is remembered per
 *   browser in localStorage. "auto" follows the OS colour setting.
 * - The resolved mode is written to <html data-admin-mode="…"> while the
 *   admin layout is mounted, and removed when it unmounts, so the public
 *   kiosk and login pages never pick it up. Colours live in globals.css.
 */
export type AdminThemePreference = "day" | "night" | "auto";
export type AdminThemeMode = "day" | "night";

const STORAGE_KEY = "admin-theme";

interface AdminThemeContextValue {
  preference: AdminThemePreference;
  mode: AdminThemeMode;
  setPreference: (p: AdminThemePreference) => void;
}

const AdminThemeContext = createContext<AdminThemeContextValue | null>(null);

// useLayoutEffect on the client (no flash of the wrong mode), no-op on server.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

function readPreference(): AdminThemePreference {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === "day" || v === "night" || v === "auto") return v;
  } catch {
    /* storage blocked: fall through */
  }
  return "auto";
}

function systemMode(): AdminThemeMode {
  return window.matchMedia?.("(prefers-color-scheme: light)").matches
    ? "day"
    : "night";
}

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<AdminThemePreference>("auto");
  const [system, setSystem] = useState<AdminThemeMode>("night");

  useIsoLayoutEffect(() => {
    setPreferenceState(readPreference());
    setSystem(systemMode());
  }, []);

  // Track OS changes while on "auto".
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: light)");
    if (!mq) return;
    const onChange = () => setSystem(mq.matches ? "day" : "night");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const mode: AdminThemeMode = preference === "auto" ? system : preference;

  useIsoLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.adminMode = mode;
    return () => {
      delete root.dataset.adminMode;
    };
  }, [mode]);

  const setPreference = useCallback((p: AdminThemePreference) => {
    setPreferenceState(p);
    try {
      window.localStorage.setItem(STORAGE_KEY, p);
    } catch {
      /* storage blocked: choice lasts for this page view only */
    }
  }, []);

  return (
    <AdminThemeContext.Provider value={{ preference, mode, setPreference }}>
      {children}
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme(): AdminThemeContextValue {
  const ctx = useContext(AdminThemeContext);
  if (!ctx) {
    throw new Error("useAdminTheme must be used inside <AdminThemeProvider>");
  }
  return ctx;
}
