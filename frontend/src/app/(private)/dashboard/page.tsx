"use client";

/**
 * Admin dashboard — modelled after the CMS `VariantStatasCard` +
 * `DashboardLayout` patterns and the PMS `GlobalDashboardView` header
 * treatment. Reads three source-of-truth queries and derives every
 * visualisation locally so the API surface stays tiny.
 *
 * Layout, top → bottom:
 *  1. Page header (title + description on the left, "open public
 *     guide" CTA on the right — CMS/PMS style)
 *  2. Quick actions strip (four themed shortcut buttons)
 *  3. Unified stat strip — one card with four inline stats, each with
 *     a mini radial gauge (matches CMS `VariantStatasCard`)
 *  4. Charts row — offices per floor (vertical bars) + translation
 *     status distribution (donut) — matches CMS `DashboardLayout`
 *  5. Bottom split — floors table on the left, Amharic gaps +
 *     "needs Amharic" panel on the right
 */

import Link from "next/link";
import React, { useMemo } from "react";
import {
  ArrowRightIcon,
  MonitorPlayIcon,
  Building2,
  CircleAlertIcon,
  DoorOpen,
  LanguagesIcon,
  Loader2Icon,
  PaletteIcon,
  PlusIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrendingUpIcon,
} from "lucide-react";
import {
  Cell,
  Label,
  Legend,
  Pie,
  PieChart,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Bar,
  BarChart,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";


import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useGetOfficeGuideQuery,
  useGetSignageSummaryQuery,
} from "@/redux/api/signageApi";
import { useGetAllFloorsQuery } from "@/redux/api/floorApi";
import type { Office } from "@/redux/types/signage";

// ─── Domain helpers ────────────────────────────────────────────────

/** An office counts as fully translated when name/description/services
 * all have their Amharic siblings filled to the correct length. */
function isFullyTranslated(o: Office): boolean {
  const nameOk = !!o.name && !!o.name_am;
  const descOk = !o.description || !!o.description_am;
  const servicesOk =
    (o.services?.length ?? 0) === 0 ||
    (o.services?.length ?? 0) === (o.services_am?.length ?? 0);
  return nameOk && descOk && servicesOk;
}

/** Translation status buckets we chart on the donut. */
type TxStatus = "full" | "partial" | "missing";
function classifyTranslation(o: Office): TxStatus {
  const hasAny = !!o.name_am || !!o.description_am || (o.services_am?.length ?? 0) > 0;
  if (isFullyTranslated(o)) return "full";
  if (hasAny) return "partial";
  return "missing";
}

// ─── Page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: summary, isLoading: summaryLoading } =
    useGetSignageSummaryQuery();
  const { data: floors = [], isLoading: floorsLoading } =
    useGetAllFloorsQuery();
  const { data: guide } = useGetOfficeGuideQuery();

  const officesByFloor: Record<string, Office[]> = useMemo(() => {
    const map: Record<string, Office[]> = {};
    guide?.floors.forEach((f) => (map[f.floor_id] = f.offices ?? []));
    return map;
  }, [guide]);

  const allOffices: Office[] = useMemo(
    () => (guide?.floors ?? []).flatMap((f) => f.offices ?? []),
    [guide]
  );

  const activeFloors = useMemo(
    () => floors.filter((f) => f.is_active).length,
    [floors]
  );

  const translation = useMemo(() => {
    const total = allOffices.length || 0;
    let full = 0;
    let partial = 0;
    let missing = 0;
    for (const o of allOffices) {
      const s = classifyTranslation(o);
      if (s === "full") full += 1;
      else if (s === "partial") partial += 1;
      else missing += 1;
    }
    const pct = total === 0 ? 100 : Math.round((full / total) * 100);
    const gaps = allOffices.filter((o) => !isFullyTranslated(o)).slice(0, 5);
    return { total, full, partial, missing, pct, gaps };
  }, [allOffices]);

  const avgServices = useMemo(() => {
    if (allOffices.length === 0) return 0;
    const total = allOffices.reduce(
      (n, o) => n + (o.services?.length ?? 0),
      0
    );
    return Math.round((total / allOffices.length) * 10) / 10;
  }, [allOffices]);

  // ── Stat strip config (CMS VariantStatasCard style)
  const stats = useMemo(
    () => [
      {
        id: "floors",
        title: "Floors",
        value: summary?.total_floors ?? floors.length,
        secondary: `${activeFloors} active`,
        percent:
          (summary?.total_floors ?? floors.length) === 0
            ? 0
            : Math.round(
                (activeFloors / (summary?.total_floors ?? floors.length)) * 100
              ),
        color: "hsl(45, 100%, 50%)", // golden
        Icon: Building2,
        href: "/floors",
      },
      {
        id: "offices",
        title: "Offices",
        value: summary?.total_offices ?? allOffices.length,
        secondary:
          floors.length > 0
            ? `${(
                (summary?.total_offices ?? allOffices.length) / floors.length
              ).toFixed(1)} / floor`
            : "—",
        percent: 100,
        color: "hsl(35, 90%, 55%)",
        Icon: DoorOpen,
        href: "/offices",
      },
      {
        id: "translation",
        title: "Translation health",
        value: translation.pct,
        suffix: "%",
        secondary: `${translation.full} of ${translation.total} translated`,
        percent: translation.pct,
        color:
          translation.pct >= 90
            ? "hsl(142, 70%, 40%)"
            : translation.pct >= 60
              ? "hsl(38, 92%, 50%)"
              : "hsl(0, 72%, 51%)",
        Icon: LanguagesIcon,
        href: "/offices",
      },
      {
        id: "services",
        title: "Avg services / office",
        value: avgServices,
        secondary: `${allOffices.reduce(
          (n, o) => n + (o.services?.length ?? 0),
          0
        )} total`,
        percent: Math.min(100, Math.round((avgServices / 6) * 100)),
        color: "hsl(200, 70%, 50%)",
        Icon: SparklesIcon,
        href: "/offices",
      },
    ],
    [
      summary,
      floors.length,
      allOffices,
      activeFloors,
      translation,
      avgServices,
    ]
  );

  // ── Chart data
  const officesPerFloor = useMemo(
    () =>
      floors
        .map((f) => ({
          name: `F${f.floor_number}`,
          fullName: f.name,
          offices: (officesByFloor[f.floor_id] ?? []).length,
        }))
        .sort((a, b) => Number(a.name.slice(1)) - Number(b.name.slice(1))),
    [floors, officesByFloor]
  );

  const translationDistribution = useMemo(
    () => [
      {
        name: "Fully translated",
        value: translation.full,
        fill: "hsl(142, 70%, 40%)",
      },
      {
        name: "Partial",
        value: translation.partial,
        fill: "hsl(38, 92%, 50%)",
      },
      {
        name: "Missing",
        value: translation.missing,
        fill: "hsl(0, 72%, 51%)",
      },
    ],
    [translation]
  );

  const hasAnyOffice = allOffices.length > 0;

  return (
    <main className="flex flex-col gap-6">
      {/* ── 1. Page header ─────────────────── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-admin-heading">Dashboard</h1>
          <p className="mt-1 max-w-2xl text-sm text-admin-faint">
            Live snapshot of the ministry office guide — floors, offices,
            and bilingual coverage.
          </p>
        </div>
        <Link
          href="/"
          target="_blank"
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-admin-active/40 bg-admin-raise px-4 text-sm font-medium text-admin-accent-text shadow-sm hover:bg-admin-active/15 backdrop-blur"
        >
          <ShieldCheckIcon className="h-4 w-4" />
          Open public office guide
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* ── 2. Quick actions ───────────────────────────────── */}
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-admin-accent-text">
          Quick actions
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          <QuickAction href="/floors" label="New floor" hint="Add a level" Icon={Building2} />
          <QuickAction href="/offices" label="New office" hint="Add a room" Icon={DoorOpen} />
          <QuickAction href="/appearance" label="Display" hint="What floors show" Icon={MonitorPlayIcon} />
          <QuickAction href="/theme" label="Theme" hint="Kiosk colours" Icon={PaletteIcon} />
          <QuickAction href="/users" label="Users & roles" hint="Access control" Icon={ShieldCheckIcon} />
        </div>
      </section>

      {/* ── 3. Unified stat strip ────────────── */}
      <div className="rounded-xl border border-admin-border bg-admin-surface/80 backdrop-blur shadow-xl relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-20" style={{backgroundImage:"radial-gradient(ellipse at 0% 0%, hsl(45,100%,50%,0.2) 0, transparent 60%)"}} />
        <div className="relative p-4 md:p-6">
          {(summaryLoading || !guide) && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-black/40 backdrop-blur-[1px]">
              <Loader2Icon className="h-5 w-5 animate-spin text-admin-accent-text" />
            </div>
          )}
          <div className="grid grid-cols-1 divide-y divide-admin-border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.id}
                className={cn(
                  "sm:border-r sm:border-admin-border",
                  "sm:[&:nth-child(2n)]:border-r-0",
                  "lg:[&:nth-child(2n)]:border-r",
                  "lg:[&:nth-child(4n)]:border-r-0"
                )}
              >
                <StatItem
                  title={s.title}
                  value={s.value}
                  suffix={s.suffix}
                  secondary={s.secondary}
                  percent={s.percent}
                  color={s.color}
                  Icon={s.Icon}
                  href={s.href}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 4. Charts row ──────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Offices per floor (bar) — spans 3/5 */}
        <div className="rounded-xl border border-admin-border bg-admin-surface/80 backdrop-blur shadow-xl lg:col-span-3">
          <div className="flex flex-row items-start justify-between p-6 pb-2">
            <div>
              <p className="text-base font-semibold text-admin-accent-text">Offices per floor</p>
              <p className="text-[11px] text-admin-faint">Room count on every level.</p>
            </div>
            <Building2 className="h-4 w-4 text-admin-accent-text" />
          </div>
          <div className="px-6 pb-6">
            {!hasAnyOffice ? (
              <EmptyChart hint="No offices yet." />
            ) : (
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={officesPerFloor}
                    margin={{ top: 8, right: 8, left: -12, bottom: 4 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgb(var(--a-border))"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12, fill: "rgb(var(--a-muted))" }}
                      tickLine={false}
                      axisLine={{ stroke: "rgb(var(--a-border-strong))" }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 12, fill: "rgb(var(--a-muted))" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "rgb(var(--a-text) / 0.05)" }}
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid rgb(var(--a-border-strong))",
                        fontSize: 12,
                        background: "rgb(var(--a-surface))",
                        color: "rgb(var(--a-text))",
                      }}
                      formatter={(v: number, _n, p: any) => [
                        `${v} offices`,
                        p?.payload?.fullName,
                      ]}
                    />
                    <Bar
                      dataKey="offices"
                      fill="hsl(45, 100%, 50%)"
                      radius={[8, 8, 2, 2]}
                      maxBarSize={44}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Translation distribution (donut) — spans 2/5 */}
        <div className="rounded-xl border border-admin-border bg-admin-surface/80 backdrop-blur shadow-xl lg:col-span-2">
          <div className="flex flex-row items-start justify-between p-6 pb-2">
            <div>
              <p className="text-base font-semibold text-admin-accent-text">Translation status</p>
              <p className="text-[11px] text-admin-faint">Fully translated vs. gaps.</p>
            </div>
            <LanguagesIcon className="h-4 w-4 text-admin-accent-text" />
          </div>
          <div className="px-6 pb-6">
            {!hasAnyOffice ? (
              <EmptyChart hint="No offices yet." />
            ) : (
              <div className="relative h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid rgb(var(--a-border-strong))",
                        fontSize: 12,
                        background: "rgb(var(--a-surface))",
                        color: "rgb(var(--a-text))",
                      }}
                    />
                    <Pie
                      data={translationDistribution}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                      stroke="rgb(var(--a-surface))"
                      strokeWidth={2}
                    >
                      {translationDistribution.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                      <Label
                        content={({ viewBox }) => {
                          if (!viewBox || !("cx" in viewBox)) return null;
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) - 4}
                                className="fill-admin-accent-text text-2xl font-bold"
                              >
                                {translation.pct}%
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 16}
                                fill="rgb(var(--a-faint))"
                              className="text-[10px]"
                              >
                                translated
                              </tspan>
                            </text>
                          );
                        }}
                      />
                    </Pie>
                    <Legend
                      verticalAlign="bottom"
                      height={32}
                      iconType="circle"
                      wrapperStyle={{ fontSize: 11, color: "rgb(var(--a-muted))" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 5. Bottom split: floors table + sidebar ────────── */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="rounded-xl border border-admin-border bg-admin-surface/80 backdrop-blur shadow-xl">
          <div className="flex flex-row items-center justify-between p-6 pb-2">
            <div>
              <p className="text-base font-semibold text-admin-accent-text">Floors</p>
              <p className="text-[11px] text-admin-faint">Offices per floor + translation status.</p>
            </div>
            <Link
              href="/floors"
              className="inline-flex items-center gap-1 text-xs text-admin-accent-text hover:underline"
            >
              View all <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-admin-accent-text">#</TableHead>
                  <TableHead className="text-admin-accent-text">Name</TableHead>
                  <TableHead className="w-24 text-right text-admin-accent-text">Offices</TableHead>
                  <TableHead className="w-32 text-admin-accent-text">Translation</TableHead>
                  <TableHead className="w-24 text-admin-accent-text">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {floorsLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-20 text-center">
                      <Loader2Icon className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : floors.length === 0 ? (
                  <TableRow className="border-admin-border">
                    <TableCell colSpan={5} className="h-20 text-center text-admin-faint">
                      No floors yet. Head to the Floors page to add the first
                      one.
                    </TableCell>
                  </TableRow>
                ) : (
                  floors.map((f) => {
                    const offices = officesByFloor[f.floor_id] ?? [];
                    const translated = offices.filter(isFullyTranslated).length;
                    const pct =
                      offices.length === 0
                        ? 100
                        : Math.round((translated / offices.length) * 100);
                    return (
                      <TableRow key={f.floor_id} className="border-admin-border hover:bg-admin-raise">
                        <TableCell className="font-bold text-admin-text">
                          {f.floor_number}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-admin-text">{f.name}</span>
                            {f.name_am && (
                              <span
                                lang="am-ET"
                                className="text-[11px] text-admin-faint"
                              >
                                {f.name_am}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-admin-muted">
                          {offices.length}
                        </TableCell>
                        <TableCell>
                          <TranslationBar pct={pct} />
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              f.is_active
                                ? "inline-flex items-center rounded-full border border-admin-ok/30 bg-admin-ok/15 px-2 py-0.5 text-[11px] font-medium text-admin-ok"
                                : "inline-flex items-center rounded-full border border-admin-border bg-admin-raise px-2 py-0.5 text-[11px] font-medium text-admin-faint"
                            }
                          >
                            {f.is_active ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-admin-border bg-admin-surface/80 backdrop-blur shadow-xl">
            <div className="flex flex-row items-center justify-between p-6 pb-2">
              <div>
                <p className="text-base font-semibold text-admin-accent-text">Needs Amharic</p>
                <p className="text-[11px] text-admin-faint">Offices missing translated fields.</p>
              </div>
              <LanguagesIcon className="h-4 w-4 text-admin-accent-text" />
            </div>
            <div className="p-0">
              {!guide ? (
                <div className="flex h-20 items-center justify-center">
                  <Loader2Icon className="h-4 w-4 animate-spin text-admin-faint" />
                </div>
              ) : translation.gaps.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full border border-admin-ok/30 bg-admin-ok/15 text-admin-ok">
                    <TrendingUpIcon className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-medium text-admin-ok">
                    All caught up!
                  </p>
                  <p className="mt-0.5 text-[11px] text-admin-faint">
                    Every office has full Amharic content.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-admin-border">
                  {translation.gaps.map((o) => (
                    <li
                      key={o.office_id}
                      className="flex items-center justify-between gap-3 px-4 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-admin-text">{o.name}</p>
                        <p className="text-[11px] text-admin-faint">
                          Room {o.room_number}
                        </p>
                      </div>
                      <span
                        className="inline-flex shrink-0 items-center gap-1 rounded-full border border-admin-warn/30 bg-admin-warn/15 px-2 py-0.5 text-[10px] font-semibold text-admin-warn"
                        title="Missing at least one Amharic field"
                      >
                        <CircleAlertIcon className="h-3 w-3" />
                        Gaps
                      </span>
                    </li>
                  ))}
                  <li className="px-4 py-2">
                    <Link
                      href="/offices"
                      className="inline-flex items-center gap-1 text-xs text-admin-accent-text hover:underline"
                    >
                      Fix in Offices
                      <ArrowRightIcon className="h-3.5 w-3.5" />
                    </Link>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

// ─── Local components ──────────────────────────────────────────────

function StatItem({
  title,
  value,
  suffix,
  secondary,
  percent,
  color,
  Icon,
  href,
}: {
  title: string;
  value: number | string;
  suffix?: string;
  secondary?: string;
  percent: number;
  color: string;
  Icon: React.ComponentType<{ className?: string }>;
  href?: string;
}) {
  const chartData = [
    { name: title, value: percent, fill: color },
  ];

  const body = (
    <div className="group flex items-center justify-between gap-3 rounded-xl p-3 transition-colors hover:bg-admin-raise">
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex items-center gap-2">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-md border"
            style={{
              backgroundColor: `${color.replace("hsl", "hsla").replace(")", ", 0.10)")}`,
              borderColor: `${color.replace("hsl", "hsla").replace(")", ", 0.25)")}`,
              color,
            }}
          >
            <Icon className="h-3.5 w-3.5" />
          </span>
          <p className="truncate text-[11px] font-medium uppercase tracking-wider text-admin-faint">
            {title}
          </p>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold tabular-nums text-admin-accent-text">
            {typeof value === "number" ? value.toLocaleString() : value}
          </span>
          {suffix && (
            <span className="text-lg font-semibold text-admin-accent-text">
              {suffix}
            </span>
          )}
        </div>
        {secondary && (
          <p className="truncate text-[11px] text-admin-faint">
            {secondary}
          </p>
        )}
      </div>

      <div className="relative h-[74px] w-[74px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            data={chartData}
            startAngle={90}
            endAngle={90 - (percent / 100) * 360}
            innerRadius={26}
            outerRadius={36}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="first:fill-muted last:fill-background"
              polarRadius={[30, 22]}
            />
            <RadialBar
              dataKey="value"
              background={{ fill: "rgb(var(--a-chip))" }}
              cornerRadius={10}
            />
            <PolarRadiusAxis tick={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (!viewBox || !("cx" in viewBox)) return null;
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        className="text-[11px] font-bold"
                        style={{ fill: "rgb(var(--a-text))" }}
                      >
                        {percent}%
                      </tspan>
                    </text>
                  );
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return href ? <Link href={href}>{body}</Link> : body;
}

function QuickAction({
  href,
  label,
  hint,
  Icon,
}: {
  href: string;
  label: string;
  hint: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-admin-border bg-admin-surface/80 p-3 backdrop-blur transition-all hover:border-admin-active/40 hover:shadow-md"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-admin-active/30 bg-admin-active/10 text-admin-accent-text group-hover:bg-admin-active/25">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 text-sm font-medium text-admin-accent-text">
          {label}
          <PlusIcon className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
        </p>
        <p className="truncate text-[11px] text-admin-faint">{hint}</p>
      </div>
    </Link>
  );
}

function TranslationBar({ pct }: { pct: number }) {
  const tone =
    pct >= 90 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-admin-chip">
        <div
          className={cn("h-full transition-all", tone)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-[11px] tabular-nums text-admin-faint">
        {pct}%
      </span>
    </div>
  );
}

function EmptyChart({ hint }: { hint: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center rounded-md border border-dashed border-admin-border-strong bg-admin-raise">
      <p className="text-sm text-admin-faint">{hint}</p>
    </div>
  );
}
