"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { io, type Socket } from "socket.io-client";
import { Loader2Icon } from "lucide-react";

import { OfficeGuideView } from "@/components/signage/OfficeGuideView";
import { AnnouncementCarousel } from "@/components/signage/AnnouncementCarousel";
import { useGetPublicDisplayModeQuery } from "@/redux/api/displayModeApi";
import { baseApi } from "@/redux/baseApi";

/**
 * Public /office-guide — a single URL that adapts to whichever "display
 * mode" the admin has selected. The Appearance page writes that setting,
 * and any change is pushed here in real time via Socket.IO so every open
 * kiosk swaps content without needing a hard reload.
 *
 * Modes:
 *   - guide_only         → office directory only (legacy behavior)
 *   - announcements_only → full-screen announcement carousel
 *   - both               → alternates between the guide and the carousel
 *                          on a configurable rotation cadence
 */
export default function OfficeGuidePage() {
  const dispatch = useDispatch();
  const { data: displayMode, isLoading } = useGetPublicDisplayModeQuery(
    undefined,
    {
      pollingInterval: 60_000,
      refetchOnMountOrArgChange: true,
    }
  );

  // Single kiosk-wide socket. Every content update from the admin dashboard
  // (floors, offices, appearance, announcements, or the display-mode flag
  // itself) hits `signage:content:updated` on the `signage:all` room, and
  // we translate that into RTK Query tag invalidations so whichever
  // sub-view is currently mounted picks up the change without a reload.
  const socketRef = useRef<Socket | null>(null);
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
    const origin = base.replace(/\/api\/?$/, "") || undefined;
    const socket = io(origin, {
      transports: ["websocket", "polling"],
      path: "/socket.io",
    });
    socketRef.current = socket;
    const onUpdate = () => {
      dispatch(
        baseApi.util.invalidateTags([
          "DisplayMode",
          "Theme",
          { type: "Announcements", id: "PUBLIC" },
          { type: "Floors", id: "PUBLIC_GUIDE" },
        ])
      );
    };
    socket.on("signage:content:updated", onUpdate);
    return () => {
      socket.off("signage:content:updated", onUpdate);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [dispatch]);

  if (isLoading || !displayMode) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-[var(--kiosk-page-bg,#0F172A)] text-white">
        <Loader2Icon className="h-10 w-10 animate-spin text-golden-classic" />
      </div>
    );
  }

  if (displayMode.mode === "announcements_only") {
    return <AnnouncementCarousel />;
  }

  if (displayMode.mode === "both") {
    return (
      <BothModeSwitcher
        rotationSeconds={Math.max(5, displayMode.rotation_seconds ?? 60)}
      />
    );
  }

  // Default → guide_only
  return <OfficeGuideView />;
}

/**
 * "Both" mode wrapper — alternates between the office directory and the
 * announcement carousel. The guide is shown for `rotationSeconds`, then
 * the carousel is shown until it completes one full loop, then we go back
 * to the guide.
 *
 * The carousel is unmounted while the guide is visible so any playing video
 * pauses cleanly and doesn't burn memory. The guide is unmounted too so its
 * scroll position resets when it comes back — friendlier for public viewers
 * who might have been mid-search when the swap happened.
 */
function BothModeSwitcher({ rotationSeconds }: { rotationSeconds: number }) {
  const [showing, setShowing] = useState<"guide" | "announcements">("guide");
  const guideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-flip guide → announcements after `rotationSeconds`. The carousel
  // itself flips back once it finishes a full loop (via onCycleComplete).
  useEffect(() => {
    if (showing !== "guide") return;
    if (guideTimerRef.current) clearTimeout(guideTimerRef.current);
    guideTimerRef.current = setTimeout(() => {
      setShowing("announcements");
    }, rotationSeconds * 1000);
    return () => {
      if (guideTimerRef.current) {
        clearTimeout(guideTimerRef.current);
        guideTimerRef.current = null;
      }
    };
  }, [showing, rotationSeconds]);

  const handleCycleComplete = useCallback(() => {
    setShowing("guide");
  }, []);

  if (showing === "announcements") {
    return <AnnouncementCarousel onCycleComplete={handleCycleComplete} />;
  }
  return <OfficeGuideView />;
}
