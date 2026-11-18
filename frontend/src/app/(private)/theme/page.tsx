"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckIcon,
  ExternalLinkIcon,
  Loader2Icon,
  RotateCcwIcon,
  SaveIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { cn } from "@/lib/utils";
import {
  FIELD_LABELS,
  FIELD_ORDER,
  KioskPreview,
  PRESETS,
  ReadabilityBadge,
  isValidHex,
  matchingPreset,
  readability,
} from "@/components/admin/kiosk-theme";
import {
  useGetPublicThemeQuery,
  useResetThemeMutation,
  useUpdateThemeMutation,
  type PublicTheme,
} from "@/redux/api/themeApi";
import { useGetAllFloorsQuery } from "@/redux/api/floorApi";

const panelClass =
  "rounded-xl border border-admin-border bg-admin-surface/80 p-4 sm:p-5 space-y-4 shadow-xl backdrop-blur";

/**
 * Theme — the colours every floor kiosk uses. Presets are shown as real
 * kiosk thumbnails (gallery), with custom colours and a large preview
 * underneath. Saving pushes the theme to all open kiosks.
 */
export default function ThemePage() {
  const { data: serverTheme, isLoading } = useGetPublicThemeQuery();
  const [updateTheme, updateState] = useUpdateThemeMutation();
  const [resetTheme, resetState] = useResetThemeMutation();
  const { data: floorsData } = useGetAllFloorsQuery();

  const [draft, setDraft] = useState<PublicTheme | null>(null);
  const [view, setView] = useState<"list" | "detail">("list");
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (serverTheme && !draft) setDraft(serverTheme);
  }, [serverTheme, draft]);

  // Preview with the lowest floor's real offices.
  const previewFloor = useMemo(
    () =>
      [...(floorsData ?? [])].sort((a, b) => a.floor_number - b.floor_number)[0] ??
      null,
    [floorsData]
  );

  const dirty =
    !!draft &&
    !!serverTheme &&
    FIELD_ORDER.some((k) => draft[k].toUpperCase() !== serverTheme[k].toUpperCase());
  const invalidFields = draft ? FIELD_ORDER.filter((k) => !isValidHex(draft[k])) : [];
  const hasErrors = invalidFields.length > 0;

  // Warn before leaving with unsaved colours.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  if (isLoading || !draft) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2Icon className="h-6 w-6 animate-spin text-admin-accent-text" />
      </div>
    );
  }

  const active = matchingPreset(draft);
  const contrast = readability(draft);

  const onFieldChange = (key: keyof PublicTheme, value: string) => {
    let v = value.trim();
    if (v && !v.startsWith("#")) v = `#${v}`;
    setDraft((prev) => (prev ? { ...prev, [key]: v.toUpperCase() } : prev));
  };

  const onSave = async () => {
    if (!dirty || hasErrors) return;
    try {
      const saved = await updateTheme(draft).unwrap();
      setDraft(saved);
      toast.success("Theme saved. Every open kiosk updates now.");
    } catch (err) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message ??
          "Could not save the theme."
      );
    }
  };

  const onReset = async () => {
    try {
      const restored = await resetTheme().unwrap();
      setDraft(restored);
      setConfirmReset(false);
      toast.success("Theme reset to Midnight Slate.");
    } catch {
      toast.error("Could not reset the theme. Try again.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-4">
      {/* ─── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-admin-heading">Theme</h1>
          <p className="text-sm text-admin-muted mt-0.5 max-w-2xl">
            Colours used on every floor kiosk. Changes go live on all kiosks
            when you save.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => setConfirmReset(true)}
            disabled={resetState.isLoading || updateState.isLoading}
          >
            <RotateCcwIcon className="h-4 w-4" />
            Reset to default
          </Button>
          {previewFloor && (
            <Button variant="outline" asChild>
              <a
                href={`/floor/${previewFloor.floor_number}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLinkIcon className="h-4 w-4" />
                Open a kiosk
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* ─── Presets gallery ────────────────────────────────── */}
      <section className={panelClass}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-admin-heading">Presets</h2>
            <p className="text-xs text-admin-muted mt-0.5">
              Each one shown on a real kiosk layout. Pick one, then adjust the
              colours below if needed.
            </p>
          </div>
          <ReadabilityBadge ratio={contrast.ratio} tier={contrast.tier} />
        </div>

        <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(190px,1fr))]">
          {PRESETS.map((preset) => {
            const on = active?.id === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setDraft(preset.theme)}
                aria-pressed={on}
                className={cn(
                  "relative grid gap-2 rounded-xl border bg-admin-surface2 p-2 text-left transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden-classic",
                  on
                    ? "border-admin-active ring-1 ring-admin-active"
                    : "border-admin-border hover:border-admin-border-strong"
                )}
              >
                {on && (
                  <span className="absolute right-3 top-3 z-10 grid h-5 w-5 place-items-center rounded-full bg-admin-accent text-admin-accent-ink">
                    <CheckIcon className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
                {previewFloor ? (
                  <KioskPreview floor={previewFloor} theme={preset.theme} compact />
                ) : (
                  <span
                    className="block aspect-video rounded-md"
                    style={{ backgroundColor: preset.theme.page_bg }}
                  />
                )}
                <span className="px-0.5">
                  <span className="block text-[13px] font-semibold text-admin-text">
                    {preset.name}
                  </span>
                  <span className="block text-[11px] leading-snug text-admin-faint">
                    {preset.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ─── Custom colours + preview ───────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] items-start">
        <section className={panelClass}>
          <div>
            <h2 className="text-base font-semibold text-admin-heading">Custom colours</h2>
            <p className="text-xs text-admin-muted mt-0.5">
              {active ? `Based on ${active.name}.` : "Your own colours."} Click a
              swatch or type a hex code like #F5C518.
            </p>
          </div>
          <div className="space-y-3">
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
                    className="h-9 w-10 cursor-pointer rounded-md border border-admin-border-strong bg-transparent p-0"
                  />
                  <Label htmlFor={`color-${key}`} className="block min-w-0">
                    <span className="block text-[13px] font-semibold text-admin-text">
                      {FIELD_LABELS[key].label}
                    </span>
                    <span className="block text-[11px] font-normal text-admin-faint">
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
                    <p className="col-span-3 -mt-2 text-[11px] text-admin-bad">
                      Enter a hex code like #F5C518.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className={cn(panelClass, "lg:sticky lg:top-4 min-w-0")}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-admin-heading">Preview</h2>
              <p className="text-xs text-admin-muted mt-0.5">
                How kiosks will look, with your unsaved changes.
              </p>
            </div>
            <div
              role="group"
              aria-label="Preview screen"
              className="inline-flex overflow-hidden rounded-md border border-admin-border-strong"
            >
              {(
                [
                  ["list", "Office list"],
                  ["detail", "Office detail"],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium transition-colors",
                    view === v
                      ? "bg-admin-active/15 text-admin-text"
                      : "text-admin-muted hover:text-admin-text"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {previewFloor ? (
            <KioskPreview floor={previewFloor} theme={draft} view={view} />
          ) : (
            <p className="py-10 text-center text-sm text-admin-faint">
              Add a floor to see a preview.
            </p>
          )}
          <p className="text-center text-[11px] text-admin-faint">
            The same colours are used on every floor.
          </p>
        </section>
      </div>

      {/* ─── Save bar ────────────────────────────────────────── */}
      <div
        role="status"
        className={cn(
          "sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-admin-surface/95 px-4 py-3 shadow-lg backdrop-blur",
          dirty ? "border-admin-warn/50" : "border-admin-border"
        )}
      >
        <span
          className={cn(
            "inline-flex items-center gap-2 text-sm",
            dirty ? "text-admin-warn" : "text-admin-muted"
          )}
        >
          <span className={cn("h-2 w-2 rounded-full", dirty ? "bg-admin-warn" : "bg-admin-ok")} />
          {!dirty
            ? "Saved. Every kiosk uses this theme."
            : hasErrors
            ? "Fix the highlighted colour before saving."
            : "Unsaved colour changes. Kiosks update when you save."}
        </span>
        <span className="flex items-center gap-2">
          {dirty && (
            <Button
              variant="ghost"
              onClick={() => serverTheme && setDraft(serverTheme)}
              disabled={updateState.isLoading}
            >
              Discard
            </Button>
          )}
          <Button
            onClick={onSave}
            disabled={!dirty || hasErrors || updateState.isLoading}
            className="bg-admin-accent hover:bg-admin-accent/90 text-admin-accent-ink hover:text-admin-accent-ink"
          >
            {updateState.isLoading ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <SaveIcon className="h-4 w-4" />
            )}
            Save theme
          </Button>
        </span>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset the kiosk theme?"
        description="All kiosks go back to the Midnight Slate colours straight away."
        confirmLabel="Reset to default"
        destructive
        loading={resetState.isLoading}
        onConfirm={onReset}
      />
    </div>
  );
}
