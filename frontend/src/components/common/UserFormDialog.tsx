"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ContactIcon,
  Loader2Icon,
  ShieldIcon,
  ToggleRightIcon,
  UserPlusIcon,
  UserRoundCogIcon,
} from "lucide-react";

import { FormSectionHeader } from "@/components/common/FormSectionHeader";
import { RoleMultiSelect } from "@/components/common/RoleMultiSelect";
import { useGetRolesQuery } from "@/redux/api/roleApi";
import {
  useCreateUserMutation,
  useGetUserTypesQuery,
  useUpdateUserMutation,
} from "@/redux/api/userApi";
import type { User } from "@/redux/types/user";

const ETHIOPIAN_PHONE = /^(\+251|0)(9|7)\d{8}$/;

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When present the dialog opens in edit mode. */
  user?: User | null;
}

/**
 * One dialog for both "create user" and "edit user". Chooses mode based
 * on whether `user` is passed. Uses the same gradient header + sectioned
 * body pattern as the redesigned floor/office modals so the admin has a
 * consistent create/edit feel across every resource.
 */
export function UserFormDialog({
  open,
  onOpenChange,
  user,
}: UserFormDialogProps) {
  const isEdit = !!user;

  const { data: roles = [], isLoading: rolesLoading } = useGetRolesQuery();
  const { data: userTypes = [], isLoading: typesLoading } =
    useGetUserTypesQuery();

  const [createUser, createState] = useCreateUserMutation();
  const [updateUser, updateState] = useUpdateUserMutation();

  const submitting = createState.isLoading || updateState.isLoading;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [userTypeId, setUserTypeId] = useState("");
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Reset the form whenever the dialog opens. In edit mode we hydrate from
  // the user prop; in create mode we clear everything.
  useEffect(() => {
    if (!open) return;
    setFormError(null);
    if (user) {
      setFullName(user.full_name ?? "");
      setEmail(user.email ?? "");
      setPhone(user.phone_number ?? "");
      setUserTypeId(user.user_type_id ?? "");
      setRoleIds(user.roles?.map((r) => r.role_id) ?? []);
      setIsActive(user.is_active);
    } else {
      setFullName("");
      setEmail("");
      setPhone("");
      setUserTypeId(userTypes[0]?.user_type_id ?? "");
      setRoleIds([]);
      setIsActive(true);
    }
  }, [open, user, userTypes]);

  const dialogTitle = isEdit ? "Edit user" : "New user";
  const dialogSubtitle = isEdit
    ? "Update the profile, role assignments, or active status."
    : "The user will receive an email with a temporary password.";

  const canSubmit = useMemo(() => {
    if (!fullName.trim()) return false;
    if (!email.trim()) return false;
    if (!userTypeId) return false;
    return true;
  }, [fullName, email, userTypeId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim()) return setFormError("Full name is required.");
    if (!email.trim()) return setFormError("Email is required.");
    if (!userTypeId) return setFormError("Pick a user type.");
    if (phone && !ETHIOPIAN_PHONE.test(phone.trim())) {
      return setFormError(
        "Phone number should look like +2519xxxxxxxx or 09xxxxxxxx."
      );
    }

    try {
      if (isEdit && user) {
        await updateUser({
          id: user.user_id,
          data: {
            full_name: fullName.trim(),
            email: email.trim(),
            phone_number: phone.trim() || undefined,
            user_type_id: userTypeId,
            role_ids: roleIds,
            is_active: isActive,
          },
        }).unwrap();
        toast.success("User updated.");
      } else {
        await createUser({
          full_name: fullName.trim(),
          email: email.trim(),
          phone_number: phone.trim() || undefined,
          user_type_id: userTypeId,
          role_ids: roleIds,
        }).unwrap();
        toast.success(
          "User created. A temporary password was emailed to the address."
        );
      }
      onOpenChange(false);
    } catch (err: any) {
      const msg =
        err?.data?.message ??
        (isEdit ? "Could not update the user." : "Could not create the user.");
      setFormError(msg);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={submitting ? undefined : onOpenChange}
    >
      <DialogContent className="sm:max-w-3xl p-0 gap-0 overflow-hidden max-h-[92vh] flex flex-col">
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
                {isEdit ? (
                  <UserRoundCogIcon className="h-5 w-5 text-golden-classic" />
                ) : (
                  <UserPlusIcon className="h-5 w-5 text-golden-classic" />
                )}
              </div>
              <div>
                <DialogTitle className="text-white">{dialogTitle}</DialogTitle>
                <p className="text-xs text-white/70 mt-0.5">
                  {dialogSubtitle}
                </p>
              </div>
            </div>
          </DialogHeader>
        </div>

        <form
          id="user-form"
          onSubmit={onSubmit}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-6"
        >
          {/* ── Section 1: Identity ── */}
          <section className="space-y-4">
            <FormSectionHeader
              icon={<ContactIcon className="h-3.5 w-3.5" />}
              label="Identity"
              subtitle="Who is this account for?"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="full_name">
                  Full name
                  <span className="text-red-500 ml-0.5">*</span>
                </Label>
                <Input
                  id="full_name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Selam Bekele"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">
                  Email
                  <span className="text-red-500 ml-0.5">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@ministry.gov.et"
                  required
                  autoComplete="off"
                  disabled={isEdit}
                />
                {isEdit && (
                  <p className="text-[11px] text-muted-foreground">
                    Email cannot be changed after creation.
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+251 9xxxxxxxx"
                />
              </div>
            </div>
          </section>

          {/* ── Section 2: Access ── */}
          <section className="space-y-4">
            <FormSectionHeader
              icon={<ShieldIcon className="h-3.5 w-3.5" />}
              label="Access"
              subtitle="User type + role assignments."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>
                  User type
                  <span className="text-red-500 ml-0.5">*</span>
                </Label>
                <Select
                  value={userTypeId}
                  onValueChange={setUserTypeId}
                  disabled={typesLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user type" />
                  </SelectTrigger>
                  <SelectContent>
                    {userTypes.map((t) => (
                      <SelectItem key={t.user_type_id} value={t.user_type_id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Roles</Label>
                <RoleMultiSelect
                  roles={roles}
                  selectedIds={roleIds}
                  onChange={setRoleIds}
                  loading={rolesLoading}
                  placeholder="Assign roles (optional)"
                />
              </div>
            </div>
          </section>

          {/* ── Section 3: Status (edit only) ── */}
          {isEdit && (
            <section className="space-y-3">
              <FormSectionHeader
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
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-golden-dark"
                />
                <div>
                  <p className="text-sm font-medium text-golden-dark">
                    Account active
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Inactive users cannot log in but their content stays
                    intact.
                  </p>
                </div>
              </label>
            </section>
          )}

          {formError && (
            <p className="text-sm text-destructive rounded-md bg-red-50 border border-red-200 px-3 py-2">
              {formError}
            </p>
          )}
        </form>

        {/* Sticky footer */}
        <div className="shrink-0 border-t border-golden-classic/15 bg-white px-6 py-3">
          <DialogFooter className="!m-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="user-form"
              disabled={submitting || !canSubmit}
              className="bg-golden-classic hover:bg-golden-soft text-black hover:text-black"
            >
              {submitting && (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEdit ? "Save changes" : "Create user"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
