"use client";

import { useEffect, useMemo, useState } from "react";
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
import { PairedBilingualField } from "@/components/common/PairedBilingualField";
import { PairedServicesEditor } from "@/components/common/PairedServicesEditor";
import { FormSectionHeader as SectionHeader } from "@/components/common/FormSectionHeader";
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
  ArrowUpDownIcon,
  DoorOpenIcon,
  FileTextIcon,
  GripVerticalIcon,
  LayersIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  SparklesIcon,
  Trash2Icon,
  UserIcon,
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
import { useGetAllFloorsQuery } from "@/redux/api/floorApi";
import {
  useCreateOfficeMutation,
  useDeleteOfficeMutation,
  useGetAllOfficesByFloorQuery,
  useGetOfficesQuery,
  useReorderOfficesMutation,
  useUpdateOfficeMutation,
} from "@/redux/api/officeApi";
import type { Office } from "@/redux/types/signage";

const PAGE_LIMIT = 10;

interface FormState {
  floor_id: string;
  name: string;
  name_am: string;
  department: string;
  department_am: string;
  contact_person: string;
  contact_person_am: string;
  room_number: string;
  description: string;
  description_am: string;
  services: string[];
  services_am: string[];
}

const emptyForm: FormState = {
  floor_id: "",
  name: "",
  name_am: "",
  department: "",
  department_am: "",
  contact_person: "",
  contact_person_am: "",
  room_number: "",
  description: "",
  description_am: "",
  services: [],
  services_am: [],
};

const MAX_SERVICES = 20;

/**
 * Consistent "Name · N" label used in every floor picker across this page
 * (list filter, create/edit modal, reorder modal). Ground floor is shown as
 * `G` to match the public office guide.
 */
const formatFloorLabel = (f: { name: string; floor_number: number }) =>
  `${f.name} · ${f.floor_number === 0 ? "G" : f.floor_number}`;

// ─── Reorder sub-component ──────────────────────────────────────────

interface SortableRowProps {
  office: Office;
}

function SortableRow({
  office,
  position,
}: SortableRowProps & { position: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: office.office_id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 rounded-xl border bg-white p-3 transition-all ${
        isDragging
          ? "border-golden-classic shadow-lg ring-2 ring-golden-classic/40 opacity-95"
          : "border-golden-classic/25 hover:border-golden-classic/60 hover:shadow-sm"
      }`}
    >
      {/* Drag handle + position badge */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-golden-dark hover:bg-golden-metallic p-1.5 rounded-md transition-colors"
          {...attributes}
          {...listeners}
          aria-label={`Drag ${office.name} to reorder`}
        >
          <GripVerticalIcon className="h-4 w-4" />
        </button>
        <span className="h-7 w-7 rounded-full bg-golden-metallic border border-golden-classic/40 text-golden-dark text-xs font-semibold flex items-center justify-center tabular-nums">
          {position}
        </span>
      </div>

      {/* Room chip */}
      <span className="shrink-0 inline-flex items-center rounded-lg bg-golden-classic/15 border border-golden-classic/40 text-golden-dark px-2 py-1 text-xs font-mono font-semibold tabular-nums">
        {office.room_number}
      </span>

      {/* Name + department */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{office.name}</p>
        {office.department && (
          <p className="text-[11px] text-muted-foreground truncate">
            {office.department}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────

export default function OfficesPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [floorFilter, setFloorFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("display_order");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: floors = [] } = useGetAllFloorsQuery();

  const queryParams = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      floor_id: floorFilter === "all" ? undefined : floorFilter,
      page,
      limit: PAGE_LIMIT,
      sort_by: sortBy,
      sort_order: sortOrder,
    }),
    [debouncedSearch, floorFilter, page, sortBy, sortOrder]
  );

  const { data, isLoading, isFetching } = useGetOfficesQuery(queryParams);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Office | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const [createOffice, { isLoading: creating }] = useCreateOfficeMutation();
  const [updateOffice, { isLoading: updating }] = useUpdateOfficeMutation();
  const submitting = creating || updating;

  const [deleteTarget, setDeleteTarget] = useState<Office | null>(null);
  const [deleteOffice, { isLoading: deleting }] = useDeleteOfficeMutation();

  // Reorder dialog state
  const [reorderOpen, setReorderOpen] = useState(false);
  const [reorderFloorId, setReorderFloorId] = useState<string>("");
  const [reorderIds, setReorderIds] = useState<string[]>([]);
  const { data: floorOffices = [], isFetching: fetchingFloorOffices } =
    useGetAllOfficesByFloorQuery(reorderFloorId, { skip: !reorderFloorId });
  const [reorderOffices, { isLoading: savingOrder }] =
    useReorderOfficesMutation();

  useEffect(() => {
    if (reorderOpen && floorOffices.length) {
      setReorderIds(floorOffices.map((o) => o.office_id));
    }
  }, [reorderOpen, floorOffices]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      floor_id: floorFilter !== "all" ? floorFilter : floors[0]?.floor_id ?? "",
    });
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (office: Office) => {
    setEditing(office);
    setForm({
      floor_id: office.floor_id,
      name: office.name,
      name_am: office.name_am ?? "",
      department: office.department ?? "",
      department_am: office.department_am ?? "",
      contact_person: office.contact_person ?? "",
      contact_person_am: office.contact_person_am ?? "",
      room_number: office.room_number,
      description: office.description ?? "",
      description_am: office.description_am ?? "",
      services: office.services ?? [],
      services_am: office.services_am ?? [],
    });
    setFormError(null);
    setDialogOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.floor_id) return setFormError("Floor is required.");
    if (!form.name.trim()) return setFormError("Office name is required.");
    if (!form.name_am.trim())
      return setFormError("Amharic office name is required.");
    if (!form.room_number.trim())
      return setFormError("Room number is required.");

    // Optional field pairs — both sides must be filled if either is.
    const pair = (
      en: string,
      am: string,
      label: string
    ): string | null => {
      const hasEn = en.trim().length > 0;
      const hasAm = am.trim().length > 0;
      if (hasEn && !hasAm) return `Amharic ${label} is required.`;
      if (!hasEn && hasAm) return `English ${label} is required.`;
      return null;
    };
    const pairErr =
      pair(form.department, form.department_am, "department") ||
      pair(form.contact_person, form.contact_person_am, "contact person") ||
      pair(form.description, form.description_am, "description");
    if (pairErr) return setFormError(pairErr);

    if (form.services.length !== form.services_am.length) {
      return setFormError(
        "Amharic services must be paired with English services."
      );
    }

    const payload = {
      floor_id: form.floor_id,
      name: form.name.trim(),
      name_am: form.name_am.trim(),
      department: form.department.trim() || null,
      department_am: form.department_am.trim() || null,
      contact_person: form.contact_person.trim() || null,
      contact_person_am: form.contact_person_am.trim() || null,
      room_number: form.room_number.trim(),
      description: form.description.trim() || null,
      description_am: form.description_am.trim() || null,
      services: form.services,
      services_am: form.services_am,
    };

    try {
      if (editing) {
        await updateOffice({ id: editing.office_id, data: payload }).unwrap();
        toast.success("Office updated successfully.");
      } else {
        await createOffice(payload).unwrap();
        toast.success("Office created successfully.");
      }
      setDialogOpen(false);
    } catch (err: any) {
      const message =
        err?.data?.message ||
        err?.data?.errors?.[0] ||
        "Unable to save office.";
      setFormError(message);
      toast.error(message);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteOffice(deleteTarget.office_id).unwrap();
      toast.success("Office deleted successfully.");
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Unable to delete office.");
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
    if (!reorderFloorId || reorderIds.length === 0) return;
    try {
      await reorderOffices({
        floor_id: reorderFloorId,
        ordered_ids: reorderIds,
      }).unwrap();
      toast.success("Office order saved.");
      setReorderOpen(false);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Unable to save order.");
    }
  };

  const rows = data?.results ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const toggleSort = (col: string) => {
    if (sortBy === col) setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
    else {
      setSortBy(col);
      setSortOrder("ASC");
    }
  };
  const sortIndicator = (col: string) =>
    sortBy === col ? (sortOrder === "ASC" ? " ↑" : " ↓") : "";

  const reorderOffice = (id: string) =>
    floorOffices.find((o) => o.office_id === id);

  return (
    <div className="space-y-4">
      <DataToolbar
        title="Offices"
        description="Offices are grouped by floor and rendered on kiosk screens in their configured order."
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Search name, department, or room number…"
        filters={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={floorFilter === "all" ? "default" : "outline"}
              onClick={() => {
                setFloorFilter("all");
                setPage(1);
              }}
              size="sm"
              className={floorFilter === "all" ? "bg-golden-classic text-black hover:bg-golden-classic/80" : ""}
            >
              All floors
            </Button>
            {floors.map((f) => (
              <Button
                key={f.floor_id}
                variant={floorFilter === f.floor_id ? "default" : "outline"}
                onClick={() => {
                  setFloorFilter(f.floor_id);
                  setPage(1);
                }}
                size="sm"
                className={floorFilter === f.floor_id ? "bg-golden-classic text-black hover:bg-golden-classic/80" : ""}
              >
                {formatFloorLabel(f)}
              </Button>
            ))}
          </div>
        }
        right={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setReorderFloorId(
                  floorFilter !== "all"
                    ? floorFilter
                    : floors[0]?.floor_id ?? ""
                );
                setReorderOpen(true);
              }}
              disabled={floors.length === 0}
            >
              <ArrowUpDownIcon className="h-4 w-4" />
              Reorder
            </Button>
            <Button
              onClick={openCreate}
              className="bg-golden-classic hover:bg-golden-soft text-black hover:text-black"
              disabled={floors.length === 0}
            >
              <PlusIcon className="h-4 w-4" />
              New Office
            </Button>
          </>
        }
      />

      <div className="rounded-xl border border-white/10 bg-[#0D1F3C]/80 backdrop-blur overflow-hidden shadow-xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-golden-classic/70 cursor-pointer select-none" onClick={() => toggleSort("room_number")}>
                Room #{sortIndicator("room_number")}
              </TableHead>
              <TableHead className="text-golden-classic/70 cursor-pointer select-none" onClick={() => toggleSort("name")}>
                Office{sortIndicator("name")}
              </TableHead>
              <TableHead className="text-golden-classic/70">Department</TableHead>
              <TableHead className="text-golden-classic/70">Contact</TableHead>
              <TableHead className="text-golden-classic/70">Floor</TableHead>
              <TableHead className="text-golden-classic/70 cursor-pointer select-none" onClick={() => toggleSort("display_order")}>
                Order{sortIndicator("display_order")}
              </TableHead>
              <TableHead className="w-32 text-right text-golden-classic/70">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="border-white/5">
                <TableCell colSpan={7} className="h-32 text-center">
                  <Loader2Icon className="mx-auto h-5 w-5 animate-spin text-white/40" />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow className="border-white/5">
                <TableCell colSpan={7} className="h-32 text-center text-white/40">
                  No offices match your filters.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((o) => {
                const amComplete =
                  Boolean(o.name_am) &&
                  (!o.department || Boolean(o.department_am)) &&
                  (!o.contact_person || Boolean(o.contact_person_am)) &&
                  (!o.description || Boolean(o.description_am)) &&
                  (o.services?.length ?? 0) ===
                    (o.services_am?.length ?? 0);
                return (
                <TableRow key={o.office_id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="font-bold text-white">{o.room_number}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{o.name}</span>
                      {amComplete ? (
                        <span
                          title="Amharic translations present"
                          className="inline-flex items-center gap-0.5 rounded-full bg-white/5 border border-white/20 px-1.5 py-0.5 text-[10px] font-semibold text-golden-classic"
                          lang="am-ET"
                        >
                          አማ ✓
                        </span>
                      ) : (
                        <span
                          title="Amharic translation incomplete"
                          className="inline-flex items-center gap-0.5 rounded-full bg-destructive/10 border border-destructive/20 px-1.5 py-0.5 text-[10px] font-semibold text-destructive"
                          lang="am-ET"
                        >
                          አማ !
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-white/60">
                    {o.department || "—"}
                  </TableCell>
                  <TableCell className="text-white/60">
                    {o.contact_person || "—"}
                  </TableCell>
                  <TableCell className="text-white/70">{o.floor?.name ?? "—"}</TableCell>
                  <TableCell className="text-white/40">
                    {o.display_order}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(o)}
                      aria-label="Edit office"
                      className="text-white/70 hover:text-golden-classic hover:bg-golden-classic/10"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteTarget(o)}
                      aria-label="Delete office"
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
        <p className="text-xs text-white/40">Refreshing…</p>
      )}

      {/* Create / edit dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={submitting ? undefined : setDialogOpen}
      >
        <DialogContent className="sm:max-w-4xl p-0 gap-0 overflow-hidden max-h-[92vh] flex flex-col">
          {/* Gradient header */}
          <div className="relative overflow-hidden bg-gradient-to-r from-golden-dark via-[#8b6a1a] to-golden-dark text-white px-6 pt-6 pb-5 shrink-0">
            <div
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 0%, #f4d47a 0, transparent 55%)",
              }}
            />
            <DialogHeader className="relative">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur border border-white/25 flex items-center justify-center">
                  <DoorOpenIcon className="h-5 w-5 text-golden-classic" />
                </div>
                <div>
                  <DialogTitle className="text-white">
                    {editing ? "Edit Office" : "New Office"}
                  </DialogTitle>
                  <p className="text-xs text-white/70 mt-0.5">
                    Fill in both English and Amharic. Services are optional
                    but recommended for every office.
                  </p>
                </div>
              </div>
            </DialogHeader>
          </div>

          <form
            id="office-form"
            onSubmit={onSubmit}
            className="flex-1 overflow-y-auto px-6 py-5 space-y-6"
          >
            {/* ── Section 1: Location ── */}
            <section className="space-y-3">
              <SectionHeader
                icon={<LayersIcon className="h-3.5 w-3.5" />}
                label="Location"
                subtitle="Where is this office?"
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <Label>
                    Floor
                    <span className="text-red-500 ml-0.5">*</span>
                  </Label>
                  <Select
                    value={form.floor_id}
                    onValueChange={(v) => setForm({ ...form, floor_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a floor" />
                    </SelectTrigger>
                    <SelectContent>
                      {floors.map((f) => (
                        <SelectItem key={f.floor_id} value={f.floor_id}>
                          {formatFloorLabel(f)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="room_number">
                    Room number
                    <span className="text-red-500 ml-0.5">*</span>
                  </Label>
                  <Input
                    id="room_number"
                    value={form.room_number}
                    onChange={(e) =>
                      setForm({ ...form, room_number: e.target.value })
                    }
                    placeholder="e.g. G-01"
                    required
                  />
                </div>
              </div>
            </section>

            {/* ── Section 2: Identity ── */}
            <section className="space-y-4">
              <SectionHeader
                icon={<DoorOpenIcon className="h-3.5 w-3.5" />}
                label="Identity"
                subtitle="Names shown on the office card."
              />
              <PairedBilingualField
                label="Office name"
                required
                valueEn={form.name}
                valueAm={form.name_am}
                onChangeEn={(v) => setForm({ ...form, name: v })}
                onChangeAm={(v) => setForm({ ...form, name_am: v })}
                placeholderEn="e.g. Records"
                placeholderAm="ለምሳሌ. መዝገብ ቤት"
                id="office_name"
              />
            </section>

            {/* ── Section 3: People ── */}
            <section className="space-y-4">
              <SectionHeader
                icon={<UserIcon className="h-3.5 w-3.5" />}
                label="People"
                subtitle="Optional contact for walk-ins."
              />
              <PairedBilingualField
                label="Contact person"
                hint="Optional"
                valueEn={form.contact_person}
                valueAm={form.contact_person_am}
                onChangeEn={(v) => setForm({ ...form, contact_person: v })}
                onChangeAm={(v) =>
                  setForm({ ...form, contact_person_am: v })
                }
                placeholderEn="e.g. Ms. Selam Bekele"
                placeholderAm="ለምሳሌ. ወ/ት ሰላም በቀለ"
              />
            </section>



            {/* ── Section 5: Services ── */}
            <section className="space-y-3">
              <SectionHeader
                icon={<SparklesIcon className="h-3.5 w-3.5" />}
                label="Services"
                subtitle="What can visitors get done here?"
              />
              <PairedServicesEditor
                servicesEn={form.services}
                servicesAm={form.services_am}
                max={MAX_SERVICES}
                onChange={(en, am) =>
                  setForm({ ...form, services: en, services_am: am })
                }
              />
            </section>

            {formError && (
              <p className="text-sm text-destructive rounded-md bg-red-50 border border-red-200 px-3 py-2">
                {formError}
              </p>
            )}
          </form>

          {/* Sticky footer so save button is always reachable in tall forms */}
          <div className="shrink-0 border-t border-golden-classic/15 bg-white px-6 py-3">
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
                form="office-form"
                disabled={submitting}
                className="bg-golden-classic hover:bg-golden-soft text-black hover:text-black"
              >
                {submitting && (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editing ? "Save changes" : "Create office"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reorder dialog */}
      <Dialog
        open={reorderOpen}
        onOpenChange={savingOrder ? undefined : setReorderOpen}
      >
        <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden max-h-[92vh] flex flex-col">
          {/* Gradient header — matches Floor/Office create dialogs */}
          <div className="relative overflow-hidden bg-gradient-to-r from-golden-dark via-[#8b6a1a] to-golden-dark text-white px-6 pt-6 pb-5 shrink-0">
            <div
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 0%, #f4d47a 0, transparent 55%)",
              }}
            />
            <DialogHeader className="relative">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur border border-white/25 flex items-center justify-center">
                  <ArrowUpDownIcon className="h-5 w-5 text-golden-classic" />
                </div>
                <div>
                  <DialogTitle className="text-white">
                    Reorder offices
                  </DialogTitle>
                  <p className="text-xs text-white/70 mt-0.5">
                    Drag any office to change the order visitors see on the
                    public guide.
                  </p>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Floor picker */}
            <section className="space-y-3">
              <SectionHeader
                icon={<LayersIcon className="h-3.5 w-3.5" />}
                label="Floor"
                subtitle="Pick which floor's offices to sort."
              />
              <Select
                value={reorderFloorId}
                onValueChange={(v) => {
                  setReorderFloorId(v);
                  setReorderIds([]);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a floor" />
                </SelectTrigger>
                <SelectContent>
                  {floors.map((f) => (
                    <SelectItem key={f.floor_id} value={f.floor_id}>
                      {formatFloorLabel(f)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </section>

            {/* Sortable list */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <SectionHeader
                  icon={<GripVerticalIcon className="h-3.5 w-3.5" />}
                  label="Order"
                  subtitle={
                    reorderIds.length > 0
                      ? `${reorderIds.length} office${
                          reorderIds.length === 1 ? "" : "s"
                        } on this floor`
                      : undefined
                  }
                />
              </div>

              {fetchingFloorOffices ? (
                <div className="rounded-xl border border-golden-classic/25 bg-white p-8 text-center">
                  <Loader2Icon className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Loading offices…
                  </p>
                </div>
              ) : !reorderFloorId ? (
                <div className="rounded-xl border border-dashed border-golden-classic/40 bg-golden-metallic/20 p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Choose a floor above to see its offices.
                  </p>
                </div>
              ) : reorderIds.length === 0 ? (
                <div className="rounded-xl border border-dashed border-golden-classic/40 bg-golden-metallic/20 p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No offices on this floor yet.
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
                        const o = reorderOffice(id);
                        if (!o) return null;
                        return (
                          <SortableRow
                            key={id}
                            office={o}
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
                  Grab any handle and drag up or down. The number badge shows
                  the new position.
                </p>
              )}
            </section>
          </div>

          {/* Sticky footer */}
          <div className="shrink-0 border-t border-golden-classic/15 bg-white px-6 py-3">
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
                className="bg-golden-classic hover:bg-golden-soft text-black hover:text-black"
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
        title="Delete office"
        description={
          deleteTarget ? (
            <>
              This will permanently delete{" "}
              <span className="font-medium">{deleteTarget.name}</span> from{" "}
              <span className="font-medium">
                {deleteTarget.floor?.name ?? "its floor"}
              </span>
              .
            </>
          ) : null
        }
        confirmLabel="Delete office"
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
