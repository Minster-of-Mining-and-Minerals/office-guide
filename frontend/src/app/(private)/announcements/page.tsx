"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  CalendarIcon,
  EyeIcon,
  EyeOffIcon,
  FilmIcon,
  GripVerticalIcon,
  ImageIcon,
  Loader2Icon,
  MegaphoneIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  UploadCloudIcon,
  Volume2Icon,
  XIcon,
} from "lucide-react";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { DataToolbar } from "@/components/common/DataToolbar";
import { DataPagination } from "@/components/common/DataPagination";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { FormSectionHeader as SectionHeader } from "@/components/common/FormSectionHeader";
import { cn } from "@/lib/utils";
import {
  useBulkSetAnnouncementVisibilityMutation,
  useCreateAnnouncementMutation,
  useDeleteAnnouncementMutation,
  useGetAnnouncementsQuery,
  useGetAllAnnouncementsQuery,
  useReorderAnnouncementsMutation,
  useUpdateAnnouncementMutation,
} from "@/redux/api/announcementApi";
import { useGetAllFloorsQuery } from "@/redux/api/floorApi";
import type {
  Announcement,
  AnnouncementStatus,
  Floor,
} from "@/redux/types/signage";

const PAGE_LIMIT = 10;

/**
 * Small controlled checkbox styled to fit the golden accent theme. Kept
 * inline (rather than adding @radix-ui/react-checkbox) so we don't pull
 * a new dep for a single admin surface.
 */
function RowCheckbox({
  checked,
  indeterminate = false,
  onCheckedChange,
  ariaLabel,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onCheckedChange: (v: boolean) => void;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate && !checked;
  }, [indeterminate, checked]);
  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label={ariaLabel}
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      className="h-4 w-4 rounded border-admin-active/40 accent-golden-dark cursor-pointer"
    />
  );
}

interface FormState {
  title: string;
  /** true = every floor (including floors added later). */
  all_floors: boolean;
  /** Chosen floors when `all_floors` is false. */
  floor_ids: string[];
  message: string;
  duration_seconds: number;
  audio_enabled: boolean;
  is_visible: boolean;
  start_date: string;
  end_date: string;
  media: File | null;
}

const emptyForm: FormState = {
  title: "",
  all_floors: true,
  floor_ids: [],
  message: "",
  duration_seconds: 10,
  audio_enabled: false,
  is_visible: true,
  start_date: "",
  end_date: "",
  media: null,
};

/** Prefix a stored `/uploads/...` path with the API host so it renders. */
function resolveMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  const origin = base.replace(/\/api\/?$/, "");
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${origin}${path.startsWith("/") ? "" : "/"}${path}`;
}

function humanFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatScheduleWindow(a: Announcement): string {
  const s = a.start_date ? new Date(a.start_date) : null;
  const e = a.end_date ? new Date(a.end_date) : null;
  if (!s && !e) return "Always on";
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  if (s && e) return `${fmt(s)} – ${fmt(e)}`;
  if (s) return `From ${fmt(s)}`;
  if (e) return `Until ${fmt(e)}`;
  return "";
}

/** Turn an ISO string from the API into a `<input type="datetime-local">`-friendly value. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

// ─── Status, sorting and floors ─────────────────────────────────────

/** Status label + colour token (`--a-<tone>`). */
const STATUS_META: Record<
  AnnouncementStatus,
  { label: string; tone: "ok" | "info" | "bad" | "faint" }
> = {
  live: { label: "Live", tone: "ok" },
  scheduled: { label: "Scheduled", tone: "info" },
  ended: { label: "Ended", tone: "bad" },
  hidden: { label: "Hidden", tone: "faint" },
};

const STATUS_TABS: { value: "all" | AnnouncementStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "live", label: "Live" },
  { value: "scheduled", label: "Scheduled" },
  { value: "ended", label: "Ended" },
  { value: "hidden", label: "Hidden" },
];

/** Sort options, with the word pair shown for ascending / descending. */
const SORT_OPTIONS: {
  value: string;
  label: string;
  asc: string;
  desc: string;
  defaultOrder: "ASC" | "DESC";
}[] = [
  { value: "display_order", label: "Play order", asc: "first to last", desc: "last to first", defaultOrder: "ASC" },
  { value: "created_at", label: "Date added", asc: "oldest first", desc: "newest first", defaultOrder: "DESC" },
  { value: "title", label: "Title", asc: "A to Z", desc: "Z to A", defaultOrder: "ASC" },
  { value: "end_date", label: "End date", asc: "ending soonest", desc: "ending latest", defaultOrder: "ASC" },
  { value: "status", label: "Status", asc: "live first", desc: "hidden first", defaultOrder: "ASC" },
  { value: "floor", label: "Floor", asc: "lowest floor first", desc: "highest floor first", defaultOrder: "ASC" },
];

function StatusPill({ status }: { status: AnnouncementStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.live;
  return (
    // Tinted by day, grey with a coloured dot at night (see globals.css).
    <span
      className="admin-status-pill inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap"
      style={{ "--tone": `var(--a-${meta.tone})` } as React.CSSProperties}
    >
      {meta.label}
    </span>
  );
}

/** Short floor label: "G" for ground, otherwise the number. */
const floorShort = (n: number) => (n === 0 ? "G" : String(n));

function FloorBadges({ announcement }: { announcement: Announcement }) {
  if (announcement.all_floors) {
    return (
      <span className="inline-flex items-center rounded-md bg-admin-active/15 px-2 py-0.5 text-[11px] font-semibold text-admin-accent-text whitespace-nowrap">
        All floors
      </span>
    );
  }
  if (!announcement.floors?.length) {
    return (
      <span
        className="inline-flex items-center rounded-md bg-admin-bad/15 px-2 py-0.5 text-[11px] font-semibold text-admin-bad whitespace-nowrap"
        title="Its floors were deleted, so it plays nowhere. Edit it to choose floors."
      >
        No floors
      </span>
    );
  }
  return (
    <span className="inline-flex flex-wrap gap-1">
      {announcement.floors.map((f) => (
        <span
          key={f.floor_id}
          title={f.name}
          className="inline-grid h-[22px] min-w-[22px] place-items-center rounded-md bg-admin-chip px-1.5 text-[11px] font-semibold text-admin-text"
        >
          {floorShort(f.floor_number)}
        </span>
      ))}
    </span>
  );
}

/**
 * Multi-floor picker: an "All floors" master checkbox plus one tile per
 * floor. Ticking every tile is the same as "All floors".
 */
function FloorTilesPicker({
  floors,
  allFloors,
  selectedIds,
  onChange,
}: {
  floors: Floor[];
  allFloors: boolean;
  selectedIds: string[];
  onChange: (next: { all_floors: boolean; floor_ids: string[] }) => void;
}) {
  const sorted = useMemo(
    () => [...floors].sort((a, b) => a.floor_number - b.floor_number),
    [floors]
  );
  const allIds = sorted.map((f) => f.floor_id);
  const checked = new Set(allFloors ? allIds : selectedIds);
  const count = sorted.filter((f) => checked.has(f.floor_id)).length;
  const masterRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (masterRef.current) {
      masterRef.current.indeterminate =
        !allFloors && count > 0 && count < sorted.length;
    }
  }, [allFloors, count, sorted.length]);

  const toggleFloor = (id: string, on: boolean) => {
    const next = new Set(checked);
    if (on) next.add(id);
    else next.delete(id);
    const ids = allIds.filter((x) => next.has(x));
    onChange(
      ids.length === allIds.length && allIds.length > 0
        ? { all_floors: true, floor_ids: [] }
        : { all_floors: false, floor_ids: ids }
    );
  };

  const names = sorted.filter((f) => checked.has(f.floor_id)).map((f) => f.name);

  return (
    <div className="space-y-2.5">
      <label
        className={cn(
          "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors",
          allFloors
            ? "border-admin-active bg-admin-active/10"
            : "border-admin-border-strong bg-admin-raise hover:border-admin-active/60"
        )}
      >
        <input
          ref={masterRef}
          type="checkbox"
          checked={allFloors}
          onChange={(e) =>
            onChange(
              e.target.checked
                ? { all_floors: true, floor_ids: [] }
                : { all_floors: false, floor_ids: [] }
            )
          }
          className="h-4 w-4 cursor-pointer accent-golden-dark"
        />
        <span>
          <span className="block text-sm font-semibold text-admin-text">All floors</span>
          <span className="block text-[11px] text-admin-faint">
            Every kiosk in the building, including floors added later.
          </span>
        </span>
      </label>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {sorted.map((f) => {
          const on = checked.has(f.floor_id);
          return (
            <label
              key={f.floor_id}
              className={cn(
                "relative grid cursor-pointer gap-0.5 rounded-lg border p-2.5 transition-colors",
                on
                  ? "border-admin-active bg-admin-active/10"
                  : "border-admin-border-strong bg-admin-raise hover:border-admin-active/60"
              )}
            >
              <input
                type="checkbox"
                checked={on}
                onChange={(e) => toggleFloor(f.floor_id, e.target.checked)}
                className="absolute right-2.5 top-2.5 h-4 w-4 cursor-pointer accent-golden-dark"
                aria-label={f.name}
              />
              <span
                className={cn(
                  "text-xl font-bold leading-none",
                  on ? "text-admin-accent-text" : "text-admin-text"
                )}
              >
                {floorShort(f.floor_number)}
              </span>
              <span className="truncate text-[11px] text-admin-muted">
                {f.name}
              </span>
              {f.name_am && (
                <span className="truncate text-[11px] text-admin-faint">
                  {f.name_am}
                </span>
              )}
            </label>
          );
        })}
      </div>

      {count === 0 ? (
        <p className="rounded-md border border-admin-bad/30 bg-admin-bad/10 px-3 py-2 text-xs text-admin-bad">
          Choose at least one floor, or the announcement won&apos;t play
          anywhere.
        </p>
      ) : (
        <p className="rounded-md bg-admin-raise px-3 py-2 text-xs text-admin-muted">
          {allFloors ? (
            <>
              Plays on <b className="text-admin-text">all floors</b>.
            </>
          ) : (
            <>
              Plays on{" "}
              <b className="text-admin-text">
                {count} of {sorted.length}
              </b>{" "}
              floors: {names.join(", ")}.
            </>
          )}
        </p>
      )}
    </div>
  );
}

// ─── Sortable row for reorder dialog ────────────────────────────────

function SortableRow({
  announcement,
  position,
}: {
  announcement: Announcement;
  position: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: announcement.announcement_id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
  };

  const thumb = resolveMediaUrl(announcement.media_url);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 rounded-xl border bg-admin-raise p-3 text-admin-text transition-all ${
        isDragging
          ? "border-admin-active shadow-lg ring-2 ring-golden-classic/40 opacity-95"
          : "border-admin-active/25 hover:border-admin-active/60 hover:shadow-sm"
      }`}
    >
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-admin-accent-text hover:bg-admin-active/10 p-1.5 rounded-md transition-colors"
          {...attributes}
          {...listeners}
          aria-label={`Drag ${announcement.title} to reorder`}
        >
          <GripVerticalIcon className="h-4 w-4" />
        </button>
        <span className="h-7 w-7 rounded-full bg-admin-active/10 border border-admin-active/40 text-admin-accent-text text-xs font-semibold flex items-center justify-center tabular-nums">
          {position}
        </span>
      </div>

      <div className="h-12 w-16 shrink-0 rounded-lg overflow-hidden border border-admin-active/25 bg-black/70 flex items-center justify-center">
        {announcement.media_type === "image" && thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt=""
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : announcement.media_type === "video" ? (
          <FilmIcon className="h-5 w-5 text-admin-accent-text" />
        ) : (
          <ImageIcon className="h-5 w-5 text-muted-foreground" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{announcement.title}</p>
        <p className="text-[11px] text-muted-foreground truncate">
          {announcement.media_type === "video" ? "Video" : "Image"} ·{" "}
          {formatScheduleWindow(announcement)}
        </p>
      </div>

      {!announcement.is_visible && (
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase">
          Hidden
        </span>
      )}
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────

export default function AnnouncementsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AnnouncementStatus>("all");
  // "any" = no floor filter, "all" = only all-floor announcements, else a floor id.
  const [floorFilter, setFloorFilter] = useState<string>("any");
  const [page, setPage] = useState(1);
  // Newest uploads first by default; admins can switch to play order.
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const queryParams = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
      floor_id: floorFilter === "any" ? undefined : floorFilter,
      page,
      limit: PAGE_LIMIT,
      sort_by: sortBy,
      sort_order: sortOrder,
    }),
    [debouncedSearch, statusFilter, floorFilter, page, sortBy, sortOrder]
  );

  const { data, isLoading, isFetching } = useGetAnnouncementsQuery(queryParams);
  const { data: floorsData } = useGetAllFloorsQuery();
  const floors = useMemo(
    () => [...(floorsData ?? [])].sort((a, b) => a.floor_number - b.floor_number),
    [floorsData]
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [mediaPreview, setMediaPreview] = useState<{
    url: string;
    type: "image" | "video";
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [createAnn, { isLoading: creating }] = useCreateAnnouncementMutation();
  const [updateAnn, { isLoading: updating }] = useUpdateAnnouncementMutation();
  const submitting = creating || updating;

  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [deleteAnn, { isLoading: deleting }] = useDeleteAnnouncementMutation();

  // Multi-select state for the bulk actions bar. Cleared automatically when
  // the underlying page/filter/search changes so stale IDs never linger.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, debouncedSearch, statusFilter, floorFilter, sortBy, sortOrder]);
  const [bulkSetVisibility, { isLoading: bulkUpdating }] =
    useBulkSetAnnouncementVisibilityMutation();

  // Reorder dialog state
  const [reorderOpen, setReorderOpen] = useState(false);
  const { data: allAnnouncements = [], isFetching: fetchingAll } =
    useGetAllAnnouncementsQuery(undefined, { skip: !reorderOpen });
  const [reorderIds, setReorderIds] = useState<string[]>([]);
  const [reorderAnns, { isLoading: savingOrder }] =
    useReorderAnnouncementsMutation();

  useEffect(() => {
    if (reorderOpen && allAnnouncements.length) {
      setReorderIds(allAnnouncements.map((a) => a.announcement_id));
    }
  }, [reorderOpen, allAnnouncements]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const resetForm = () => {
    setForm(emptyForm);
    setMediaPreview(null);
    setFormError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (a: Announcement) => {
    setEditing(a);
    setForm({
      title: a.title,
      all_floors: a.all_floors,
      floor_ids: (a.floors ?? []).map((f) => f.floor_id),
      message: a.message ?? "",
      duration_seconds: a.duration_seconds || 10,
      audio_enabled: a.audio_enabled,
      is_visible: a.is_visible,
      start_date: toLocalInput(a.start_date),
      end_date: toLocalInput(a.end_date),
      media: null,
    });
    const existing = resolveMediaUrl(a.media_url);
    if (existing && a.media_type) {
      setMediaPreview({ url: existing, type: a.media_type });
    } else {
      setMediaPreview(null);
    }
    setFormError(null);
    setDialogOpen(true);
  };

  const onFilePick = (file: File | null) => {
    if (!file) {
      setForm((f) => ({ ...f, media: null }));
      if (editing) {
        const existing = resolveMediaUrl(editing.media_url);
        if (existing && editing.media_type) {
          setMediaPreview({ url: existing, type: editing.media_type });
          return;
        }
      }
      setMediaPreview(null);
      return;
    }
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      setFormError("Only images and videos are supported.");
      return;
    }
    setForm((f) => ({ ...f, media: file }));
    const objectUrl = URL.createObjectURL(file);
    setMediaPreview({ url: objectUrl, type: isImage ? "image" : "video" });
    setFormError(null);
  };

  // Revoke temporary object URLs when the dialog closes or the preview
  // is replaced — otherwise the browser leaks the video/image blob.
  useEffect(() => {
    return () => {
      if (mediaPreview?.url.startsWith("blob:")) {
        URL.revokeObjectURL(mediaPreview.url);
      }
    };
    // Only run on unmount / preview change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaPreview?.url]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const title = form.title.trim();
    if (!title) return setFormError("Title is required.");
    if (!editing && !form.media) {
      return setFormError("Please upload an image or video.");
    }
    if (!form.all_floors && form.floor_ids.length === 0) {
      return setFormError("Choose at least one floor, or select All floors.");
    }
    if (form.duration_seconds < 1) {
      return setFormError("Duration must be at least 1 second.");
    }
    if (form.start_date && form.end_date) {
      if (new Date(form.start_date) > new Date(form.end_date)) {
        return setFormError("Start date must be before end date.");
      }
    }

    const payload = {
      title,
      all_floors: form.all_floors,
      floor_ids: form.all_floors ? [] : form.floor_ids,
      message: form.message.trim() || null,
      duration_seconds: form.duration_seconds,
      audio_enabled: form.audio_enabled,
      is_visible: form.is_visible,
      start_date: form.start_date
        ? new Date(form.start_date).toISOString()
        : null,
      end_date: form.end_date
        ? new Date(form.end_date).toISOString()
        : null,
      media: form.media,
    };

    try {
      if (editing) {
        await updateAnn({
          id: editing.announcement_id,
          data: payload,
        }).unwrap();
        toast.success("Announcement updated successfully.");
      } else {
        await createAnn(payload).unwrap();
        toast.success("Announcement created successfully.");
      }
      setDialogOpen(false);
      resetForm();
    } catch (err: unknown) {
      const anyErr = err as {
        data?: { message?: string; errors?: string[] };
      };
      const message =
        anyErr?.data?.message ||
        anyErr?.data?.errors?.[0] ||
        "Unable to save announcement.";
      setFormError(message);
      toast.error(message);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAnn(deleteTarget.announcement_id).unwrap();
      toast.success("Announcement deleted successfully.");
      setDeleteTarget(null);
    } catch (err: unknown) {
      const anyErr = err as { data?: { message?: string } };
      toast.error(anyErr?.data?.message ?? "Unable to delete announcement.");
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setReorderIds((current) => {
      const oldIndex = current.indexOf(active.id as string);
      const newIndex = current.indexOf(over.id as string);
      return arrayMove(current, oldIndex, newIndex);
    });
  };

  const saveReorder = async () => {
    if (reorderIds.length === 0) return;
    try {
      await reorderAnns({ ordered_ids: reorderIds }).unwrap();
      toast.success("Announcement order saved.");
      setReorderOpen(false);
    } catch (err: unknown) {
      const anyErr = err as { data?: { message?: string } };
      toast.error(anyErr?.data?.message ?? "Unable to save order.");
    }
  };

  const rows = data?.results ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  // Selection helpers — page-scoped. "Select all" toggles every row on the
  // currently visible page, so admins can act on filtered subsets safely.
  const pageIds = rows.map((r) => r.announcement_id);
  const pageSelectionCount = pageIds.filter((id) => selectedIds.has(id)).length;
  const allOnPageSelected =
    pageIds.length > 0 && pageSelectionCount === pageIds.length;
  const someOnPageSelected =
    pageSelectionCount > 0 && pageSelectionCount < pageIds.length;

  const toggleRowSelection = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };
  const toggleAllOnPage = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of pageIds) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  };
  const clearSelection = () => setSelectedIds(new Set());

  const runBulkVisibility = async (visible: boolean) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    try {
      const res = await bulkSetVisibility({
        ids,
        is_visible: visible,
      }).unwrap();
      toast.success(
        `${res.data.affected} announcement${res.data.affected === 1 ? "" : "s"} ${
          visible ? "will now play on kiosks." : "hidden from kiosks."
        }`
      );
      clearSelection();
    } catch (err: unknown) {
      const anyErr = err as { data?: { message?: string } };
      toast.error(anyErr?.data?.message ?? "Bulk update failed.");
    }
  };

  const toggleSingleRow = async (a: Announcement, next: boolean) => {
    try {
      await bulkSetVisibility({
        ids: [a.announcement_id],
        is_visible: next,
      }).unwrap();
    } catch (err: unknown) {
      const anyErr = err as { data?: { message?: string } };
      toast.error(anyErr?.data?.message ?? "Could not update.");
    }
  };

  const sortOption =
    SORT_OPTIONS.find((o) => o.value === sortBy) ?? SORT_OPTIONS[0];
  const changeSort = (col: string) => {
    const opt = SORT_OPTIONS.find((o) => o.value === col);
    setSortBy(col);
    setSortOrder(opt?.defaultOrder ?? "ASC");
    setPage(1);
  };
  const toggleSort = (col: string) => {
    if (sortBy === col) setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
    else changeSort(col);
  };
  const sortDirWord = sortOrder === "ASC" ? sortOption.asc : sortOption.desc;
  const counts = data?.counts;
  const sortIndicator = (col: string) =>
    sortBy === col ? (sortOrder === "ASC" ? " ↑" : " ↓") : "";

  const reorderById = (id: string) =>
    allAnnouncements.find((a) => a.announcement_id === id);

  return (
    <div className="space-y-4">
      <DataToolbar
        title="Announcements"
        description="Full-screen images and videos rotated on the public kiosk when the display mode includes announcements."
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Search title or caption…"
        filters={
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-admin-faint whitespace-nowrap">Sort by</span>
            <Select value={sortBy} onValueChange={changeSort}>
              <SelectTrigger className="w-40" aria-label="Sort by">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
                setPage(1);
              }}
              aria-label={`Sorted ${sortDirWord}. Click to reverse.`}
              title={`Sorted ${sortDirWord}`}
            >
              {sortOrder === "ASC" ? (
                <ArrowUpIcon className="h-4 w-4" />
              ) : (
                <ArrowDownIcon className="h-4 w-4" />
              )}
            </Button>
          </div>
        }
        right={
          <>
            <Button
              variant="outline"
              onClick={() => setReorderOpen(true)}
            >
              <ArrowUpDownIcon className="h-4 w-4" />
              Reorder
            </Button>
            <Button
              onClick={openCreate}
              className="bg-admin-accent hover:bg-admin-accent/90 text-black hover:text-black"
            >
              <PlusIcon className="h-4 w-4" />
              New Announcement
            </Button>
          </>
        }
      />

      {/* ─── Floor filter + status tabs ───────────────────────── */}
      <div className="space-y-3">
        <div
          className="flex flex-wrap items-center gap-1.5"
          role="group"
          aria-label="Filter by floor"
        >
          <span className="mr-1 text-xs text-admin-faint">Floor</span>
          {[
            { value: "any", label: "All" },
            { value: "all", label: "Set to all floors" },
            ...floors.map((f) => ({ value: f.floor_id, label: f.name })),
          ].map((o) => (
            <button
              key={o.value}
              type="button"
              aria-pressed={floorFilter === o.value}
              onClick={() => {
                setFloorFilter(o.value);
                setPage(1);
              }}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                floorFilter === o.value
                  ? "border-admin-active bg-admin-active/15 text-admin-accent-text"
                  : "border-admin-border text-admin-muted hover:border-admin-border-strong hover:text-admin-text"
              )}
            >
              {o.label}
            </button>
          ))}
        </div>

        <div
          className="flex gap-1 overflow-x-auto border-b border-admin-border"
          role="group"
          aria-label="Filter by status"
        >
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              aria-pressed={statusFilter === t.value}
              onClick={() => {
                setStatusFilter(t.value);
                setPage(1);
              }}
              className={cn(
                "-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                statusFilter === t.value
                  ? "border-admin-active text-admin-text"
                  : "border-transparent text-admin-faint hover:text-admin-text"
              )}
            >
              {t.label}
              <span className="ml-1.5 text-[11px] tabular-nums text-admin-faint">
                {counts?.[t.value] ?? 0}
              </span>
            </button>
          ))}
        </div>

        <p className="text-xs text-admin-faint">
          {total} announcement{total === 1 ? "" : "s"} · sorted by{" "}
          {sortOption.label.toLowerCase()}, {sortDirWord}
        </p>
      </div>

      {/* ─── Bulk action bar ────────────────────────────────────
          Only appears when at least one row across the current page is
          selected. Sticky so it stays visible while the admin scrolls a
          long list. */}
      {selectedIds.size > 0 && (
        <div className="sticky top-2 z-30 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-admin-active/30 bg-admin-surface/90 px-4 py-2.5 shadow-md backdrop-blur">
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-admin-accent text-black text-xs font-semibold tabular-nums">
              {selectedIds.size}
            </span>
            <span className="font-medium text-admin-accent-text">
              selected for bulk action
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => runBulkVisibility(true)}
              disabled={bulkUpdating}
              className="border-admin-ok/30 text-admin-ok bg-transparent hover:bg-admin-ok/15"
            >
              {bulkUpdating ? (
                <Loader2Icon className="h-4 w-4 animate-spin" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
              Show on display
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => runBulkVisibility(false)}
              disabled={bulkUpdating}
              className="border-admin-active/40 text-admin-accent-text bg-transparent hover:bg-admin-active/15"
            >
              {bulkUpdating ? (
                <Loader2Icon className="h-4 w-4 animate-spin" />
              ) : (
                <EyeOffIcon className="h-4 w-4" />
              )}
              Hide from display
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={clearSelection}
              className="text-admin-faint"
            >
              <XIcon className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-admin-border bg-admin-surface/80 backdrop-blur overflow-hidden shadow-xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 text-admin-accent-text">
                <RowCheckbox
                  checked={allOnPageSelected}
                  indeterminate={someOnPageSelected}
                  onCheckedChange={toggleAllOnPage}
                  ariaLabel="Select all rows on this page"
                />
              </TableHead>
              <TableHead className="w-24 text-admin-accent-text">Preview</TableHead>
              <TableHead
                className="cursor-pointer select-none text-admin-accent-text"
                onClick={() => toggleSort("title")}
              >
                Title{sortIndicator("title")}
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-admin-accent-text"
                onClick={() => toggleSort("floor")}
              >
                Floors{sortIndicator("floor")}
              </TableHead>
              <TableHead className="text-admin-accent-text">Type</TableHead>
              <TableHead
                className="cursor-pointer select-none text-admin-accent-text"
                onClick={() => toggleSort("end_date")}
              >
                Schedule{sortIndicator("end_date")}
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-admin-accent-text"
                onClick={() => toggleSort("status")}
              >
                Status{sortIndicator("status")}
              </TableHead>
              <TableHead className="text-admin-accent-text">On kiosks</TableHead>
              <TableHead
                className="cursor-pointer select-none text-admin-accent-text"
                onClick={() => toggleSort("display_order")}
              >
                #{sortIndicator("display_order")}
              </TableHead>
              <TableHead className="w-32 text-right text-admin-accent-text">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="border-admin-border">
                <TableCell colSpan={10} className="h-32 text-center">
                  <Loader2Icon className="mx-auto h-5 w-5 animate-spin text-admin-faint" />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow className="border-admin-border">
                <TableCell
                  colSpan={10}
                  className="h-32 text-center text-admin-faint"
                >
                  <div className="flex flex-col items-center gap-2">
                    <MegaphoneIcon className="h-6 w-6 opacity-40" />
                    {counts?.all === 0 && !debouncedSearch && floorFilter === "any" ? (
                      <span>
                        No announcements yet. Click{" "}
                        <span className="font-medium text-admin-accent-text">New Announcement</span>{" "}
                        to upload the first one.
                      </span>
                    ) : (
                      <span>No announcements match these filters.</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((a) => {
                const thumb = resolveMediaUrl(a.media_url);
                const isVideo = a.media_type === "video";
                const isSelected = selectedIds.has(a.announcement_id);
                return (
                  <TableRow
                    key={a.announcement_id}
                    className={cn("border-admin-border hover:bg-admin-raise", isSelected && "bg-admin-active/10")}
                  >
                    <TableCell>
                      <RowCheckbox
                        checked={isSelected}
                        onCheckedChange={(v) =>
                          toggleRowSelection(a.announcement_id, v)
                        }
                        ariaLabel={`Select ${a.title}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="h-12 w-16 rounded-lg overflow-hidden border border-admin-active/25 bg-black/70 flex items-center justify-center">
                        {!isVideo && thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumb}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : isVideo ? (
                          <FilmIcon className="h-5 w-5 text-admin-accent-text" />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-admin-text">{a.title}</p>
                      {a.message && (
                        <p className="text-[11px] text-admin-faint line-clamp-1 max-w-md">
                          {a.message}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <FloorBadges announcement={a} />
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                          isVideo
                            ? "bg-purple-100 text-purple-800"
                            : "bg-admin-info/10 text-admin-info"
                        )}
                      >
                        {isVideo ? (
                          <FilmIcon className="h-3 w-3" />
                        ) : (
                          <ImageIcon className="h-3 w-3" />
                        )}
                        {isVideo ? "Video" : "Image"}
                      </span>
                      {isVideo && a.audio_enabled && (
                        <span
                          className="ml-1 inline-flex items-center gap-1 rounded-full bg-admin-warn/10 px-2 py-0.5 text-[11px] font-medium text-admin-warn"
                          title="Video plays with sound"
                        >
                          <Volume2Icon className="h-3 w-3" />
                          Sound
                        </span>
                      )}
                      <p className="mt-1 text-[11px] text-admin-faint">
                        {isVideo ? "Full clip" : `${a.duration_seconds}s on screen`}
                      </p>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      <span className="inline-flex items-center gap-1 whitespace-nowrap">
                        <CalendarIcon className="h-3 w-3" />
                        {formatScheduleWindow(a)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusPill status={a.status} />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={a.is_visible}
                        onCheckedChange={(v) => toggleSingleRow(a, v)}
                        aria-label={
                          a.is_visible
                            ? `Hide ${a.title} from kiosks`
                            : `Show ${a.title} on kiosks`
                        }
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {a.display_order + 1}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(a)}
                        aria-label="Edit announcement"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(a)}
                        aria-label="Delete announcement"
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <div className="px-4 pb-3">
          <DataPagination
            total={total}
            currentPage={data?.currentPage ?? page}
            totalPages={totalPages}
            limit={PAGE_LIMIT}
            onPageChange={setPage}
          />
        </div>
      </div>

      {isFetching && !isLoading && (
        <p className="text-xs text-muted-foreground">Refreshing…</p>
      )}

      {/* ─── Create / edit dialog ─────────────────────────────── */}
      <Dialog
        open={dialogOpen}
        onOpenChange={submitting ? undefined : setDialogOpen}
      >
        <DialogContent className="sm:max-w-3xl p-0 gap-0 overflow-hidden max-h-[92vh] flex flex-col">
          <div className="relative overflow-hidden admin-dialog-hero px-6 pt-6 pb-5 shrink-0">
            <div
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 0%, #f4d47a 0, transparent 55%)",
              }}
            />
            <DialogHeader className="relative">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-admin-chip backdrop-blur border border-admin-border-strong flex items-center justify-center">
                  <MegaphoneIcon className="h-5 w-5 text-admin-accent-text" />
                </div>
                <div>
                  <DialogTitle className="text-admin-text">
                    {editing ? "Edit Announcement" : "New Announcement"}
                  </DialogTitle>
                  <p className="text-xs text-admin-muted mt-0.5">
                    Upload an image or video. It plays full-screen on the
                    floors you choose when their display mode includes
                    announcements.
                  </p>
                </div>
              </div>
            </DialogHeader>
          </div>

          <form
            id="announcement-form"
            onSubmit={onSubmit}
            className="flex-1 overflow-y-auto px-6 py-5 space-y-6"
          >
            {/* Media picker */}
            <section className="space-y-3">
              <SectionHeader
                icon={<UploadCloudIcon className="h-3.5 w-3.5" />}
                label="Media"
                subtitle={
                  editing
                    ? "Upload a new file to replace the current one, or leave empty to keep it."
                    : "Any image or video. No size limit."
                }
              />

              <label
                htmlFor="announcement-media"
                className={cn(
                  "block rounded-xl border-2 border-dashed transition-colors cursor-pointer overflow-hidden",
                  form.media
                    ? "border-admin-active bg-admin-active/10"
                    : "border-admin-active/30 hover:border-admin-active/60 bg-admin-raise"
                )}
              >
                {mediaPreview ? (
                  <div className="relative bg-black flex items-center justify-center max-h-72">
                    {mediaPreview.type === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mediaPreview.url}
                        alt="Preview"
                        className="max-h-72 max-w-full object-contain"
                      />
                    ) : (
                      <video
                        src={mediaPreview.url}
                        controls
                        muted
                        playsInline
                        className="max-h-72 max-w-full object-contain"
                      />
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                    <div className="h-12 w-12 rounded-full bg-admin-active/10 border border-admin-active/40 flex items-center justify-center">
                      <UploadCloudIcon className="h-5 w-5 text-admin-accent-text" />
                    </div>
                    <p className="text-sm font-medium text-admin-accent-text">
                      Click to choose an image or video
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Anything the browser can display — JPG, PNG, GIF, MP4,
                      WebM, MOV…
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  id="announcement-media"
                  type="file"
                  accept="image/*,video/*"
                  className="sr-only"
                  onChange={(e) => onFilePick(e.target.files?.[0] ?? null)}
                />
              </label>

              {form.media && (
                <div className="flex items-center justify-between rounded-md bg-admin-active/10 border border-admin-active/25 px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {form.media.type.startsWith("video/") ? (
                      <FilmIcon className="h-4 w-4 text-admin-accent-text shrink-0" />
                    ) : (
                      <ImageIcon className="h-4 w-4 text-admin-accent-text shrink-0" />
                    )}
                    <span className="text-xs truncate">
                      {form.media.name}{" "}
                      <span className="text-muted-foreground">
                        · {humanFileSize(form.media.size)}
                      </span>
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => onFilePick(null)}
                    className="h-7 text-xs"
                  >
                    Change
                  </Button>
                </div>
              )}
            </section>

            {/* Details */}
            <section className="space-y-4">
              <SectionHeader
                icon={<MegaphoneIcon className="h-3.5 w-3.5" />}
                label="Details"
                subtitle="Title is shown on the kiosk as a small chip. The caption is optional."
              />
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="title">
                    Title<span className="text-admin-bad ml-0.5">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    placeholder="e.g. Office Hours"
                    maxLength={200}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>
                  Show on floors<span className="text-admin-bad ml-0.5">*</span>
                </Label>
                <FloorTilesPicker
                  floors={floors}
                  allFloors={form.all_floors}
                  selectedIds={form.floor_ids}
                  onChange={(next) => setForm((f) => ({ ...f, ...next }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="message">Caption</Label>
                <Textarea
                  id="message"
                  value={form.message}
                  onChange={(e) =>
                    setForm({ ...form, message: e.target.value })
                  }
                  placeholder="Optional internal notes about this announcement."
                  rows={2}
                />
              </div>
            </section>

            {/* Playback + scheduling */}
            <section className="space-y-4">
              <SectionHeader
                icon={<CalendarIcon className="h-3.5 w-3.5" />}
                label="Playback & scheduling"
                subtitle="When it plays, how long it stays on screen, and whether the sound is on."
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="duration_seconds">
                    Duration for images (seconds)
                  </Label>
                  <Input
                    id="duration_seconds"
                    type="number"
                    min={1}
                    max={3600}
                    value={form.duration_seconds}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        duration_seconds:
                          Number.parseInt(e.target.value, 10) || 0,
                      })
                    }
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Videos play through to their end regardless of this
                    value.
                  </p>
                </div>
                <div className="flex flex-col justify-end gap-3">
                  <div className="flex items-center justify-between rounded-md border border-admin-border-strong bg-admin-raise px-3 py-2">
                    <div>
                      <Label className="text-xs font-medium text-admin-text">Visible</Label>
                      <p className="text-[11px] text-muted-foreground">
                        Off = hidden from every kiosk, kept as a template.
                      </p>
                    </div>
                    <Switch
                      checked={form.is_visible}
                      onCheckedChange={(v) =>
                        setForm({ ...form, is_visible: v })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-admin-border-strong bg-admin-raise px-3 py-2">
                    <div>
                      <Label className="text-xs font-medium text-admin-text">
                        Video sound
                      </Label>
                      <p className="text-[11px] text-muted-foreground">
                        Only affects videos. Kiosks with no speakers ignore
                        it.
                      </p>
                    </div>
                    <Switch
                      checked={form.audio_enabled}
                      onCheckedChange={(v) =>
                        setForm({ ...form, audio_enabled: v })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="start_date">
                    Start date <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    value={form.start_date}
                    onChange={(e) =>
                      setForm({ ...form, start_date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="end_date">
                    End date <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={form.end_date}
                    onChange={(e) =>
                      setForm({ ...form, end_date: e.target.value })
                    }
                  />
                </div>
              </div>
            </section>

            {formError && (
              <p className="text-sm text-destructive rounded-md bg-admin-bad/10 border border-admin-bad/30 px-3 py-2">
                {formError}
              </p>
            )}
          </form>

          <div className="shrink-0 border-t border-admin-border bg-admin-surface px-6 py-3">
            <DialogFooter className="!m-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="announcement-form"
                disabled={submitting}
                className="bg-admin-accent hover:bg-admin-accent/90 text-black hover:text-black"
              >
                {submitting && (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editing ? "Save changes" : "Create announcement"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Reorder dialog ─────────────────────────────────────── */}
      <Dialog
        open={reorderOpen}
        onOpenChange={savingOrder ? undefined : setReorderOpen}
      >
        <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden max-h-[92vh] flex flex-col">
          <div className="relative overflow-hidden admin-dialog-hero px-6 pt-6 pb-5 shrink-0">
            <div
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 0%, #f4d47a 0, transparent 55%)",
              }}
            />
            <DialogHeader className="relative">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-admin-chip backdrop-blur border border-admin-border-strong flex items-center justify-center">
                  <ArrowUpDownIcon className="h-5 w-5 text-admin-accent-text" />
                </div>
                <div>
                  <DialogTitle className="text-admin-text">
                    Reorder announcements
                  </DialogTitle>
                  <p className="text-xs text-admin-muted mt-0.5">
                    Drag any item to change the order they play on the
                    kiosk carousel.
                  </p>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {fetchingAll ? (
              <div className="rounded-xl border border-admin-active/25 bg-admin-raise p-8 text-center">
                <Loader2Icon className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                <p className="mt-2 text-xs text-muted-foreground">
                  Loading announcements…
                </p>
              </div>
            ) : reorderIds.length === 0 ? (
              <div className="rounded-xl border border-dashed border-admin-active/40 bg-admin-active/10 p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No announcements to reorder.
                </p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={reorderIds}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {reorderIds.map((id, idx) => {
                      const a = reorderById(id);
                      if (!a) return null;
                      return (
                        <SortableRow
                          key={id}
                          announcement={a}
                          position={idx + 1}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {reorderIds.length > 0 && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <GripVerticalIcon className="h-3 w-3" />
                Grab any handle to drag up or down. The number badge shows
                the play position.
              </p>
            )}
          </div>

          <div className="shrink-0 border-t border-admin-border bg-admin-surface px-6 py-3">
            <DialogFooter className="!m-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setReorderOpen(false)}
                disabled={savingOrder}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={savingOrder || reorderIds.length === 0}
                onClick={saveReorder}
                className="bg-admin-accent hover:bg-admin-accent/90 text-black hover:text-black"
              >
                {savingOrder && (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save order
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete announcement"
        description={
          deleteTarget ? (
            <>
              This will permanently delete{" "}
              <span className="font-medium">{deleteTarget.title}</span> and
              remove the media file from disk.
            </>
          ) : null
        }
        confirmLabel="Delete announcement"
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
