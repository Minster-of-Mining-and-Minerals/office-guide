"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2Icon, MegaphoneIcon } from "lucide-react";
import { useGetPublicAnnouncementsQuery } from "@/redux/api/announcementApi";
import type { Announcement } from "@/redux/types/signage";
import { useLocale } from "@/i18n/LocaleProvider";
// NOTE: Titles are shown ONLY in the admin table (see /(private)/announcements).
// The public kiosk carousel intentionally renders media edge-to-edge with no
// title overlay per product requirement.

/** Resolve `/uploads/announcements/xxx.jpg` against the API host. */
function resolveMediaUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  // Strip a trailing `/api` (or `/api/`) so the static file server root
  // is hit, not the API mount point.
  const origin = base.replace(/\/api\/?$/, "");
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${origin}${path.startsWith("/") ? "" : "/"}${path}`;
}

interface AnnouncementCarouselProps {
  /**
   * When set, the carousel will call this whenever it finishes ONE full loop
   * through every announcement. Used by the "both" display mode to swap back
   * to the office guide.
   */
  onCycleComplete?: () => void;
  /**
   * When true, video playback is paused. Used when this component is
   * off-screen (e.g. during the office-guide slot of "both" mode) so audio
   * doesn't keep playing while the guide is visible.
   */
  paused?: boolean;
  /**
   * The current floor UUID, if the kiosk is constrained to one floor.
   * Only announcements meant for this floor (or global ones) will load.
   */
  floorId?: string;
}

/**
 * Full-screen (100vw × 100vh) media carousel used on the kiosk display.
 *
 * Behavior:
 *   - Images stay on screen for `duration_seconds` before advancing.
 *   - Videos autoplay muted (unless `audio_enabled`) and advance on `ended`.
 *   - Live-refreshes via the shared Socket.IO channel — pushing a new
 *     announcement from the admin appears without a manual reload.
 *   - Falls back to a friendly empty state when there is nothing to show.
 */
export function AnnouncementCarousel({
  onCycleComplete,
  paused = false,
  floorId,
}: AnnouncementCarouselProps) {
  const { t } = useLocale();
  const { data, isLoading } = useGetPublicAnnouncementsQuery(
    floorId ? { floor_id: floorId } : undefined,
    {
    // Poll every minute in case a socket event is missed. Cheap, and
    // gives the kiosk fresh scheduling windows without a reload.
    pollingInterval: 60_000,
    refetchOnMountOrArgChange: true,
  });

  const announcements: Announcement[] = useMemo(
    () =>
      (data?.announcements ?? []).filter(
        (a) => a.media_url && a.media_type
      ),
    [data]
  );

  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cycleCompleteRef = useRef(onCycleComplete);
  cycleCompleteRef.current = onCycleComplete;

  // Clamp `index` when the list length changes (e.g. an admin deletes
  // the current item). Reset to 0 so we don't render `undefined`.
  useEffect(() => {
    if (announcements.length === 0) {
      setIndex(0);
      return;
    }
    if (index >= announcements.length) setIndex(0);
  }, [announcements.length, index]);

  const current = announcements[index];

  // Schedule the next image (videos advance from their `onEnded` handler).
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (paused || !current || current.media_type !== "image") return;

    const seconds = Math.max(1, Number(current.duration_seconds) || 10);
    timerRef.current = setTimeout(() => advance(), seconds * 1000);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    // `advance` is stable enough — it only reads `index` from state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.announcement_id, current?.duration_seconds, paused]);

  // Pause / resume the video element when the parent hides us.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (paused) v.pause();
    else v.play().catch(() => {});
  }, [paused, current?.announcement_id]);

  const advance = () => {
    setIndex((prev) => {
      const next = prev + 1;
      if (next >= announcements.length) {
        cycleCompleteRef.current?.();
        return 0;
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-black text-white">
        <Loader2Icon className="h-10 w-10 animate-spin text-golden-classic" />
      </div>
    );
  }

  if (!current) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-black text-white gap-3 px-6 text-center">
        <div className="h-16 w-16 rounded-full border border-white/20 bg-white/5 flex items-center justify-center">
          <MegaphoneIcon className="h-8 w-8 text-golden-classic" />
        </div>
        <p className="text-xl font-semibold">{t("noAnnouncementsTitle")}</p>
        <p className="text-sm text-white/60 max-w-md">
          {t("noAnnouncementsSubtitle")}
        </p>
      </div>
    );
  }

  const src = resolveMediaUrl(current.media_url as string);

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative">
      {current.media_type === "image" ? (
        // `object-contain` preserves aspect ratio — no cropping on odd sizes.
        // Keying on the announcement id forces React to remount the <img>
        // so the browser fires the load cleanly for every step.
        <img
          key={current.announcement_id}
          src={src}
          alt={current.title}
          className="absolute inset-0 w-full h-full object-contain animate-in fade-in duration-500"
          draggable={false}
        />
      ) : (
        <video
          key={current.announcement_id}
          ref={videoRef}
          src={src}
          className="absolute inset-0 w-full h-full object-contain"
          autoPlay
          muted={!current.audio_enabled}
          playsInline
          controls={false}
          onEnded={advance}
          onError={() => {
            // If a video fails to load, advance so a broken file can't
            // wedge the carousel forever.
            advance();
          }}
        />
      )}

      {/* Progress dots — only shown when there is more than one to play. */}
      {announcements.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {announcements.map((a, i) => (
            <span
              key={a.announcement_id}
              className={`h-1.5 rounded-full transition-all ${
                i === index
                  ? "w-6 bg-golden-classic"
                  : "w-1.5 bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
