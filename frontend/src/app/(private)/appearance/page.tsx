"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpenIcon,
  CheckCircle2Icon,
  ExternalLinkIcon,
  EyeIcon,
  Loader2Icon,
  MegaphoneIcon,
  Repeat2Icon,
  RotateCcwIcon,
  SaveIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { cn } from "@/lib/utils";
import {
  useGetPublicThemeQuery,
  useResetThemeMutation,
  useUpdateThemeMutation,
  type PublicTheme,
} from "@/redux/api/themeApi";
import {
  useGetAllDisplayModesQuery,
  useResetDisplayModeMutation,
  useUpdateDisplayModeMutation,
} from "@/redux/api/displayModeApi";
import { useGetAllFloorsQuery } from "@/redux/api/floorApi";
import { useGetAllOfficesByFloorQuery } from "@/redux/api/officeApi";
import { useGetPublicAnnouncementsQuery } from "@/redux/api/announcementApi";
import type {
  DisplayMode,
  DisplayModeValue,
  Floor,
} from "@/redux/types/signage";

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

// ─── Display modes ──────────────────────────────────────────────────

const DEFAULT_MODE: DisplayMode = { mode: "guide_only", rotation_seconds: 60 };

const MODE_INFO: Record<
  DisplayModeValue,
  { label: string; description: string; icon: typeof BookOpenIcon }
> = {
  guide_only: {
    label: "Office guide",
    description: "The scrollable office directory. Announcements don’t play.",
    icon: BookOpenIcon,
  },
  announcements_only: {
    label: "Announcements",
    description:
      "Full-screen carousel of images and videos. The directory is hidden.",
    icon: MegaphoneIcon,
  },
  both: {
    label: "Both, alternating",
    description:
      "Switches between the directory and announcements on a timer.",
    icon: Repeat2Icon,
  },
};
const MODE_ORDER: DisplayModeValue[] = [
  "guide_only",
  "announcements_only",
  "both",
];

const rotationValid = (m: DisplayMode) =>
  m.mode !== "both" ||
  (Number.isFinite(m.rotation_seconds) &&
    m.rotation_seconds >= 5 &&
    m.rotation_seconds <= 3600);

/** Two configs differ in a way the kiosk would notice. */
const modeDiffers = (a: DisplayMode, b: DisplayMode) =>
  a.mode !== b.mode ||
  (a.mode === "both" && a.rotation_seconds !== b.rotation_seconds);

const floorShort = (n: number) => (n === 0 ? "G" : String(n));

/** Prefix a stored `/uploads/...` path with the API host so it renders. */
function resolveMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const origin = (process.env.NEXT_PUBLIC_BASE_URL ?? "").replace(/\/api\/?$/, "");
  return `${origin}${path.startsWith("/") ? "" : "/"}${path}`;
}

// ─── Page ───────────────────────────────────────────────────────────

export default function AppearancePage() {
  // Theme
  const { data: serverTheme, isLoading: loadingTheme } = useGetPublicThemeQuery();
  const [updateTheme, updateThemeState] = useUpdateThemeMutation();
  const [resetTheme, resetThemeState] = useResetThemeMutation();
  const [draft, setDraft] = useState<PublicTheme | null>(null);

  // Floors + display modes
  const { data: floorsData, isLoading: loadingFloors } = useGetAllFloorsQuery();
  const floors = useMemo(
    () => [...(floorsData ?? [])].sort((a, b) => a.floor_number - b.floor_number),
    [floorsData]
  );
  const { data: serverModes, isLoading: loadingModes } = useGetAllDisplayModesQuery();
  const [updateModes, updateModesState] = useUpdateDisplayModeMutation();
  const [resetModes, resetModesState] = useResetDisplayModeMutation();
  const [draftModes, setDraftModes] = useState<Record<string, DisplayMode>>({});

  const [previewFloorId, setPreviewFloorId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (serverTheme && !draft) setDraft(serverTheme);
  }, [serverTheme, draft]);

  useEffect(() => {
    if (serverModes) setDraftModes(serverModes);
  }, [serverModes]);

  useEffect(() => {
    if (!previewFloorId && floors.length) setPreviewFloorId(floors[0].floor_id);
  }, [floors, previewFloorId]);

  useEffect(() => {
    if (draft) paintPreview(draft);
  }, [draft]);

  const savedMode = (floorId: string) => serverModes?.[floorId] ?? DEFAULT_MODE;
  const draftMode = (floorId: string) => draftModes[floorId] ?? savedMode(floorId);

  const setFloorMode = (floorId: string, patch: Partial<DisplayMode>) =>
    setDraftModes((prev) => ({
      ...prev,
      [floorId]: { ...(prev[floorId] ?? savedMode(floorId)), ...patch },
    }));

  const setAllFloors = (mode: DisplayModeValue) =>
    setDraftModes((prev) => {
      const next = { ...prev };
      for (const f of floors) {
        next[f.floor_id] = { ...(prev[f.floor_id] ?? savedMode(f.floor_id)), mode };
      }
      return next;
    });

  // ── dirty / validity ──
  const changedFloorIds = floors
    .filter((f) => modeDiffers(draftMode(f.floor_id), savedMode(f.floor_id)))
    .map((f) => f.floor_id);
  const modesDirty = changedFloorIds.length > 0;
  const badRotation = floors.some((f) => !rotationValid(draftMode(f.floor_id)));

  const themeDirty = useMemo(
    () =>
      !!draft &&
      !!serverTheme &&
      FIELD_ORDER.some(
        (k) => draft[k].toUpperCase() !== serverTheme[k].toUpperCase()
      ),
    [draft, serverTheme]
  );
  const invalidFields = useMemo(
    () => (draft ? FIELD_ORDER.filter((k) => !isValidHex(draft[k])) : []),
    [draft]
  );

  const dirty = modesDirty || themeDirty;
  const hasErrors = badRotation || invalidFields.length > 0;
  const saving = updateThemeState.isLoading || updateModesState.isLoading;
  const resetting = resetThemeState.isLoading || resetModesState.isLoading;

  const cardContrast = useMemo(() => {
    if (!draft) return { ratio: 1, tier: "poor" as const };
    const r = contrastRatio(draft.card_text, draft.card_bg);
    const tier: "aaa" | "aa" | "large" | "poor" =
      r >= 7 ? "aaa" : r >= 4.5 ? "aa" : r >= 3 ? "large" : "poor";
    return { ratio: r, tier };
  }, [draft]);

  const activePresetId = draft
    ? PRESETS.find((p) =>
        FIELD_ORDER.every(
          (k) => p.theme[k].toUpperCase() === draft[k].toUpperCase()
        )
      )?.id
    : undefined;

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  // ── actions ──
  const onSave = async () => {
    if (!draft || !dirty || hasErrors) return;
    const errors: string[] = [];
    const done: string[] = [];
    if (modesDirty) {
      try {
        const payload: Record<string, DisplayMode> = {};
        for (const f of floors) payload[f.floor_id] = draftMode(f.floor_id);
        const saved = await updateModes(payload).unwrap();
        setDraftModes(saved);
        done.push("floor settings");
      } catch (err) {
        errors.push(
          (err as { data?: { message?: string } })?.data?.message ??
            "Could not save the floor settings."
        );
      }
    }
    if (themeDirty) {
      try {
        const saved = await updateTheme(draft).unwrap();
        setDraft(saved);
        done.push("theme");
      } catch (err) {
        errors.push(
          (err as { data?: { message?: string } })?.data?.message ??
            "Could not save the theme."
        );
      }
    }
    if (done.length) {
      toast.success(`Saved ${done.join(" and ")}. Open kiosks update now.`);
    }
    errors.forEach((m) => toast.error(m));
  };

  const onDiscard = () => {
    if (serverTheme) setDraft(serverTheme);
    setDraftModes(serverModes ?? {});
  };

  const onResetDefaults = async () => {
    try {
      const [modes, theme] = await Promise.all([
        resetModes().unwrap(),
        resetTheme().unwrap(),
      ]);
      setDraftModes(modes);
      setDraft(theme);
      toast.success(
        "Reset to defaults: every floor shows the office guide, with the Midnight Slate theme."
      );
      setConfirmReset(false);
    } catch {
      toast.error("Could not reset to defaults. Try again.");
    }
  };

  const onFieldChange = (key: keyof PublicTheme, value: string) => {
    let v = value.trim();
    if (v && !v.startsWith("#")) v = `#${v}`;
    setDraft((prev) => (prev ? { ...prev, [key]: v.toUpperCase() } : prev));
  };

  if (loadingTheme || loadingFloors || loadingModes || !draft) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2Icon className="h-6 w-6 animate-spin text-golden-classic" />
      </div>
    );
  }

  const previewFloor =
    floors.find((f) => f.floor_id === previewFloorId) ?? floors[0] ?? null;
  const previewMode = previewFloor ? draftMode(previewFloor.floor_id) : DEFAULT_MODE;

  const unsavedParts = [
    modesDirty &&
      `${changedFloorIds.length} floor${changedFloorIds.length === 1 ? "" : "s"} changed`,
    themeDirty && "theme changed",
  ].filter(Boolean) as string[];

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-4">
      {/* ─── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-golden-classic">Display</h1>
          <p className="text-sm text-white/60 mt-0.5 max-w-2xl">
            What each floor&apos;s kiosk shows and how it looks. Edit on the
            left and check the preview on the right. Kiosks change only when
            you save.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => setConfirmReset(true)}
            disabled={resetting || saving}
          >
            <RotateCcwIcon className="h-4 w-4" />
            Reset to defaults
          </Button>
          {previewFloor && (
            <Button variant="outline" asChild>
              <a
                href={`/floor/${previewFloor.floor_number}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLinkIcon className="h-4 w-4" />
                Open {previewFloor.name} kiosk
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start">
        {/* ─── Left: settings ─────────────────────────────────── */}
        <div className="space-y-5 min-w-0">
          {/* 1. Floors */}
          <section className={panelClass}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-white">
                  1. What each floor shows
                </h2>
                <p className="text-xs text-white/55 mt-0.5">
                  Click the eye to show a floor in the preview.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/55 whitespace-nowrap">
                  Set all floors
                </span>
                <Select
                  value=""
                  onValueChange={(v) => setAllFloors(v as DisplayModeValue)}
                >
                  <SelectTrigger className="w-44" aria-label="Set every floor to">
                    <SelectValue placeholder="Choose a mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODE_ORDER.map((m) => (
                      <SelectItem key={m} value={m}>
                        {MODE_INFO[m].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {floors.length === 0 ? (
              <p className="py-6 text-center text-sm text-white/50">
                No floors yet. Add floors on the Floors page first.
              </p>
            ) : (
              <ul className="space-y-2">
                {floors.map((f) => {
                  const m = draftMode(f.floor_id);
                  const changed = changedFloorIds.includes(f.floor_id);
                  const previewing = previewFloor?.floor_id === f.floor_id;
                  const rotBad = !rotationValid(m);
                  return (
                    <li
                      key={f.floor_id}
                      className={cn(
                        "flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border bg-white/[0.04] px-3 py-2.5",
                        previewing ? "border-golden-classic/70" : "border-white/10",
                        changed && "shadow-[inset_3px_0_0_theme(colors.amber.400)]"
                      )}
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white/10 text-sm font-bold text-white">
                        {floorShort(f.floor_number)}
                      </span>
                      <span className="min-w-[96px] flex-1">
                        <span className="block text-sm font-semibold text-white">
                          {f.name}
                        </span>
                        {f.name_am && (
                          <span className="block text-[11px] text-white/45">
                            {f.name_am}
                          </span>
                        )}
                      </span>
                      <Select
                        value={m.mode}
                        onValueChange={(v) => {
                          setFloorMode(f.floor_id, { mode: v as DisplayModeValue });
                          setPreviewFloorId(f.floor_id);
                        }}
                      >
                        <SelectTrigger
                          className="w-44"
                          aria-label={`What ${f.name} shows`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MODE_ORDER.map((mode) => (
                            <SelectItem key={mode} value={mode}>
                              {MODE_INFO[mode].label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {m.mode === "both" && (
                        <label className="flex items-center gap-1.5 text-xs text-white/55">
                          Guide for
                          <Input
                            type="number"
                            min={5}
                            max={3600}
                            value={Number.isFinite(m.rotation_seconds) ? m.rotation_seconds : ""}
                            onChange={(e) =>
                              setFloorMode(f.floor_id, {
                                rotation_seconds: Number.parseInt(e.target.value, 10),
                              })
                            }
                            aria-label={`Seconds the guide shows on ${f.name}`}
                            aria-invalid={rotBad}
                            className={cn(
                              "h-9 w-20 tabular-nums",
                              rotBad && "border-red-500 focus-visible:ring-red-500"
                            )}
                          />
                          s
                        </label>
                      )}
                      <button
                        type="button"
                        onClick={() => setPreviewFloorId(f.floor_id)}
                        aria-pressed={previewing}
                        aria-label={`Preview ${f.name}`}
                        title={`Preview ${f.name}`}
                        className={cn(
                          "ml-auto rounded-md p-1.5 transition-colors",
                          previewing
                            ? "bg-golden-classic/15 text-golden-classic"
                            : "text-white/40 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      {rotBad && (
                        <p className="basis-full text-[11px] text-red-300">
                          Enter between 5 and 3600 seconds.
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <details className="group">
              <summary className="cursor-pointer text-xs text-white/55 hover:text-white">
                What do the modes mean?
              </summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {MODE_ORDER.map((mode) => {
                  const Icon = MODE_INFO[mode].icon;
                  return (
                    <div key={mode} className="flex gap-2.5">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-golden-classic/15 text-golden-classic">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="text-xs text-white/55">
                        <b className="block text-[13px] font-semibold text-white">
                          {MODE_INFO[mode].label}
                        </b>
                        {MODE_INFO[mode].description}
                      </span>
                    </div>
                  );
                })}
              </div>
            </details>
          </section>

          {/* 2. Theme */}
          <section className={panelClass}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-white">2. Theme</h2>
                <p className="text-xs text-white/55 mt-0.5">
                  Pick a preset, then adjust colours if needed. Applies to every
                  floor.
                </p>
              </div>
              <ReadabilityBadge ratio={cardContrast.ratio} tier={cardContrast.tier} />
            </div>

            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => {
                const on = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setDraft(preset.theme)}
                    aria-pressed={on}
                    title={preset.description}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-[13px] transition-colors",
                      on
                        ? "border-golden-classic bg-golden-classic/10 text-golden-classic"
                        : "border-white/10 bg-white/[0.04] text-white/80 hover:border-white/30"
                    )}
                  >
                    <span className="flex">
                      {[preset.theme.page_bg, preset.theme.card_bg, preset.theme.accent].map(
                        (c, i) => (
                          <span
                            key={i}
                            className={cn(
                              "h-[18px] w-[18px] rounded-full border-2 border-[#0D1F3C]",
                              i > 0 && "-ml-1.5"
                            )}
                            style={{ backgroundColor: c }}
                          />
                        )
                      )}
                    </span>
                    {preset.name}
                  </button>
                );
              })}
            </div>

            <details className="group" open={invalidFields.length > 0 || undefined}>
              <summary className="cursor-pointer text-xs text-white/55 hover:text-white">
                Custom colours
                {!activePresetId && (
                  <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/70">
                    in use
                  </span>
                )}
              </summary>
              <div className="mt-3 space-y-3">
                {FIELD_ORDER.map((key) => {
                  const value = draft[key];
                  const invalid = !isValidHex(value);
                  return (
                    <div
                      key={key}
                      className="grid grid-cols-[40px_minmax(0,1fr)_104px] items-center gap-3"
                    >
                      <input
                        type="color"
                        aria-label={`${FIELD_LABELS[key].label} colour`}
                        value={isValidHex(value) && value.length === 7 ? value : "#000000"}
                        onChange={(e) => onFieldChange(key, e.target.value)}
                        className="h-9 w-10 cursor-pointer rounded-md border border-white/20 bg-transparent p-0"
                      />
                      <Label htmlFor={`color-${key}`} className="block min-w-0">
                        <span className="block text-[13px] font-semibold text-white">
                          {FIELD_LABELS[key].label}
                        </span>
                        <span className="block text-[11px] font-normal text-white/45">
                          {FIELD_LABELS[key].hint}
                        </span>
                      </Label>
                      <Input
                        id={`color-${key}`}
                        value={value}
                        onChange={(e) => onFieldChange(key, e.target.value)}
                        maxLength={7}
                        aria-invalid={invalid}
                        className={cn(
                          "h-9 font-mono uppercase",
                          invalid && "border-red-500 focus-visible:ring-red-500"
                        )}
                      />
                      {invalid && (
                        <p className="col-span-3 -mt-2 text-[11px] text-red-300">
                          Enter a hex code like #F5C518.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </details>
          </section>
        </div>

        {/* ─── Right: live preview ───────────────────────────── */}
        <section className={cn(panelClass, "lg:sticky lg:top-4 min-w-0")}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-white">Live preview</h2>
              {previewFloor && (
                <p className="text-xs text-white/55 mt-0.5">
                  {previewFloor.name}: {MODE_INFO[previewMode.mode].label.toLowerCase()}
                  {previewMode.mode === "both" &&
                    rotationValid(previewMode) &&
                    `, guide for ${previewMode.rotation_seconds}s`}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-1" role="group" aria-label="Floor to preview">
              {floors.map((f) => {
                const on = previewFloor?.floor_id === f.floor_id;
                return (
                  <button
                    key={f.floor_id}
                    type="button"
                    onClick={() => setPreviewFloorId(f.floor_id)}
                    aria-pressed={on}
                    aria-label={`Preview ${f.name}`}
                    className={cn(
                      "min-w-8 rounded-md border px-2 py-1 text-xs font-semibold transition-colors",
                      on
                        ? "border-golden-classic bg-golden-classic/15 text-golden-classic"
                        : "border-white/10 text-white/55 hover:text-white"
                    )}
                  >
                    {floorShort(f.floor_number)}
                  </button>
                );
              })}
            </div>
          </div>

          {previewFloor ? (
            <KioskPreview floor={previewFloor} mode={previewMode} theme={draft} />
          ) : (
            <p className="py-10 text-center text-sm text-white/50">
              Add a floor to see a preview.
            </p>
          )}
          <p className="text-center text-[11px] text-white/45">
            Shows your unsaved changes with this floor&apos;s real offices and
            announcements.
          </p>
        </section>
      </div>

      {/* ─── Save bar ────────────────────────────────────────── */}
      <div
        className={cn(
          "sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur",
          dirty
            ? "border-amber-400/40 bg-[#2a2108]/95"
            : "border-white/10 bg-[#0D1F3C]/95"
        )}
        role="status"
      >
        <span
          className={cn(
            "inline-flex items-center gap-2 text-sm",
            dirty ? "text-amber-300" : "text-white/55"
          )}
        >
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              dirty ? "bg-amber-400" : "bg-emerald-400"
            )}
          />
          {!dirty
            ? "All changes saved. Kiosks are up to date."
            : hasErrors
            ? "Fix the highlighted fields before saving."
            : `Unsaved: ${unsavedParts.join(" and ")}. Kiosks update when you save.`}
        </span>
        <span className="flex items-center gap-2">
          {dirty && (
            <Button variant="ghost" onClick={onDiscard} disabled={saving}>
              Discard
            </Button>
          )}
          <Button
            onClick={onSave}
            disabled={!dirty || hasErrors || saving}
            className="bg-golden-classic hover:bg-golden-soft text-black hover:text-black"
          >
            {saving ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <SaveIcon className="h-4 w-4" />
            )}
            Save all changes
          </Button>
        </span>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset the display to defaults?"
        description="Every floor will show the office guide only, and the theme goes back to Midnight Slate. Open kiosks change straight away."
        confirmLabel="Reset to defaults"
        destructive
        loading={resetting}
        onConfirm={onResetDefaults}
      />
    </div>
  );
}

const panelClass =
  "rounded-xl border border-white/10 bg-[#0D1F3C]/80 p-4 sm:p-5 space-y-4 shadow-xl backdrop-blur";

// ─── Readability badge ─────────────────────────────────────────────

function ReadabilityBadge({
  ratio,
  tier,
}: {
  ratio: number;
  tier: "aaa" | "aa" | "large" | "poor";
}) {
  const label =
    tier === "aaa"
      ? "Excellent"
      : tier === "aa"
      ? "Good"
      : tier === "large"
      ? "Large text only"
      : "Too low";
  const good = tier === "aaa" || tier === "aa";
  return (
    <span
      title="Contrast of card text on the card background"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap",
        good
          ? "bg-emerald-400/15 text-emerald-300"
          : tier === "large"
          ? "bg-amber-400/15 text-amber-300"
          : "bg-red-400/15 text-red-300"
      )}
    >
      {good ? (
        <CheckCircle2Icon className="h-3.5 w-3.5" />
      ) : (
        <TriangleAlertIcon className="h-3.5 w-3.5" />
      )}
      Readability: {label} · {ratio.toFixed(1)}:1
    </span>
  );
}

// ─── Kiosk preview ─────────────────────────────────────────────────
// A scaled-down kiosk screen. Sizes use container-query units (cqw) so
// the whole screen scales with the preview's width.

function KioskPreview({
  floor,
  mode,
  theme,
}: {
  floor: Floor;
  mode: DisplayMode;
  theme: PublicTheme;
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

  let body: React.ReactNode;
  if (mode.mode === "guide_only") body = guide(6);
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
      className="rounded-xl border-[6px] border-[#05080d] shadow-2xl"
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

function PreviewLabel({ children }: { children: React.ReactNode }) {
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
