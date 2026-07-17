"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";

import {
  useGetPublicThemeQuery,
  type PublicTheme,
} from "@/redux/api/themeApi";

/**
 * Hard-coded fallback used on the very first render (before the API resolves)
 * and if the theme endpoint fails. MUST stay in sync with the backend's
 * `DEFAULT_THEME` (`backend/controllers/settingsController.js`) so users
 * never see a jarring flash of untuned colors.
 */
const FALLBACK_THEME: PublicTheme = {
  // Kiosk-matching defaults — see the identical `DEFAULT_THEME` block in
  // `backend/controllers/settingsController.js` for the rationale on each
  // choice.
  page_bg: "#0F172A",
  card_bg: "#1E293B",
  card_text: "#F1F5F9",
  accent: "#FFBF00",
  accent_dark: "#7A5A1C",
};

/**
 * Convert a hex string like `#F5C518` to a Tailwind-friendly `r g b` triple
 * so consumers can compose colors with alpha inline via
 * `rgb(var(--kiosk-accent) / 0.4)` in arbitrary values.
 */
function hexToRgbTriple(hex: string): string {
  const clean = hex.replace(/^#/, "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return "0 0 0";
  }
  return `${r} ${g} ${b}`;
}

/**
 * Apply the given theme to `document.documentElement` as CSS custom
 * properties. Both `--kiosk-<key>` (hex) and `--kiosk-<key>-rgb` (space
 * separated RGB triple) variants are set so callers can use either
 * `color: var(--kiosk-accent)` or `background: rgb(var(--kiosk-accent-rgb) / 0.2)`.
 */
function applyTheme(theme: PublicTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const entries = Object.entries(theme) as [keyof PublicTheme, string][];
  for (const [key, val] of entries) {
    const cssKey = key.replace(/_/g, "-");
    root.style.setProperty(`--kiosk-${cssKey}`, val);
    root.style.setProperty(`--kiosk-${cssKey}-rgb`, hexToRgbTriple(val));
  }
}

/**
 * Mount once at the root of every public page (office guide + kiosk). It:
 *   1. Applies `FALLBACK_THEME` immediately (prevents FOUC).
 *   2. Fetches the real theme from `/api/public/theme` and re-applies.
 *   3. Listens on the shared signage socket so any admin edit flows to
 *      already-open tabs without a manual reload.
 *
 * Renders `children` unchanged — it's purely a side-effect boundary.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data, refetch } = useGetPublicThemeQuery();

  // Paint fallback vars on the very first client render so nothing flashes.
  useEffect(() => {
    applyTheme(FALLBACK_THEME);
  }, []);

  // Re-apply whenever the RTK cache updates.
  useEffect(() => {
    if (data) applyTheme(data);
  }, [data]);

  // Refetch on live signage events (theme scope OR content — cheap to refetch).
  const socketRef = useRef<Socket | null>(null);
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
    const origin = base.replace(/\/api\/?$/, "") || undefined;
    const socket = io(origin, {
      transports: ["websocket", "polling"],
      path: "/socket.io",
    });
    socketRef.current = socket;
    const onUpdate = (payload: { scope?: string } | undefined) => {
      // Only refetch on theme events; other scopes leave the theme untouched
      // and refetching here would race with per-page queries needlessly.
      if (!payload || payload.scope === "theme") refetch();
    };
    socket.on("signage:content:updated", onUpdate);
    return () => {
      socket.off("signage:content:updated", onUpdate);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [refetch]);

  return <>{children}</>;
}

export { FALLBACK_THEME };
