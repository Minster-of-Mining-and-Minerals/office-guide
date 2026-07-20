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
  Building2Icon,
  HashIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  ToggleRightIcon,
  Trash2Icon,
} from "lucide-react";
import { DataToolbar } from "@/components/common/DataToolbar";
import { DataPagination } from "@/components/common/DataPagination";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { FormSectionHeader as SectionHeader } from "@/components/common/FormSectionHeader";
import { PairedBilingualField } from "@/components/common/PairedBilingualField";
import {
  useCreateFloorMutation,
  useDeleteFloorMutation,
  useGetFloorsQuery,
  useUpdateFloorMutation,
} from "@/redux/api/floorApi";
import type { Floor } from "@/redux/types/signage";

const PAGE_LIMIT = 10;

interface FormState {
  floor_number: string;
  name: string;
  name_am: string;
  is_active: boolean;
}

const emptyForm: FormState = {
  floor_number: "",
  name: "Floor",
  name_am: "ደረጃ",
  is_active: true,
};

export default function FloorsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState<"all" | "true" | "false">(
    "all"
  );
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>("floor_number");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const queryParams = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      is_active:
        isActiveFilter === "all" ? undefined : isActiveFilter === "true",
      page,
      limit: PAGE_LIMIT,
      sort_by: sortBy,
      sort_order: sortOrder,
    }),
    [debouncedSearch, isActiveFilter, page, sortBy, sortOrder]
  );

  const { data, isLoading, isFetching } = useGetFloorsQuery(queryParams);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Floor | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const [createFloor, { isLoading: creating }] = useCreateFloorMutation();
  const [updateFloor, { isLoading: updating }] = useUpdateFloorMutation();
  const submitting = creating || updating;

  const [deleteTarget, setDeleteTarget] = useState<Floor | null>(null);
  const [deleteFloor, { isLoading: deleting }] = useDeleteFloorMutation();

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (floor: Floor) => {
    setEditing(floor);
    setForm({
      floor_number: String(floor.floor_number),
      name: floor.name,
      name_am: floor.name_am ?? "",
      is_active: floor.is_active,
    });
    setFormError(null);
    setDialogOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const floor_number = Number.parseInt(form.floor_number, 10);
    if (!Number.isFinite(floor_number)) {
      setFormError("Floor number must be a whole number.");
      return;
    }
    if (!form.name.trim()) {
      setFormError("Floor name is required.");
      return;
    }
    if (!form.name_am.trim()) {
      setFormError("Amharic floor name is required.");
      return;
    }

    const payload = {
      floor_number,
      name: form.name.trim(),
      name_am: form.name_am.trim(),
      is_active: form.is_active,
    };

    try {
      if (editing) {
        await updateFloor({ id: editing.floor_id, data: payload }).unwrap();
        toast.success("Floor updated successfully.");
      } else {
        await createFloor(payload).unwrap();
        toast.success("Floor created successfully.");
      }
      setDialogOpen(false);
    } catch (err: any) {
      const message =
        err?.data?.message ||
        err?.data?.errors?.[0] ||
        "Unable to save floor.";
      setFormError(message);
      toast.error(message);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteFloor(deleteTarget.floor_id).unwrap();
      toast.success("Floor deleted successfully.");
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Unable to delete floor.");
    }
  };

  const rows = data?.results ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const toggleSort = (col: string) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
    } else {
      setSortBy(col);
      setSortOrder("ASC");
    }
  };

  const sortIndicator = (col: string) =>
    sortBy === col ? (sortOrder === "ASC" ? " ↑" : " ↓") : "";

  return (
    <div className="space-y-4">
      <DataToolbar
        title="Floors"
        description="Building floors used to group offices and displays."
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Search floor name…"
        filters={
          <Select
            value={isActiveFilter}
            onValueChange={(v) => {
              setIsActiveFilter(v as any);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        }
        right={
          <Button
            onClick={openCreate}
            className="bg-golden-classic hover:bg-golden-soft text-black hover:text-black"
          >
            <PlusIcon className="h-4 w-4" />
            New Floor
          </Button>
        }
      />

      <div className="rounded-xl border border-white/10 bg-[#0D1F3C]/80 backdrop-blur overflow-hidden shadow-xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-golden-classic/70 cursor-pointer select-none" onClick={() => toggleSort("floor_number")}>
                # {sortIndicator("floor_number")}
              </TableHead>
              <TableHead className="text-golden-classic/70 cursor-pointer select-none" onClick={() => toggleSort("name")}>
                Name{sortIndicator("name")}
              </TableHead>
              <TableHead className="text-golden-classic/70">Status</TableHead>
              <TableHead className="w-32 text-right text-golden-classic/70">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="border-white/5">
                <TableCell colSpan={4} className="h-32 text-center">
                  <Loader2Icon className="mx-auto h-5 w-5 animate-spin text-white/40" />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow className="border-white/5">
                <TableCell colSpan={4} className="h-32 text-center text-white/40">
                  No floors match your filters.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((f) => (
                <TableRow key={f.floor_id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="font-bold text-white tabular-nums">{f.floor_number}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-white">
                      <span>{f.name}</span>
                      {f.name_am ? (
                        <span
                          title="Amharic translation present"
                          className="inline-flex items-center gap-0.5 rounded-full bg-white/5 border border-white/20 px-1.5 py-0.5 text-[10px] font-semibold text-golden-classic"
                          lang="am-ET"
                        >
                          አማ ✓
                        </span>
                      ) : (
                        <span
                          title="Amharic translation missing"
                          className="inline-flex items-center gap-0.5 rounded-full bg-destructive/10 border border-destructive/20 px-1.5 py-0.5 text-[10px] font-semibold text-destructive"
                          lang="am-ET"
                        >
                          አማ !
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        f.is_active
                          ? "inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/30"
                          : "inline-flex items-center rounded-full bg-white/5 px-2 py-0.5 text-xs font-medium text-white/40 border border-white/10"
                      }
                    >
                      {f.is_active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(f)}
                      aria-label="Edit floor"
                      className="text-white/70 hover:text-golden-classic hover:bg-golden-classic/10"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteTarget(f)}
                      aria-label="Delete floor"
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
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

      <Dialog
        open={dialogOpen}
        onOpenChange={submitting ? undefined : setDialogOpen}
      >
        <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
          {/* Header — gradient bar + icon + subtitle */}
          <div className="relative overflow-hidden bg-gradient-to-r from-golden-dark via-[#8b6a1a] to-golden-dark text-white px-6 pt-6 pb-5">
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
                  <Building2Icon className="h-5 w-5 text-golden-classic" />
                </div>
                <div>
                  <DialogTitle className="text-white">
                    {editing ? "Edit Floor" : "New Floor"}
                  </DialogTitle>
                  <p className="text-xs text-white/70 mt-0.5">
                    {editing
                      ? "Update the floor number, display name, or activity status."
                      : "Add a new floor to the building. Both English and Amharic names are required."}
                  </p>
                </div>
              </div>
            </DialogHeader>
          </div>

          <form onSubmit={onSubmit} className="px-6 py-5 space-y-6">
            {/* ── Section 1: Basics ── */}
            <section className="space-y-4">
              <SectionHeader
                icon={<HashIcon className="h-3.5 w-3.5" />}
                label="Basics"
              />
              <div className="space-y-1.5">
                <Label htmlFor="floor_number">
                  Floor number
                  <span className="text-red-500 ml-0.5">*</span>
                </Label>
                <Input
                  id="floor_number"
                  type="number"
                  value={form.floor_number}
                  onChange={(e) =>
                    setForm({ ...form, floor_number: e.target.value })
                  }
                  placeholder="0 for Ground, 1, 2…"
                  required
                  className="max-w-[220px]"
                />
                <p className="text-[11px] text-muted-foreground">
                  Use <span className="font-medium">0</span> for the ground
                  floor. Basement floors use negative numbers.
                </p>
              </div>
            </section>

            {/* ── Section 2: Bilingual name ── */}
            <section className="space-y-4">
              <SectionHeader
                icon={<Building2Icon className="h-3.5 w-3.5" />}
                label="Display name"
                subtitle="Shown on filter chips and card badges."
              />
              <PairedBilingualField
                label="Floor name"
                required
                valueEn={form.name}
                valueAm={form.name_am}
                onChangeEn={(v) => setForm({ ...form, name: v })}
                onChangeAm={(v) => setForm({ ...form, name_am: v })}
                placeholderEn="Ground Floor"
                placeholderAm="የመሬት ወለል"
                id="name"
              />
            </section>

            {/* ── Section 3: Status ── */}
            <section className="space-y-3">
              <SectionHeader
                icon={<ToggleRightIcon className="h-3.5 w-3.5" />}
                label="Status"
              />
              <label
                htmlFor="is_active"
                className="flex items-start gap-3 rounded-xl border border-golden-classic/25 bg-white p-3 hover:bg-golden-metallic/30 cursor-pointer transition-colors"
              >
                <input
                  id="is_active"
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm({ ...form, is_active: e.target.checked })
                  }
                  className="mt-1 h-4 w-4 accent-golden-dark"
                />
                <div>
                  <p className="text-sm font-medium text-golden-dark">
                    Active
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Inactive floors are hidden from the public office guide
                    and filter chips.
                  </p>
                </div>
              </label>
            </section>

            {formError && (
              <p className="text-sm text-destructive rounded-md bg-red-50 border border-red-200 px-3 py-2">
                {formError}
              </p>
            )}

            <DialogFooter className="pt-2 border-t border-golden-classic/15">
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
                disabled={submitting}
                className="bg-golden-classic hover:bg-golden-soft text-black hover:text-black"
              >
                {submitting && (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editing ? "Save changes" : "Create floor"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete floor"
        description={
          deleteTarget ? (
            <>
              This will permanently delete{" "}
              <span className="font-medium">{deleteTarget.name}</span>. If any
              offices still reference this floor, the delete will be blocked.
            </>
          ) : null
        }
        confirmLabel="Delete floor"
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
