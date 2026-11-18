"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpenIcon,
  ExternalLinkIcon,
  EyeIcon,
  Loader2Icon,
  MegaphoneIcon,
  Repeat2Icon,
  RotateCcwIcon,
  SaveIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { KioskPreview } from "@/components/admin/kiosk-theme";
import { useGetPublicThemeQuery } from "@/redux/api/themeApi";
import {
  useGetAllDisplayModesQuery,
  useResetDisplayModeMutation,
  useUpdateDisplayModeMutation,
} from "@/redux/api/displayModeApi";
import { useGetAllFloorsQuery } from "@/redux/api/floorApi";
import type {
  DisplayMode,
  DisplayModeValue,
} from "@/redux/types/signage";

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


// ─── Page ───────────────────────────────────────────────────────────

export default function AppearancePage() {
  // Saved kiosk colours, only for the preview (edited on the Theme page).
  const { data: serverTheme, isLoading: loadingTheme } = useGetPublicThemeQuery();

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
    if (serverModes) setDraftModes(serverModes);
  }, [serverModes]);

  useEffect(() => {
    if (!previewFloorId && floors.length) setPreviewFloorId(floors[0].floor_id);
  }, [floors, previewFloorId]);

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

  const dirty = modesDirty;
  const hasErrors = badRotation;
  const saving = updateModesState.isLoading;
  const resetting = resetModesState.isLoading;

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
    if (!dirty || hasErrors) return;
    try {
      const payload: Record<string, DisplayMode> = {};
      for (const f of floors) payload[f.floor_id] = draftMode(f.floor_id);
      const saved = await updateModes(payload).unwrap();
      setDraftModes(saved);
      toast.success("Saved floor settings. Open kiosks update now.");
    } catch (err) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message ??
          "Could not save the floor settings."
      );
    }
  };

  const onDiscard = () => setDraftModes(serverModes ?? {});

  const onResetDefaults = async () => {
    try {
      const modes = await resetModes().unwrap();
      setDraftModes(modes);
      toast.success("Reset: every floor now shows the office guide.");
      setConfirmReset(false);
    } catch {
      toast.error("Could not reset the floor settings. Try again.");
    }
  };

  if (loadingTheme || loadingFloors || loadingModes || !serverTheme) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2Icon className="h-6 w-6 animate-spin text-admin-accent-text" />
      </div>
    );
  }

  const previewFloor =
    floors.find((f) => f.floor_id === previewFloorId) ?? floors[0] ?? null;
  const previewMode = previewFloor ? draftMode(previewFloor.floor_id) : DEFAULT_MODE;

  const unsavedText = `${changedFloorIds.length} floor${changedFloorIds.length === 1 ? "" : "s"} changed`;

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-4">
      {/* ─── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-admin-heading">Display</h1>
          <p className="text-sm text-admin-muted mt-0.5 max-w-2xl">
            What each floor&apos;s kiosk shows. Choose a mode for each floor
            and check the preview. Kiosk colours are on the{" "}
            <Link href="/theme" className="font-medium text-admin-accent-text underline-offset-2 hover:underline">
              Theme
            </Link>{" "}
            page.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => setConfirmReset(true)}
            disabled={resetting || saving}
          >
            <RotateCcwIcon className="h-4 w-4" />
            Reset floors
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
                <h2 className="text-base font-semibold text-admin-text">
                  What each floor shows
                </h2>
                <p className="text-xs text-admin-muted mt-0.5">
                  Click the eye to show a floor in the preview.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-admin-muted whitespace-nowrap">
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
              <p className="py-6 text-center text-sm text-admin-faint">
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
                        "flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border bg-admin-raise px-3 py-2.5",
                        previewing ? "border-admin-active/70" : "border-admin-border",
                        changed && "shadow-[inset_3px_0_0_theme(colors.amber.400)]"
                      )}
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-admin-chip text-sm font-bold text-admin-text">
                        {floorShort(f.floor_number)}
                      </span>
                      <span className="min-w-[96px] flex-1">
                        <span className="block text-sm font-semibold text-admin-text">
                          {f.name}
                        </span>
                        {f.name_am && (
                          <span className="block text-[11px] text-admin-faint">
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
                        <label className="flex items-center gap-1.5 text-xs text-admin-muted">
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
                            ? "bg-admin-active/15 text-admin-accent-text"
                            : "text-admin-faint hover:bg-admin-chip hover:text-admin-text"
                        )}
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      {rotBad && (
                        <p className="basis-full text-[11px] text-admin-bad">
                          Enter between 5 and 3600 seconds.
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <details className="group">
              <summary className="cursor-pointer text-xs text-admin-muted hover:text-admin-text">
                What do the modes mean?
              </summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {MODE_ORDER.map((mode) => {
                  const Icon = MODE_INFO[mode].icon;
                  return (
                    <div key={mode} className="flex gap-2.5">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-admin-active/15 text-admin-accent-text">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="text-xs text-admin-muted">
                        <b className="block text-[13px] font-semibold text-admin-text">
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

        </div>

        {/* ─── Right: live preview ───────────────────────────── */}
        <section className={cn(panelClass, "lg:sticky lg:top-4 min-w-0")}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-admin-text">Live preview</h2>
              {previewFloor && (
                <p className="text-xs text-admin-muted mt-0.5">
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
                        ? "border-admin-active bg-admin-active/15 text-admin-accent-text"
                        : "border-admin-border text-admin-muted hover:text-admin-text"
                    )}
                  >
                    {floorShort(f.floor_number)}
                  </button>
                );
              })}
            </div>
          </div>

          {previewFloor ? (
            <KioskPreview floor={previewFloor} mode={previewMode} theme={serverTheme} />
          ) : (
            <p className="py-10 text-center text-sm text-admin-faint">
              Add a floor to see a preview.
            </p>
          )}
          <p className="text-center text-[11px] text-admin-faint">
            Shows unsaved floor changes with this floor&apos;s real offices,
            in the saved colours.{" "}
            <Link href="/theme" className="font-medium text-admin-accent-text underline-offset-2 hover:underline">
              Change colours
            </Link>
          </p>
        </section>
      </div>

      {/* ─── Save bar ────────────────────────────────────────── */}
      <div
        className={cn(
          "sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur",
          dirty
            ? "border-admin-warn/50 bg-admin-surface/95"
            : "border-admin-border bg-admin-surface/95"
        )}
        role="status"
      >
        <span
          className={cn(
            "inline-flex items-center gap-2 text-sm",
            dirty ? "text-admin-warn" : "text-admin-muted"
          )}
        >
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              dirty ? "bg-admin-warn" : "bg-admin-ok"
            )}
          />
          {!dirty
            ? "All changes saved. Kiosks are up to date."
            : hasErrors
            ? "Fix the highlighted fields before saving."
            : `Unsaved: ${unsavedText}. Kiosks update when you save.`}
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
            className="bg-admin-accent hover:bg-admin-accent/90 text-black hover:text-black"
          >
            {saving ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <SaveIcon className="h-4 w-4" />
            )}
            Save floor settings
          </Button>
        </span>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset every floor to the office guide?"
        description="Every floor will show the office guide only. Kiosk colours are not changed. Open kiosks change straight away."
        confirmLabel="Reset floors"
        destructive
        loading={resetting}
        onConfirm={onResetDefaults}
      />
    </div>
  );
}

const panelClass =
  "rounded-xl border border-admin-border bg-admin-surface/80 p-4 sm:p-5 space-y-4 shadow-xl backdrop-blur";

