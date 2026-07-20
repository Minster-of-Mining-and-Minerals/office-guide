"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { io, type Socket } from "socket.io-client";
import { Loader2Icon } from "lucide-react";

import { OfficeGuideView } from "@/components/signage/OfficeGuideView";
import { AnnouncementCarousel } from "@/components/signage/AnnouncementCarousel";
import { useGetPublicDisplayModeQuery } from "@/redux/api/displayModeApi";
import { baseApi } from "@/redux/baseApi";

export function PublicKiosk({ initialFloor }: { initialFloor?: number }) {
  const dispatch = useDispatch();
  const { data: displayMode, isLoading } = useGetPublicDisplayModeQuery(
    undefined,
    {
      pollingInterval: 60_000,
      refetchOnMountOrArgChange: true,
    }
  );

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
        initialFloor={initialFloor}
      />
    );
  }

  return <OfficeGuideView initialFloor={initialFloor} />;
}

function BothModeSwitcher({ rotationSeconds, initialFloor }: { rotationSeconds: number; initialFloor?: number }) {
  const [showing, setShowing] = useState<"guide" | "announcements">("guide");
  const guideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  return <OfficeGuideView initialFloor={initialFloor} />;
}
