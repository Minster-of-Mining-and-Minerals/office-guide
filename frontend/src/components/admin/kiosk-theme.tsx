"use client";

/**
 * Shared kiosk-theme helpers for the admin: curated presets, colour checks,
 * the readability badge, and a scaled-down kiosk preview. Used by the
 * Theme page (colours) and the Display page (what each floor shows).
 */
import type { CSSProperties, ReactNode } from "react";
import { useGetAllOfficesByFloorQuery } from "@/redux/api/officeApi";
import { useGetPublicAnnouncementsQuery } from "@/redux/api/announcementApi";
import type { PublicTheme } from "@/redux/api/themeApi";
import type { DisplayMode, Floor } from "@/redux/types/signage";

type ReadabilityTier = "aaa" | "aa" | "large" | "poor";

export function readability(theme: PublicTheme): { ratio: number; tier: ReadabilityTier } {
  const r = contrastRatio(theme.card_text, theme.card_bg);
  return { ratio: r, tier: r >= 7 ? "aaa" : r >= 4.5 ? "aa" : r >= 3 ? "large" : "poor" };
}

/** Preset whose colours exactly match the theme, if any. */
export function matchingPreset(theme: PublicTheme): Preset | undefined {
  return PRESETS.find((p) =>
    FIELD_ORDER.every((k) => p.theme[k].toUpperCase() === theme[k].toUpperCase())
  );
}

const floorShort = (n: number) => (n === 0 ? "G" : String(n));

/** Prefix a stored `/uploads/...` path with the API host so it renders. */
function resolveMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const origin = (process.env.NEXT_PUBLIC_BASE_URL ?? "").replace(/\/api\/?$/, "");
  return `${origin}${path.startsWith("/") ? "" : "/"}${path}`;
}

// ─── Curated presets ────────────────────────────────────────────────
// Each preset is a complete theme so light+dark can never end up on the
// same card (e.g. dark text on dark bg). Users can still fine-tune any
// field manually after picking a preset.
export type Preset = {
  id: string;
  name: string;
  description: string;
  theme: PublicTheme;
};

export const PRESETS: Preset[] = [
  {
    id: "midnight-slate",
    name: "Midnight Slate",
    description: "Default. Dark slate card, near-black background.",
    theme: {
      page_bg: "#0F172A",
      card_bg: "#1E293B",
      card_text: "#F1F5F9",
      accent: "#FFBF00",
      accent_dark: "#7A5A1C",
    },
  },
  {
    id: "warm-cream",
    name: "Warm Cream",
    description: "Soft parchment card on the dark hero — cozy & readable.",
    theme: {
      page_bg: "#14100a",
      card_bg: "#FFF6E5",
      card_text: "#4a3315",
      accent: "#C9A55A",
      accent_dark: "#4a3315",
    },
  },
  {
    id: "antique-parchment",
    name: "Antique Parchment",
    description: "Aged paper feel with deeper gold accents.",
    theme: {
      page_bg: "#14100a",
      card_bg: "#F4E3B8",
      card_text: "#4a3315",
      accent: "#B08828",
      accent_dark: "#3a2810",
    },
  },
  {
    id: "midnight-gold",
    name: "Midnight Gold",
    description: "Deep charcoal card with warm gold — matches the header.",
    theme: {
      page_bg: "#14100a",
      card_bg: "#1a1409",
      card_text: "#F5E6B0",
      accent: "#F5C518",
      accent_dark: "#F5C518",
    },
  },
  {
    id: "deep-ocean",
    name: "Deep Ocean",
    description: "Cool slate card with sky-blue accents.",
    theme: {
      page_bg: "#0b1220",
      card_bg: "#1e293b",
      card_text: "#E5E7EB",
      accent: "#38BDF8",
      accent_dark: "#38BDF8",
    },
  },
  {
    id: "forest-emerald",
    name: "Forest Emerald",
    description: "Rich green card on a night-forest background.",
    theme: {
      page_bg: "#06170f",
      card_bg: "#14342A",
      card_text: "#ECFDF5",
      accent: "#34D399",
      accent_dark: "#34D399",
    },
  },
  {
    id: "royal-amethyst",
    name: "Royal Amethyst",
    description: "Regal purple card, gentle on the eyes at distance.",
    theme: {
      page_bg: "#0F0A1C",
      card_bg: "#241A3A",
      card_text: "#F3E8FF",
      accent: "#C084FC",
      accent_dark: "#C084FC",
    },
  },
  {
    id: "snow-white",
    name: "Snow White",
    description: "Bright white card with golden accents.",
    theme: {
      page_bg: "#14100a",
      card_bg: "#FFFFFF",
      card_text: "#7A5A1C",
      accent: "#F5C518",
      accent_dark: "#7A5A1C",
    },
  },
];

// ─── Helpers ────────────────────────────────────────────────────────

export const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
export const isValidHex = (v: string) => HEX.test(v.trim());

export const FIELD_LABELS: Record<
  keyof PublicTheme,
  { label: string; hint: string }
> = {
  page_bg: {
    label: "Page background",
    hint: "The surface behind the office cards.",
  },
  card_bg: {
    label: "Card background",
    hint: "The color of each office card.",
  },
  card_text: {
    label: "Card text",
    hint: "Needs strong contrast with the card.",
  },
  accent: {
    label: "Accent",
    hint: "Room tiles, pills and borders.",
  },
  accent_dark: {
    label: "Deep accent",
    hint: "Room numbers on the accent tiles.",
  },
};

export const FIELD_ORDER: (keyof PublicTheme)[] = [
  "card_bg",
  "card_text",
  "accent",
  "accent_dark",
  "page_bg",
];

/** hex → `r g b` for `rgb(... / alpha)` overlays. */
export function hexToRgbTriple(hex: string): string {
  const clean = hex.replace(/^#/, "");
  const full =
    clean.length === 3
      ? clean.split("").map((c) => c + c).join("")
      : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return "0 0 0";
  return `${r} ${g} ${b}`;
}

/** WCAG relative luminance for one sRGB channel. */
function channelLum(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgbTriple(hex).split(" ").map(Number);
  return (
    0.2126 * channelLum(r) +
    0.7152 * channelLum(g) +
    0.0722 * channelLum(b)
  );
}

/** WCAG contrast ratio. 1 = same color, 21 = black-on-white. */
export function contrastRatio(fg: string, bg: string): number {
  if (!isValidHex(fg) || !isValidHex(bg)) return 1;
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/** Pick a high-contrast label color for a swatch based on its background. */
export function textOn(bg: string): string {
  return luminance(bg) > 0.5 ? "#111827" : "#F8FAFC";
}

/**
 * Local mirror of `applyTheme` from ThemeProvider — used to preview any
 * unsaved edits live on the whole page. The ThemeProvider will re-apply
 * on refetch once the user hits Save.
 */
export function paintPreview(theme: PublicTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  (Object.entries(theme) as [keyof PublicTheme, string][]).forEach(
    ([k, v]) => {
      const key = k.replace(/_/g, "-");
      root.style.setProperty(`--kiosk-${key}`, v);
      root.style.setProperty(`--kiosk-${key}-rgb`, hexToRgbTriple(v));
    }
  );
}

// ─── Readability badge ─────────────────────────────────────────────

export function ReadabilityBadge({
  ratio,
  tier,
}: {
  ratio: number;
  tier: ReadabilityTier;
}) {
  const label =
    tier === "aaa"
      ? "Excellent"
      : tier === "aa"
      ? "Good"
      : tier === "large"
      ? "Large text only"
      : "Too low";
  const tone = tier === "aaa" || tier === "aa" ? "ok" : tier === "large" ? "warn" : "bad";
  return (
    <span
      title="Contrast of card text on the card background"
      className="admin-status-pill inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap"
      style={{ "--tone": `var(--a-${tone})` } as CSSProperties}
    >
      Readability: {label} · {ratio.toFixed(1)}:1
    </span>
  );
}

// ─── Kiosk preview ─────────────────────────────────────────────────
// A scaled-down kiosk screen. Sizes use container-query units (cqw) so
// the whole screen scales with the preview's width.

export function KioskPreview({
  floor,
  mode = { mode: "guide_only", rotation_seconds: 60 },
  theme,
  view = "list",
  compact = false,
}: {
  floor: Floor;
  /** What the floor shows; defaults to the office guide. */
  mode?: DisplayMode;
  theme: PublicTheme;
  /** "detail" shows one office's full card, as when a visitor taps it. */
  view?: "list" | "detail";
  /** Small thumbnail: no frame, two office cards. */
  compact?: boolean;
}) {
  const { data: offices = [] } = useGetAllOfficesByFloorQuery(floor.floor_id);
  const { data: annData } = useGetPublicAnnouncementsQuery({
    floor_id: floor.floor_id,
  });
  const announcement = annData?.announcements?.[0] ?? null;
  const pageText = textOn(theme.page_bg);

  const guide = (cards: number) => (
    <div
      style={{
        padding: "2.4cqw 3cqw",
        display: "grid",
        gap: "1.8cqw",
        alignContent: "start",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          color: pageText,
          fontSize: "3.4cqw",
          fontWeight: 700,
          lineHeight: 1.1,
          display: "flex",
          gap: "1.4cqw",
          alignItems: "baseline",
        }}
      >
        {floor.name}
        {floor.name_am && (
          <span style={{ fontSize: "2.2cqw", opacity: 0.65 }}>{floor.name_am}</span>
        )}
      </div>
      {offices.length === 0 ? (
        <div style={{ color: pageText, opacity: 0.6, fontSize: "2cqw" }}>
          No offices on this floor yet.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "1.6cqw",
          }}
        >
          {offices.slice(0, cards).map((o) => (
            <div
              key={o.office_id}
              style={{
                background: theme.card_bg,
                color: theme.card_text,
                borderRadius: "1.4cqw",
                border: `0.2cqw solid ${theme.accent}4D`,
                display: "flex",
                gap: "1.4cqw",
                alignItems: "center",
                padding: "1.3cqw",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: "7cqw",
                  height: "7cqw",
                  flexShrink: 0,
                  borderRadius: "1.2cqw",
                  display: "grid",
                  placeItems: "center",
                  alignContent: "center",
                  background: `linear-gradient(135deg, color-mix(in oklab, ${theme.accent} 45%, white 55%), ${theme.accent})`,
                  color: theme.accent_dark,
                  fontWeight: 800,
                  fontSize: "2.3cqw",
                  lineHeight: 1,
                }}
              >
                <span
                  style={{
                    fontSize: "1cqw",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    opacity: 0.8,
                  }}
                >
                  Office
                </span>
                {o.room_number}
              </div>
              <div
                style={{
                  fontSize: "1.8cqw",
                  fontWeight: 600,
                  lineHeight: 1.2,
                  minWidth: 0,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {o.name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const media = resolveMediaUrl(announcement?.media_url);
  const ann = (
    <div
      style={{
        position: "relative",
        flex: 1,
        minHeight: 0,
        display: "flex",
        alignItems: "flex-end",
        background: "#000",
        overflow: "hidden",
      }}
    >
      {announcement && announcement.media_type === "image" && media ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={media}
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : announcement && announcement.media_type === "video" && media ? (
        <video
          src={media}
          muted
          playsInline
          preload="metadata"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : null}
      <div
        style={{
          position: "relative",
          padding: "3cqw",
          width: "100%",
          color: "#fff",
          background: "linear-gradient(to top, rgba(0,0,0,0.65), transparent)",
          fontSize: announcement ? "2.6cqw" : "2cqw",
          fontWeight: 700,
        }}
      >
        {announcement
          ? announcement.title
          : "No announcements are scheduled for this floor right now."}
      </div>
    </div>
  );

  const office = offices[0];
  const detail = (
    <div
      style={{
        flex: 1,
        padding: "3cqw",
        display: "grid",
        gridTemplateColumns: "1.1fr 1fr",
        gap: "3cqw",
        minHeight: 0,
      }}
    >
      <div
        style={{
          background: theme.card_bg,
          color: theme.card_text,
          borderRadius: "1.8cqw",
          padding: "2.6cqw",
          display: "grid",
          gap: "1.4cqw",
          alignContent: "start",
          border: `0.2cqw solid ${theme.accent}4D`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "10cqw",
            height: "10cqw",
            borderRadius: "1.4cqw",
            display: "grid",
            placeItems: "center",
            alignContent: "center",
            background: `linear-gradient(135deg, color-mix(in oklab, ${theme.accent} 45%, white 55%), ${theme.accent})`,
            color: theme.accent_dark,
            fontWeight: 800,
            fontSize: "3.2cqw",
            lineHeight: 1,
          }}
        >
          <span style={{ fontSize: "1.2cqw", letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.8 }}>
            Office
          </span>
          {office?.room_number ?? "—"}
        </div>
        <div style={{ fontSize: "3.2cqw", fontWeight: 700, lineHeight: 1.15 }}>
          {office?.name ?? "No offices on this floor yet"}
        </div>
        {office?.name_am && (
          <div style={{ fontSize: "2.2cqw", opacity: 0.75 }}>{office.name_am}</div>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1cqw" }}>
          {(office?.services ?? []).slice(0, 4).map((s) => (
            <span
              key={s}
              style={{
                fontSize: "1.6cqw",
                padding: "0.5cqw 1.4cqw",
                borderRadius: "99px",
                background: `${theme.accent}29`,
                border: `0.15cqw solid ${theme.accent}4D`,
              }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
      <div
        style={{
          borderRadius: "1.8cqw",
          border: `0.2cqw dashed ${theme.accent}66`,
          display: "grid",
          placeItems: "center",
          color: pageText,
          fontSize: "1.8cqw",
          textAlign: "center",
          padding: "2cqw",
        }}
      >
        <div style={{ display: "grid", gap: "1.4cqw", justifyItems: "center" }}>
          <span
            style={{
              display: "grid",
              placeItems: "center",
              width: "6cqw",
              height: "6cqw",
              borderRadius: "50%",
              background: theme.accent,
              color: theme.accent_dark,
              fontSize: "2.4cqw",
              fontWeight: 700,
            }}
          >
            {floorShort(floor.floor_number)}
          </span>
          {office ? `Room ${office.room_number}, ${floor.name}` : floor.name}
        </div>
      </div>
    </div>
  );

  let body: ReactNode;
  if (view === "detail") body = detail;
  else if (compact) body = guide(2);
  else if (mode.mode === "guide_only") body = guide(6);
  else if (mode.mode === "announcements_only") body = ann;
  else
    body = (
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: 0 }}>
        <div style={{ position: "relative", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", paddingTop: "4cqw" }}>
          <PreviewLabel>Guide · {mode.rotation_seconds}s</PreviewLabel>
          {guide(2)}
        </div>
        <div style={{ position: "relative", display: "flex", flexDirection: "column", minHeight: 0, borderLeft: "0.3cqw dashed rgba(255,255,255,0.35)" }}>
          <PreviewLabel>Announcements</PreviewLabel>
          {ann}
        </div>
      </div>
    );

  return (
    <div
      className={compact ? "rounded-md" : "rounded-xl border-[6px] border-[#05080d] shadow-2xl"}
      style={{ containerType: "inline-size" }}
    >
      <div
        style={{
          aspectRatio: "16 / 9",
          width: "100%",
          background: theme.page_bg,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: "6px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.4cqw",
            padding: "1.6cqw 3cqw",
            background: "rgba(0,0,0,0.25)",
            color: pageText,
            fontSize: "2cqw",
            fontWeight: 600,
          }}
        >
          <span
            style={{
              width: "2.8cqw",
              height: "2.8cqw",
              borderRadius: "50%",
              background: "radial-gradient(circle at 35% 35%, #ffe28a, #c79410)",
            }}
          />
          Ministry of Mines
          <span style={{ marginLeft: "auto", opacity: 0.7 }}>
            {floorShort(floor.floor_number)}
          </span>
        </div>
        {body}
      </div>
    </div>
  );
}

function PreviewLabel({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        position: "absolute",
        top: "1.2cqw",
        left: "1.2cqw",
        zIndex: 2,
        background: "rgba(0,0,0,0.6)",
        color: "#fff",
        fontSize: "1.5cqw",
        fontWeight: 600,
        padding: "0.4cqw 1.2cqw",
        borderRadius: "99px",
      }}
    >
      {children}
    </span>
  );
}
