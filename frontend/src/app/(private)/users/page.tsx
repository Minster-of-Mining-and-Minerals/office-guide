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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  KeyRoundIcon,
  Loader2Icon,
  MailIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PhoneIcon,
  PowerIcon,
  ShieldIcon,
  Trash2Icon,
  UserPlusIcon,
  UserRoundIcon,
} from "lucide-react";
import { DataToolbar } from "@/components/common/DataToolbar";
import { DataPagination } from "@/components/common/DataPagination";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { UserFormDialog } from "@/components/common/UserFormDialog";
import {
  useDeleteUserMutation,
  useGetUsersQuery,
  useGetUserTypesQuery,
  useResetUserPasswordMutation,
  useToggleUserStatusMutation,
} from "@/redux/api/userApi";
import type { User } from "@/redux/types/user";

const PAGE_LIMIT = 10;

type StatusFilter = "all" | "true" | "false";

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: userTypes = [] } = useGetUserTypesQuery();

  const queryParams = useMemo(
    () => ({
      page,
      limit: PAGE_LIMIT,
      search: debouncedSearch || undefined,
      is_active:
        statusFilter === "all" ? undefined : statusFilter === "true",
      user_type_id: typeFilter === "all" ? undefined : typeFilter,
    }),
    [debouncedSearch, statusFilter, typeFilter, page]
  );

  const { data, isLoading, isFetching } = useGetUsersQuery(queryParams);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [statusTarget, setStatusTarget] = useState<User | null>(null);
  const [resetTarget, setResetTarget] = useState<User | null>(null);

  const [deleteUser, { isLoading: deleting }] = useDeleteUserMutation();
  const [toggleStatus, { isLoading: toggling }] = useToggleUserStatusMutation();
  const [resetPassword, { isLoading: resetting }] =
    useResetUserPasswordMutation();

  const rows = data?.data ?? [];
  const total = data?.meta?.totalItems ?? 0;
  const totalPages = data?.meta?.totalPages ?? 1;

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    setDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUser(deleteTarget.user_id).unwrap();
      toast.success("User deactivated.");
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Unable to delete user.");
    }
  };

  const confirmToggleStatus = async () => {
    if (!statusTarget) return;
    try {
      await toggleStatus({
        id: statusTarget.user_id,
        data: { is_active: !statusTarget.is_active },
      }).unwrap();
      toast.success(
        statusTarget.is_active ? "User deactivated." : "User activated."
      );
      setStatusTarget(null);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Unable to update status.");
    }
  };

  const confirmReset = async () => {
    if (!resetTarget) return;
    try {
      await resetPassword(resetTarget.user_id).unwrap();
      toast.success(
        "Password reset — a new temporary password has been emailed to the user."
      );
      setResetTarget(null);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Unable to reset password.");
    }
  };

  return (
    <div className="space-y-4">
      <DataToolbar
        title="Users"
        description="Operators, editors, and administrators who can sign in to the office guide admin."
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Search by name, email, or phone…"
        filters={
          <>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as StatusFilter);
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
            <Select
              value={typeFilter}
              onValueChange={(v) => {
                setTypeFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {userTypes.map((t) => (
                  <SelectItem key={t.user_type_id} value={t.user_type_id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
        right={
          <Button
            onClick={openCreate}
            className="bg-admin-accent hover:bg-admin-accent/90 text-black hover:text-black"
          >
            <UserPlusIcon className="h-4 w-4" />
            New User
          </Button>
        }
      />

      <div className="rounded-xl border border-admin-border bg-admin-surface/80 backdrop-blur overflow-hidden shadow-xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-admin-accent-text">User</TableHead>
              <TableHead className="text-admin-accent-text">Contact</TableHead>
              <TableHead className="text-admin-accent-text">Type</TableHead>
              <TableHead className="text-admin-accent-text">Roles</TableHead>
              <TableHead className="text-admin-accent-text">Status</TableHead>
              <TableHead className="w-16 text-right text-admin-accent-text">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="border-admin-border">
                <TableCell colSpan={6} className="h-32 text-center">
                  <Loader2Icon className="mx-auto h-5 w-5 animate-spin text-admin-faint" />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow className="border-admin-border">
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-admin-faint"
                >
                  {debouncedSearch ||
                  statusFilter !== "all" ||
                  typeFilter !== "all"
                    ? "No users match your filters."
                    : "No users yet. Click “New User” to invite the first one."}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((u) => (
                <TableRow key={u.user_id} className="align-top border-admin-border hover:bg-admin-raise">
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-admin-active/10 border border-admin-active/30 flex items-center justify-center text-admin-accent-text shrink-0">
                        <UserRoundIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-admin-text truncate">
                          {u.full_name}
                        </p>
                        {u.is_first_logged_in && (
                          <p className="text-[10px] uppercase tracking-wide text-admin-warn">
                            Awaiting first login
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5 text-sm">
                      <p className="flex items-center gap-1.5 text-admin-faint">
                        <MailIcon className="h-3.5 w-3.5" />
                        <span className="truncate max-w-[220px]">
                          {u.email}
                        </span>
                      </p>
                      {u.phone_number && (
                        <p className="flex items-center gap-1.5 text-admin-faint">
                          <PhoneIcon className="h-3.5 w-3.5" />
                          <span>{u.phone_number}</span>
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {u.userType?.name ? (
                      <span className="inline-flex items-center rounded-full bg-admin-active/10 border border-admin-active/30 px-2 py-0.5 text-xs font-medium text-admin-accent-text">
                        {u.userType.name}
                      </span>
                    ) : (
                      <span className="text-xs text-admin-faint">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {u.roles && u.roles.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {u.roles.slice(0, 3).map((r) => (
                          <span
                            key={r.role_id}
                            className="inline-flex items-center gap-1 rounded-full bg-admin-raise border border-admin-border text-admin-accent-text px-2 py-0.5 text-[11px] font-medium"
                          >
                            <ShieldIcon className="h-2.5 w-2.5" />
                            {r.name}
                          </span>
                        ))}
                        {u.roles.length > 3 && (
                          <span className="text-[11px] text-admin-faint">
                            +{u.roles.length - 3} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-admin-faint">
                        No roles
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {u.is_active ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-admin-ok/15 border border-admin-ok/30 px-2 py-0.5 text-xs font-medium text-admin-ok">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-admin-raise border border-admin-border px-2 py-0.5 text-xs font-medium text-admin-faint">
                        <span className="h-1.5 w-1.5 rounded-full bg-admin-chip" />
                        Inactive
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem onClick={() => openEdit(u)}>
                          <PencilIcon className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusTarget(u)}>
                          <PowerIcon className="h-4 w-4 mr-2" />
                          {u.is_active ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setResetTarget(u)}>
                          <KeyRoundIcon className="h-4 w-4 mr-2" />
                          Reset password
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteTarget(u)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2Icon className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="px-4 pb-3">
          <DataPagination
            total={total}
            currentPage={page}
            totalPages={totalPages}
            limit={PAGE_LIMIT}
            onPageChange={setPage}
          />
        </div>

        {isFetching && !isLoading && (
          <div className="pointer-events-none absolute right-6 top-6 text-xs text-admin-faint">
            Updating…
          </div>
        )}
      </div>

      {/* ── Create / edit dialog ── */}
      <UserFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={editing}
      />

      {/* ── Toggle active status ── */}
      <ConfirmDialog
        open={!!statusTarget}
        onOpenChange={(o) => !o && setStatusTarget(null)}
        title={
          statusTarget?.is_active ? "Deactivate user?" : "Activate user?"
        }
        description={
          statusTarget?.is_active
            ? `${statusTarget?.full_name} will not be able to sign in until reactivated. Their profile and history stay intact.`
            : `${statusTarget?.full_name} will be able to sign in again immediately.`
        }
        confirmLabel={statusTarget?.is_active ? "Deactivate" : "Activate"}
        destructive={statusTarget?.is_active}
        loading={toggling}
        onConfirm={confirmToggleStatus}
      />

      {/* ── Reset password ── */}
      <ConfirmDialog
        open={!!resetTarget}
        onOpenChange={(o) => !o && setResetTarget(null)}
        title="Reset password?"
        description={
          <>
            A new temporary password will be generated for{" "}
            <span className="font-medium">{resetTarget?.full_name}</span> and
            emailed to <span className="font-medium">{resetTarget?.email}</span>
            . Their current password will stop working immediately.
          </>
        }
        confirmLabel="Reset password"
        loading={resetting}
        onConfirm={confirmReset}
      />

      {/* ── Delete ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete user?"
        description={
          <>
            This will deactivate{" "}
            <span className="font-medium">{deleteTarget?.full_name}</span> and
            prevent them from signing in. Their content (created offices,
            edits, etc.) will remain attached to their record.
          </>
        }
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
