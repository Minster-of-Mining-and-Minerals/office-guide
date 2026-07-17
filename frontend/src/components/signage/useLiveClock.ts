"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Returns a `Date` that ticks every second and is offset by the delta
 * between the client clock and the server's reported time. Feeding a
 * `server_time` (ISO string) from an API response keeps the hero clock
 * on the kiosk aligned even when the kiosk machine's local clock has
 * drifted.
 */
export const useLiveClock = (serverTime: string | undefined) => {
  const [now, setNow] = useState<Date>(() => new Date());
  const offsetRef = useRef<number>(0);

  useEffect(() => {
    if (serverTime) {
      const parsed = new Date(serverTime).getTime();
      if (Number.isFinite(parsed)) offsetRef.current = parsed - Date.now();
    }
  }, [serverTime]);

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date(Date.now() + offsetRef.current));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return now;
};
