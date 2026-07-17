"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2Icon,
  Loader2Icon,
  MapPinIcon,
  PaletteIcon,
  RotateCcwIcon,
  SaveIcon,
  SparklesIcon,
  TriangleAlertIcon,
  UserIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  useGetPublicThemeQuery,
  useResetThemeMutation,
  useUpdateThemeMutation,
  type PublicTheme,
} from "@/redux/api/themeApi";

// ─── Curated presets ────────────────────────────────────────────────
// Each preset is a complete theme so light+dark can never end up on the
// same card (e.g. dark text on dark bg). Users can still fine-tune any
// field manually after picking a preset.
type Preset = {
  id: string;
  name: string;
  description: string;
  theme: PublicTheme;
};

const PRESETS: Preset[] = [
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

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const isValidHex = (v: string) => HEX.test(v.trim());

const FIELD_LABELS: Record<
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
    hint: "Text on top of the card — needs strong contrast.",
  },
  accent: {
    label: "Accent",
    hint: "Pills, borders, hover glow. Usually a warm gold.",
  },
  accent_dark: {
    label: "Deep accent",
    hint: "Room-number labels & strong text on accent tiles.",
  },
};

const FIELD_ORDER: (keyof PublicTheme)[] = [
  "card_bg",
  "card_text",
  "accent",
  "accent_dark",
  "page_bg",
];

/** hex → `r g b` for `rgb(... / alpha)` overlays. */
function hexToRgbTriple(hex: string): string {
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
function contrastRatio(fg: string, bg: string): number {
  if (!isValidHex(fg) || !isValidHex(bg)) return 1;
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/** Pick a high-contrast label color for a swatch based on its background. */
function textOn(bg: string): string {
  return luminance(bg) > 0.5 ? "#111827" : "#F8FAFC";
}

/**
 * Local mirror of `applyTheme` from ThemeProvider — used to preview any
 * unsaved edits live on the whole page. The ThemeProvider will re-apply
 * on refetch once the user hits Save.
 */
function paintPreview(theme: PublicTheme) {
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

// ─── Page ───────────────────────────────────────────────────────────

export default function AppearancePage() {
  const { data: serverTheme, isLoading } = useGetPublicThemeQuery();
  const [updateTheme, updateState] = useUpdateThemeMutation();
  const [resetTheme, resetState] = useResetThemeMutation();

  const [draft, setDraft] = useState<PublicTheme | null>(null);

  useEffect(() => {
    if (serverTheme && !draft) setDraft(serverTheme);
  }, [serverTheme, draft]);

  useEffect(() => {
    if (draft) paintPreview(draft);
  }, [draft]);

  const dirty = useMemo(() => {
    if (!draft || !serverTheme) return false;
    return FIELD_ORDER.some((k) => draft[k] !== serverTheme[k]);
  }, [draft, serverTheme]);

  const invalidFields = useMemo(() => {
    if (!draft) return [] as (keyof PublicTheme)[];
    return FIELD_ORDER.filter((k) => !isValidHex(draft[k]));
  }, [draft]);

  const canSave = draft !== null && dirty && invalidFields.length === 0;

  // WCAG contrast for the card text vs card bg — most important pair.
  const cardContrast = useMemo(() => {
    if (!draft) return { ratio: 1, tier: "poor" as const };
    const r = contrastRatio(draft.card_text, draft.card_bg);
    const tier: "aaa" | "aa" | "large" | "poor" =
      r >= 7 ? "aaa" : r >= 4.5 ? "aa" : r >= 3 ? "large" : "poor";
    return { ratio: r, tier };
  }, [draft]);

  const onPickPreset = (preset: Preset) => setDraft(preset.theme);

  const onFieldChange = (key: keyof PublicTheme, value: string) =>
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));

  const onSave = async () => {
    if (!draft) return;
    if (invalidFields.length > 0) {
      toast.error(
        `Fix invalid colors: ${invalidFields
          .map((f) => FIELD_LABELS[f].label)
          .join(", ")}`
      );
      return;
    }
    try {
      const saved = await updateTheme(draft).unwrap();
      setDraft(saved);
      toast.success(
        "Appearance updated. Open tabs will refresh automatically."
      );
    } catch (err) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ??
        "Could not save the theme.";
      toast.error(msg);
    }
  };

  const onReset = async () => {
    try {
      const restored = await resetTheme().unwrap();
      setDraft(restored);
      toast.success("Theme reset to defaults.");
    } catch {
      toast.error("Could not reset the theme.");
    }
  };

  const onRevert = () => {
    if (serverTheme) setDraft(serverTheme);
  };

  if (isLoading || !draft) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2Icon className="h-6 w-6 animate-spin text-golden-dark" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ─── Header ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-golden-classic/30 bg-gradient-to-br from-golden-metallic/70 via-white to-golden-metallic/40 p-6 shadow-sm">
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-30 blur-2xl"
          style={{ background: "radial-gradient(circle,#F5C518 0%,transparent 70%)" }}
        />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-xl bg-white border border-golden-classic/40 flex items-center justify-center text-golden-dark shadow-sm">
              <PaletteIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-golden-dark">
                Appearance
              </h1>
              <p className="mt-1 text-sm text-muted-foreground max-w-xl">
                Pick a preset, or fine-tune the colors used on the public
                office guide. Changes go live instantly on any open tab.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={onRevert}
              disabled={!dirty}
              className="border-golden-classic/40 text-golden-dark"
            >
              Revert
            </Button>
            <Button
              variant="outline"
              onClick={onReset}
              disabled={resetState.isLoading}
              className="border-golden-classic/40 text-golden-dark"
            >
              {resetState.isLoading ? (
                <Loader2Icon className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcwIcon className="h-4 w-4" />
              )}
              Reset defaults
            </Button>
            <Button
              onClick={onSave}
              disabled={!canSave || updateState.isLoading}
              className="bg-golden-dark hover:bg-golden-darkHover text-primary-foreground shadow-md"
            >
              {updateState.isLoading ? (
                <Loader2Icon className="h-4 w-4 animate-spin" />
              ) : (
                <SaveIcon className="h-4 w-4" />
              )}
              Save changes
            </Button>
          </div>
        </div>

        {dirty && (
          <div className="relative mt-4 inline-flex items-center gap-2 rounded-full bg-amber-100 border border-amber-300 text-amber-900 px-3 py-1 text-[11px] font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            Unsaved changes — remember to click Save.
          </div>
        )}
      </div>

      {/* ─── Presets ───────────────────────────────────────────── */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-golden-dark/70">
            Curated presets
          </h2>
          <span className="text-[11px] text-muted-foreground">
            {PRESETS.length} to choose from
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {PRESETS.map((preset) => {
            const active =
              draft.card_bg === preset.theme.card_bg &&
              draft.page_bg === preset.theme.page_bg &&
              draft.accent === preset.theme.accent;
            // Pick a legible text color per swatch to avoid the previous
            // low-contrast "card_bg on page_bg" gotcha.
            const nameColor = textOn(preset.theme.page_bg);
            return (
              <button
                key={preset.id}
                onClick={() => onPickPreset(preset)}
                className={cn(
                  "group relative text-left rounded-2xl border p-3 transition-all hover:-translate-y-0.5 hover:shadow-lg",
                  active
                    ? "border-golden-classic ring-2 ring-golden-classic/40 shadow-md"
                    : "border-golden-classic/25 hover:border-golden-classic/60"
                )}
                style={{ backgroundColor: preset.theme.page_bg }}
              >
                {active && (
                  <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-golden-classic text-golden-dark flex items-center justify-center shadow-sm">
                    <CheckCircle2Icon className="h-3.5 w-3.5" />
                  </span>
                )}
                <div
                  className="h-16 rounded-xl border shadow-inner flex items-center justify-center text-xs font-semibold"
                  style={{
                    backgroundColor: preset.theme.card_bg,
                    color: preset.theme.card_text,
                    borderColor: `${preset.theme.accent}66`,
                  }}
                >
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: preset.theme.accent,
                      color: preset.theme.accent_dark,
                    }}
                  >
                    Aa
                  </span>
                </div>
                <p
                  className="mt-2 text-xs font-semibold"
                  style={{ color: nameColor }}
                >
                  {preset.name}
                </p>
                <p
                  className="mt-0.5 text-[10px] leading-snug"
                  style={{ color: nameColor, opacity: 0.7 }}
                >
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* ─── Pickers + Live Preview ────────────────────────────── */}
      <section className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-6 items-start">
        {/* Pickers */}
        <div className="rounded-2xl border border-golden-classic/25 bg-white p-5 space-y-5 shadow-sm">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-golden-dark/70">
                Fine-tune colors
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Every field takes a hex code like <code>#F5C518</code>.
              </p>
            </div>
            <ContrastBadge
              ratio={cardContrast.ratio}
              tier={cardContrast.tier}
            />
          </div>

          {FIELD_ORDER.map((key) => {
            const value = draft[key];
            const invalid = !isValidHex(value);
            return (
              <div key={key}>
                <div className="flex items-baseline justify-between">
                  <Label
                    htmlFor={`color-${key}`}
                    className="text-xs font-semibold text-golden-dark uppercase tracking-wider"
                  >
                    {FIELD_LABELS[key].label}
                  </Label>
                  {/* Small swatch chip so a glance shows what's set */}
                  {isValidHex(value) && (
                    <span
                      className="inline-block h-3.5 w-3.5 rounded border border-golden-classic/40 shadow-inner"
                      style={{ backgroundColor: value }}
                    />
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 mb-2">
                  {FIELD_LABELS[key].hint}
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    aria-label={`${FIELD_LABELS[key].label} picker`}
                    value={isValidHex(value) ? value : "#000000"}
                    onChange={(e) => onFieldChange(key, e.target.value)}
                    className="h-10 w-14 rounded-md border border-golden-classic/40 bg-transparent cursor-pointer p-0"
                  />
                  <Input
                    id={`color-${key}`}
                    value={value}
                    onChange={(e) => onFieldChange(key, e.target.value)}
                    className={cn(
                      "font-mono uppercase tracking-wide",
                      invalid && "border-red-500 focus-visible:ring-red-500"
                    )}
                    maxLength={7}
                  />
                </div>
                {invalid && (
                  <p className="text-[11px] text-red-600 mt-1">
                    Enter a hex like <code>#ffffff</code>.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Live preview — sticky on wide viewports */}
        <div className="lg:sticky lg:top-6 space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-golden-dark/70">
              Live preview
            </h2>
            <span className="text-[11px] text-muted-foreground">
              Updates as you type
            </span>
          </div>
          <div
            className="rounded-2xl p-6 border border-golden-classic/25 shadow-inner space-y-4"
            style={{ backgroundColor: draft.page_bg }}
          >
            <PreviewCard theme={draft} variant="primary" />
            <PreviewCard theme={draft} variant="secondary" />
            <p
              className="text-[11px] text-center"
              style={{ color: textOn(draft.page_bg), opacity: 0.55 }}
            >
              Two cards shown so you can judge density. Click Save to apply
              everywhere.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Contrast badge ────────────────────────────────────────────────

function ContrastBadge({
  ratio,
  tier,
}: {
  ratio: number;
  tier: "aaa" | "aa" | "large" | "poor";
}) {
  const label =
    tier === "aaa"
      ? "AAA"
      : tier === "aa"
        ? "AA"
        : tier === "large"
          ? "Large only"
          : "Low";
  const good = tier === "aaa" || tier === "aa";
  return (
    <span
      title={`Card text on card background: ${ratio.toFixed(2)}:1`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold whitespace-nowrap",
        good
          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
          : tier === "large"
            ? "bg-amber-50 border-amber-200 text-amber-700"
            : "bg-red-50 border-red-200 text-red-700"
      )}
    >
      {good ? (
        <CheckCircle2Icon className="h-3 w-3" />
      ) : (
        <TriangleAlertIcon className="h-3 w-3" />
      )}
      Contrast · {label} · {ratio.toFixed(1)}:1
    </span>
  );
}

// ─── Preview card ──────────────────────────────────────────────────

function PreviewCard({
  theme,
  variant,
}: {
  theme: PublicTheme;
  variant: "primary" | "secondary";
}) {
  const accent = theme.accent;
  const accentRgb = hexToRgbTriple(theme.accent);
  const textRgb = hexToRgbTriple(theme.card_text);
  const isPrimary = variant === "primary";

  return (
    <div
      className="rounded-2xl border overflow-hidden shadow-lg shadow-black/25"
      style={{
        backgroundColor: theme.card_bg,
        color: theme.card_text,
        borderColor: `rgb(${accentRgb} / 0.25)`,
      }}
    >
      <div
        className="h-1 w-full"
        style={{
          background: `linear-gradient(to right, ${accent}, color-mix(in oklab, ${accent} 40%, white 60%), ${accent})`,
        }}
      />
      <div className="flex items-start gap-4 p-5 pb-3">
        <div
          className="shrink-0 h-[72px] w-[72px] rounded-2xl border flex flex-col items-center justify-center shadow-md"
          style={{
            background: `linear-gradient(135deg, color-mix(in oklab, ${accent} 45%, white 55%), color-mix(in oklab, ${accent} 15%, white 85%), ${accent})`,
            borderColor: `rgb(${accentRgb} / 0.6)`,
            color: theme.accent_dark,
          }}
        >
          <span className="text-[9px] font-semibold uppercase tracking-widest leading-none opacity-80">
            Office
          </span>
          <span className="mt-1 text-xl font-bold tabular-nums leading-none">
            {isPrimary ? "504" : "512"}
          </span>
        </div>
        <div className="flex-1 pt-1 min-w-0">
          <p className="text-lg font-semibold leading-snug break-words">
            {isPrimary ? "Reception & Wayfinding Desk" : "የመዝገብ ቤት አገልግሎት"}
          </p>
        </div>
      </div>

      <div className="px-5 pb-3 flex flex-wrap gap-1.5">
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
          style={{ backgroundColor: accent, color: theme.accent_dark }}
        >
          <MapPinIcon className="h-3 w-3" />5
        </span>
        {isPrimary && (
          <div
            className="inline-flex items-center gap-1.5 rounded-2xl border pl-1.5 pr-2.5 py-1 text-[11px] font-medium"
            style={{
              backgroundColor: `rgb(${accentRgb} / 0.12)`,
              borderColor: `rgb(${accentRgb} / 0.25)`,
            }}
          >
            <span
              className="h-5 w-5 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `rgb(${accentRgb} / 0.4)` }}
            >
              <UserIcon className="h-3 w-3" />
            </span>
            Ato Bekele
          </div>
        )}
      </div>

      <div
        className="mx-5 h-px"
        style={{
          background: `linear-gradient(to right, transparent, rgb(${textRgb} / 0.2), transparent)`,
        }}
      />

      <div className="px-5 py-4">
        <div className="flex items-center gap-1.5 mb-2.5">
          <SparklesIcon className="h-3.5 w-3.5" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em]">
            Services
          </span>
          <span className="ml-auto text-[10px] tabular-nums opacity-60">
            {isPrimary ? 3 : 4}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(isPrimary
            ? ["Directions", "Visitor pass", "General info"]
            : ["Records", "የመዝገብ ተግባር", "Filing", "Certificates"]
          ).map((s) => (
            <span
              key={s}
              className="inline-flex items-center rounded-2xl border px-2.5 py-1 text-[11px] font-medium"
              style={{
                backgroundColor: `rgb(${accentRgb} / 0.15)`,
                borderColor: `rgb(${accentRgb} / 0.3)`,
              }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
