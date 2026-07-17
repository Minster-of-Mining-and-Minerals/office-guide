"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { io, type Socket } from "socket.io-client";
import {
  ArrowUpIcon,
  Building2Icon,
  ChevronDownIcon,
  ChevronUpIcon,
  DoorOpenIcon,
  LayersIcon,
  Loader2Icon,
  SearchIcon,
  SparklesIcon,
  UserIcon,
  XIcon,
} from "lucide-react";
import { useGetOfficeGuideQuery } from "@/redux/api/signageApi";
import type { Office } from "@/redux/types/signage";
import { cn } from "@/lib/utils";
import { useLocale } from "@/i18n/LocaleProvider";
import { LanguageToggle } from "@/i18n/LanguageToggle";
import { pickLang, pickServiceList } from "@/i18n/pickLang";
import type { Locale } from "@/i18n/dictionary";

/**
 * Flattened office row used by the UI. Both EN and AM copies of every field
 * are preserved so the toggle can swap instantly without a re-fetch.
 */
type FlatOffice = Office & {
  floor_number: number;
  floor_name_en: string;
  floor_name_am: string | null;
};

const floorLabel = (n: number) => (n === 0 ? "G" : String(n));

const useLiveClock = (serverTime: string | undefined) => {
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

/**
 * Match a search term against every localizable field in EITHER language.
 * That way typing "አቀባበል" and typing "Reception" both find the same office.
 */
const matchesSearch = (o: FlatOffice, term: string) => {
  if (!term) return true;
  const q = term.toLowerCase();
  const haystack = [
    o.name,
    o.name_am,
    o.department,
    o.department_am,
    o.description,
    o.description_am,
    o.contact_person,
    o.contact_person_am,
    o.room_number,
    o.floor_name_en,
    o.floor_name_am,
    ...(o.services ?? []),
    ...(o.services_am ?? []),
  ];
  return haystack.some(
    (h) => typeof h === "string" && h.toLowerCase().includes(q)
  );
};

export default function OfficeGuidePage() {
  const { locale, t } = useLocale();

  const { data, isLoading, isError, refetch } = useGetOfficeGuideQuery(
    undefined,
    { pollingInterval: 30_000, refetchOnMountOrArgChange: true }
  );

  // Live refresh via socket — same channel the kiosks listen on.
  const socketRef = useRef<Socket | null>(null);
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
    const origin = base.replace(/\/api\/?$/, "") || undefined;
    const socket = io(origin, {
      transports: ["websocket", "polling"],
      path: "/socket.io",
    });
    socketRef.current = socket;
    const onUpdate = () => refetch();
    socket.on("signage:content:updated", onUpdate);
    return () => {
      socket.off("signage:content:updated", onUpdate);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [refetch]);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 200);
    return () => clearTimeout(t);
  }, [search]);

  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);

  const now = useLiveClock(data?.server_time);

  const allOffices: FlatOffice[] = useMemo(() => {
    if (!data) return [];
    return data.floors.flatMap((f) =>
      f.offices.map((o) => ({
        ...o,
        floor_number: f.floor_number,
        floor_name_en: f.name,
        floor_name_am: f.name_am,
      }))
    );
  }, [data]);

  const filteredOffices = useMemo(() => {
    return allOffices
      .filter((o) =>
        selectedFloor === null ? true : o.floor_number === selectedFloor
      )
      .filter((o) => matchesSearch(o, debouncedSearch));
  }, [allOffices, selectedFloor, debouncedSearch]);

  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FBFC]">
        <Loader2Icon className="h-10 w-10 animate-spin text-golden-dark" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FBFC] px-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-semibold text-golden-dark">
            {t("unavailableTitle")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("unavailableSubtitle")}
          </p>
        </div>
      </div>
    );
  }

  const hasActiveFilters = debouncedSearch !== "" || selectedFloor !== null;
  const clearAllFilters = () => {
    setSearch("");
    setSelectedFloor(null);
  };

  const dateLocale = locale === "am" ? "am-ET" : undefined;
  const selectedFloorObj =
    selectedFloor === null
      ? null
      : data.floors.find((f) => f.floor_number === selectedFloor);

  return (
    <div
      className="min-h-screen text-white transition-colors"
      style={{
        // Page background is driven by the admin-editable theme (see
        // /appearance). The overlay gradient adds vertical depth without
        // burying the chosen color.
        background:
          "linear-gradient(to bottom, var(--kiosk-page-bg), rgb(0 0 0 / 0.35) 100%), var(--kiosk-page-bg)",
      }}
    >
      {/* ─── Hero ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-golden-dark via-[#4a361a] to-[#2c1f0e] text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 20%, #f4d47a 0, transparent 45%), radial-gradient(circle at 85% 80%, #f4d47a 0, transparent 40%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 pt-8 pb-16">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center shadow-lg">
                <Image
                  src="/logo-only.png"
                  alt={t("ministry")}
                  width={40}
                  height={40}
                  priority
                  className="h-9 w-auto"
                />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.4em] text-golden-classic">
                  {t("ministry")}
                </p>
                <h1 className="mt-1 text-3xl md:text-4xl font-semibold leading-tight">
                  {t("officeGuide")}
                </h1>
                <p className="mt-1 text-sm text-white/70 max-w-md">
                  {t("officeGuideSubtitle")}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              <LanguageToggle variant="dark" />
              <div className="text-right hidden sm:block">
                <p className="text-3xl md:text-4xl font-semibold tabular-nums leading-none">
                  {now.toLocaleTimeString(dateLocale, {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </p>
                <p className="mt-2 text-xs text-white/70">
                  {now.toLocaleDateString(dateLocale, {
                    weekday: "long",
                    month: "short",
                    day: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Big search bar */}
          <div className="mt-10 max-w-3xl mx-auto">
            <div className="relative">
              <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full h-14 pl-14 pr-14 rounded-2xl bg-white text-foreground text-base shadow-2xl shadow-black/20 border border-white/40 focus:outline-none focus:ring-4 focus:ring-golden-classic/40 placeholder:text-muted-foreground"
                autoFocus
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-golden-metallic hover:bg-golden-metallic/70 flex items-center justify-center text-golden-dark"
                  aria-label={t("clearSearch")}
                >
                  <XIcon className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Inline mini stats */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-6 text-xs">
              <MetricPill
                icon={<Building2Icon className="h-3.5 w-3.5" />}
                value={data.floors.length}
                label={t("floors")}
              />
              <MetricPill
                icon={<DoorOpenIcon className="h-3.5 w-3.5" />}
                value={allOffices.length}
                label={t("offices")}
              />
              <MetricPill
                icon={<SearchIcon className="h-3.5 w-3.5" />}
                value={filteredOffices.length}
                label={hasActiveFilters ? t("matches") : t("showing")}
                highlight={hasActiveFilters}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Sticky filter bar ────────────────────────────── */}
      <div
        className="sticky top-0 z-40 backdrop-blur border-b border-golden-classic/20 shadow-sm shadow-black/40"
        style={{
          // Semi-transparent tint of the current page bg so the sticky bar
          // always coordinates with whatever background the admin picks.
          backgroundColor:
            "rgb(var(--kiosk-page-bg-rgb) / 0.9)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-3 flex flex-wrap items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <LayersIcon className="h-4 w-4 text-golden-classic" />
            <span className="text-[11px] font-semibold text-golden-classic uppercase tracking-[0.15em]">
              {t("floors")}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 flex-1">
            <FloorChip
              active={selectedFloor === null}
              onClick={() => setSelectedFloor(null)}
              label={t("allFloors")}
            />
            {data.floors.map((f) => {
              const resolvedName = pickLang(f, "name", locale) ?? f.name;
              return (
                <FloorChip
                  key={f.floor_id}
                  active={selectedFloor === f.floor_number}
                  onClick={() =>
                    setSelectedFloor(
                      selectedFloor === f.floor_number
                        ? null
                        : f.floor_number
                    )
                  }
                  label={`${resolvedName} · ${floorLabel(f.floor_number)}`}
                />
              );
            })}
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="shrink-0 inline-flex items-center gap-1 rounded-full border border-golden-classic/30 bg-white/10 px-3 py-1.5 text-[11px] font-medium text-golden-classic hover:bg-white/15 transition-colors"
            >
              <XIcon className="h-3 w-3" />
              {t("clearFilters")}
            </button>
          )}
        </div>
      </div>

      {/* ─── Results ──────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Results summary strip */}
        <div className="mb-6 flex items-baseline justify-between flex-wrap gap-2">
          <h2 className="text-sm text-white/70">
            {hasActiveFilters ? (
              <>
                {t("showingLabel")}{" "}
                <span className="font-semibold text-golden-classic tabular-nums">
                  {filteredOffices.length}
                </span>{" "}
                {t("ofLabel")}{" "}
                <span className="tabular-nums text-white/90">
                  {allOffices.length}
                </span>{" "}
                {t("officesLabel")}
                {debouncedSearch && (
                  <>
                    {" "}
                    {t("forLabel")} “
                    <span className="text-golden-classic">
                      {debouncedSearch}
                    </span>
                    ”
                  </>
                )}
                {selectedFloorObj && (
                  <>
                    {" "}
                    {t("onFloorLabel")}{" "}
                    <span className="text-golden-classic">
                      {pickLang(selectedFloorObj, "name", locale) ??
                        selectedFloorObj.name}
                    </span>
                  </>
                )}
              </>
            ) : (
              t("allNOffices", {
                count: allOffices.length,
                floors: data.floors.length,
              })
            )}
          </h2>
        </div>

        {filteredOffices.length === 0 ? (
          <EmptyState
            search={debouncedSearch}
            onClear={clearAllFilters}
            locale={locale}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredOffices.map((o) => (
              <OfficeCard key={o.office_id} office={o} locale={locale} />
            ))}
          </div>
        )}
      </main>

      {/* ─── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-golden-classic/15 bg-black/50">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center text-xs text-white/60">
          <p className="font-medium">
            {t("footerCopy", { year: now.getFullYear() })}
          </p>
        </div>
      </footer>

      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-golden-dark text-white shadow-xl shadow-golden-dark/30 hover:bg-golden-darkHover hover:scale-105 flex items-center justify-center transition-all"
          aria-label={t("scrollToTop")}
        >
          <ArrowUpIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────

function MetricPill({
  icon,
  value,
  label,
  highlight = false,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 border transition-colors",
        highlight
          ? "bg-golden-classic/20 border-golden-classic/40 text-golden-classic"
          : "bg-white/5 border-white/10 text-white/80"
      )}
    >
      <span className={cn(highlight ? "text-golden-classic" : "text-white/60")}>
        {icon}
      </span>
      <span className="font-semibold tabular-nums text-white">{value}</span>
      <span className="uppercase tracking-wider text-[10px]">{label}</span>
    </div>
  );
}

function FloorChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition-all border",
        active
          ? "bg-golden-classic text-[#2c1f0e] border-golden-classic shadow-sm shadow-golden-classic/30"
          : "bg-white/10 text-golden-classic border-golden-classic/25 hover:border-golden-classic/60 hover:bg-white/15"
      )}
    >
      {label}
    </button>
  );
}

/**
 * How many service tags to render on a card before collapsing the rest
 * behind a `+N more` chip. Six keeps every card in a grid row roughly the
 * same height even when a single office lists many services.
 */
const SERVICES_VISIBLE_LIMIT = 6;

function OfficeCard({
  office,
  locale,
}: {
  office: FlatOffice;
  locale: Locale;
}) {
  // All content picks fall back to English when the AM value is empty.
  const name = pickLang(office, "name", locale) ?? office.name;
  const contact = pickLang(office, "contact_person", locale);

  // Floor label shown inside the room-number tile. Falls back to English if
  // the Amharic floor name is missing — matches the same fallback used for
  // every other translatable string on this card.
  const floorName =
    (locale === "am"
      ? office.floor_name_am ?? office.floor_name_en
      : office.floor_name_en) ?? "";
  const floorNum = floorLabel(office.floor_number);

  const services = pickServiceList(office.services, office.services_am, locale);

  const cardT = useLocale().t;

  // Expand-in-place state for the "+N more" chip. Local to each card so one
  // office being expanded doesn't push every other row down.
  const [expanded, setExpanded] = useState(false);
  const hasOverflow = services.length > SERVICES_VISIBLE_LIMIT;
  const visibleServices =
    !hasOverflow || expanded
      ? services
      : services.slice(0, SERVICES_VISIBLE_LIMIT);
  const hiddenCount = services.length - visibleServices.length;

  // Every color below flows through the admin theme (see /appearance). Using
  // `rgb(var(--*-rgb) / X)` lets us keep hover/glow effects while the base
  // color changes. `card_text` doubles as the fallback for anything textual
  // on the card so light↔dark presets both stay legible.
  return (
    <div
      className="group relative rounded-2xl border shadow-lg shadow-black/25 hover:shadow-2xl hover:-translate-y-0.5 transition-all overflow-hidden flex flex-col"
      style={{
        backgroundColor: "var(--kiosk-card-bg)",
        color: "var(--kiosk-card-text)",
        borderColor: "rgb(var(--kiosk-accent-rgb) / 0.25)",
      }}
    >
      {/* Top accent bar — always uses the accent color as a brand cue. */}
      <div
        className="relative h-1 w-full opacity-90 group-hover:opacity-100 transition-opacity"
        style={{
          background:
            "linear-gradient(to right, var(--kiosk-accent), color-mix(in oklab, var(--kiosk-accent) 40%, white 60%), var(--kiosk-accent))",
        }}
      />

      {/* ─── Room number tile + Office name (name on its own line) ─── */}
      <div className="relative flex items-start gap-4 p-5 pb-3">
        <div
          className="shrink-0 min-h-[96px] w-[92px] rounded-2xl border flex flex-col items-stretch justify-between shadow-md overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in oklab, var(--kiosk-accent) 45%, white 55%), color-mix(in oklab, var(--kiosk-accent) 15%, white 85%), var(--kiosk-accent))",
            borderColor: "rgb(var(--kiosk-accent-rgb) / 0.6)",
            color: "var(--kiosk-accent-dark)",
          }}
        >
          {/* Top section: OFFICE + room number */}
          <div className="flex flex-col items-center justify-center flex-1 pt-2 pb-1.5 px-1">
            <span className="text-[9px] font-semibold uppercase tracking-widest leading-none opacity-80">
              {cardT("cardOffice")}
            </span>
            <span className="mt-1 text-xl font-bold tabular-nums leading-none">
              {office.room_number}
            </span>
          </div>

          {/* Bottom section: floor name + number, on its own strip inside the tile */}
          <div
            className="px-1.5 py-1 text-center border-t"
            style={{
              borderTopColor: "rgb(var(--kiosk-accent-dark-rgb) / 0.2)",
              backgroundColor: "rgb(var(--kiosk-accent-dark-rgb) / 0.08)",
            }}
            title={floorName ? `${floorName} · ${floorNum}` : floorNum}
          >
            <div className="text-[9px] font-semibold uppercase tracking-wider leading-tight truncate">
              {floorName || cardT("floors")}
            </div>
            <div className="text-[10px] font-bold tabular-nums leading-none opacity-80">
              · {floorNum} ·
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1 pt-1">
          {/* Office name — alone on its line, no tags beside it */}
          <p className="text-lg font-semibold leading-snug break-words">
            {name}
          </p>
        </div>
      </div>

      {/* ─── Metadata row: contact chip (floor lives inside the tile now) ─── */}
      {contact && (
        <div className="relative px-5 pb-3 flex flex-wrap items-center gap-1.5">
          <div
            className="inline-flex items-center gap-1.5 rounded-full border pl-1 pr-3 py-0.5 text-[11px] font-medium max-w-full"
            style={{
              backgroundColor: "rgb(var(--kiosk-accent-rgb) / 0.12)",
              borderColor: "rgb(var(--kiosk-accent-rgb) / 0.25)",
            }}
          >
            <span
              className="h-5 w-5 shrink-0 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: "rgb(var(--kiosk-accent-rgb) / 0.4)",
              }}
            >
              <UserIcon className="h-3 w-3" />
            </span>
            <span className="leading-none break-words">{contact}</span>
          </div>
        </div>
      )}

      {/* Divider — 15% of the card text color so it works on any bg. */}
      <div
        className="relative mx-5 h-px"
        style={{
          background:
            "linear-gradient(to right, transparent, rgb(var(--kiosk-card-text-rgb) / 0.2), transparent)",
        }}
      />

      {/* ─── Services ─── */}
      <div className="relative px-5 py-4 flex-1">
        <div className="flex items-center gap-1.5 mb-2.5">
          <SparklesIcon className="h-3.5 w-3.5" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em]">
            {cardT("cardServices")}
          </span>
          {services.length > 0 && (
            <span className="ml-auto text-[10px] tabular-nums opacity-60">
              {services.length}
            </span>
          )}
        </div>

        {services.length === 0 ? (
          <p className="text-xs italic opacity-60">
            {cardT("cardNoServices")}
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {visibleServices.map((s, idx) => (
              <span
                key={`${s}-${idx}`}
                // A single service can be up to 150 chars in the DB. Clamp to
                // ~3 lines so one giant tag can't triple the card height; the
                // native title tooltip reveals the full text on hover for the
                // rare case a visitor really needs it.
                title={s}
                className="rounded-2xl border px-2.5 py-1 text-[11px] font-medium break-words max-w-full leading-snug line-clamp-3"
                style={{
                  backgroundColor: "rgb(var(--kiosk-accent-rgb) / 0.15)",
                  borderColor: "rgb(var(--kiosk-accent-rgb) / 0.3)",
                }}
              >
                {s}
              </span>
            ))}
            {hasOverflow && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="inline-flex items-center gap-1 rounded-2xl border px-2.5 py-1 text-[11px] font-semibold hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 transition-all"
                style={{
                  backgroundColor: "rgb(var(--kiosk-accent-rgb) / 0.28)",
                  borderColor: "rgb(var(--kiosk-accent-rgb) / 0.55)",
                  // The ring color is set inline so it always tracks the
                  // theme's accent, not a hard-coded golden.
                  boxShadow: "none",
                }}
                aria-expanded={expanded}
                aria-label={
                  expanded
                    ? cardT("servicesShowLess")
                    : cardT("cardMoreServices", { n: hiddenCount })
                }
              >
                {expanded ? (
                  <>
                    <ChevronUpIcon className="h-3 w-3" />
                    <span>{cardT("servicesShowLess")}</span>
                  </>
                ) : (
                  <>
                    <ChevronDownIcon className="h-3 w-3" />
                    <span>{cardT("cardMoreServices", { n: hiddenCount })}</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  search,
  onClear,
  locale: _locale,
}: {
  search: string;
  onClear: () => void;
  locale: Locale;
}) {
  const t = useLocale().t;
  return (
    <div className="rounded-2xl border border-dashed border-golden-classic/30 bg-white/5 p-14 text-center">
      <div className="mx-auto h-14 w-14 rounded-full bg-gradient-to-br from-[#FFE9A8] via-[#FFF6DA] to-[#F5D774] border border-golden-classic/40 flex items-center justify-center mb-4 shadow-lg shadow-black/30">
        <SearchIcon className="h-6 w-6 text-golden-dark" />
      </div>
      <p className="text-lg font-semibold text-golden-classic">
        {search ? t("noMatchesTitle", { term: search }) : t("noOfficesTitle")}
      </p>
      <p className="mt-1 text-sm text-white/60">{t("noMatchesSubtitle")}</p>
      <button
        onClick={onClear}
        className="mt-5 inline-flex items-center gap-2 rounded-md border border-golden-classic/50 bg-white/10 text-golden-classic hover:bg-white/15 h-9 px-4 text-sm font-medium"
      >
        <XIcon className="h-3.5 w-3.5" />
        {t("clearFilters")}
      </button>
    </div>
  );
}
