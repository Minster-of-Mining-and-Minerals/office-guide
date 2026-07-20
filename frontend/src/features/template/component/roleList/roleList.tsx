"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@/features/template/component/DataTable";
import { TableLayout } from "@/features/template/component/TableLayout";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Download,
  Loader2Icon,
  PencilIcon,
  Plus,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import {
  useDeleteRoleMutation,
  useGetRolesQuery,
} from "@/redux/api/roleApi";
import type { Role } from "@/redux/types/auth";
import type { FilterField, ActionButton } from "@/types/tableLayout";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

export default function RoleList() {
  const { data = [], isLoading, isError, refetch } = useGetRolesQuery();
  const [deleteRole, { isLoading: deleting }] = useDeleteRoleMutation();
  const router = useRouter();

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState("");

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

  const handlePagination = (index: number, size: number) => {
    setPageIndex(index);
    setPageSize(size);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRole(deleteTarget.role_id).unwrap();
      toast.success("Role deleted");
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(
        err?.data?.message ??
          "Could not delete this role. It may still be assigned to a user."
      );
    }
  };

  // Columns need `router` and `setDeleteTarget` in scope, so we build them
  // inside the component instead of at module top level.
  const columns: ColumnDef<Role>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Role Name",
        cell: ({ row }) => (
          <span className="font-medium text-golden-classic">
            {row.getValue("name")}
          </span>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
          <span className="text-white/60 text-sm">
            {(row.getValue("description") as string) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "is_active",
        header: "Status",
        cell: ({ row }) => {
          const isActive = row.getValue("is_active") as boolean;
          return (
            <Badge
              variant={isActive ? "default" : "secondary"}
              className={
                isActive
                  ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border-emerald-500/20"
                  : "bg-white/10 text-white/50 border-white/10"
              }
            >
              {isActive ? "Active" : "Inactive"}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const role = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-golden-classic/10 text-white/70 hover:text-golden-classic"
                onClick={() =>
                  router.push(`/users/roles/${role.role_id}`)
                }
                aria-label={`Edit ${role.name}`}
              >
                <PencilIcon className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-destructive/10 text-destructive/80 hover:text-destructive"
                onClick={() => setDeleteTarget(role)}
                aria-label={`Delete ${role.name}`}
              >
                <Trash2Icon className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        },
      },
    ],
    [router]
  );

  const filters: FilterField[] = [
    {
      key: "status",
      label: "Status",
      type: "multiselect",
      placeholder: "Select status",
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
    },
  ];

  const actions: ActionButton[] = [
    {
      label: "Export",
      icon: <Download className="h-4 w-4" />,
      variant: "outline",
      onClick: () => toast.info("Export coming soon"),
    },
    {
      label: "New Role",
      icon: <Plus className="h-4 w-4" />,
      variant: "default",
      onClick: () => router.push("/users/roles/new"),
    },
  ];

  const filteredData = data.filter((role) => {
    if (statusFilter === "active") return role.is_active === true;
    if (statusFilter === "inactive") return role.is_active === false;
    return true;
  });

  const paginatedData = filteredData.slice(
    pageIndex * pageSize,
    pageIndex * pageSize + pageSize
  );

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6 text-center">
        <p className="text-sm font-medium text-destructive">
          Could not load roles.
        </p>
        <Button
          variant="outline"
          onClick={refetch}
          className="mt-3"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      <TableLayout
        title="Role Management"
        description="View and manage user roles"
        actions={actions}
        filters={filters}
        filterColumnsPerRow={2}
      >
        {isLoading ? (
          <div className="p-10 flex items-center justify-center">
            <Loader2Icon className="h-5 w-5 animate-spin text-golden-classic" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={paginatedData}
            totalPageCount={Math.ceil(filteredData.length / pageSize)}
            handlePagination={handlePagination}
            tablePageSize={pageSize}
            currentIndex={pageIndex}
          />
        )}
      </TableLayout>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete role"
        description={
          deleteTarget ? (
            <>
              This will permanently delete the{" "}
              <span className="font-medium">{deleteTarget.name}</span> role.
              If it is still assigned to any user, the delete will be
              blocked.
            </>
          ) : null
        }
        confirmLabel="Delete role"
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </>
  );
}
