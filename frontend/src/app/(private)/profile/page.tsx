"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  KeyRoundIcon,
  Loader2Icon,
  ShieldAlertIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useGetProfileQuery } from "@/redux/api/userApi";
import { useChangePasswordMutation } from "@/redux/api/authApi";

const MIN_LENGTH = 8;

const panelClass =
  "rounded-xl border border-admin-border bg-admin-surface/80 p-5 space-y-4 shadow-xl backdrop-blur";

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Password input with a show/hide button. */
function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  invalid,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  invalid?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-admin-text">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          aria-invalid={invalid || undefined}
          className={cn(
            "h-10 pr-10",
            invalid && "border-red-500 focus-visible:ring-red-500"
          )}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-admin-faint hover:bg-admin-chip hover:text-admin-text"
        >
          {show ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function Rule({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li
      className={cn(
        "flex items-center gap-2 text-xs",
        ok ? "text-admin-ok" : "text-admin-muted"
      )}
    >
      {ok ? <CheckIcon className="h-3.5 w-3.5" /> : <XIcon className="h-3.5 w-3.5 opacity-60" />}
      {children}
    </li>
  );
}

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const { data: profile, isLoading } = useGetProfileQuery();
  const [changePassword, { isLoading: saving }] = useChangePasswordMutation();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const firstLogin = session?.user?.is_first_logged_in === true;
  const roles = session?.user?.roles ?? [];

  const longEnough = next.trim().length >= MIN_LENGTH;
  const different = next.length > 0 && next !== current;
  const matches = confirm.length > 0 && next === confirm;
  const canSubmit = current.length > 0 && longEnough && different && matches && !saving;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!canSubmit) return;
    try {
      await changePassword({
        current_password: current,
        new_password: next,
        confirm_password: confirm,
      }).unwrap();
      setCurrent("");
      setNext("");
      setConfirm("");
      toast.success("Password changed. Use your new password next time you sign in.");
      if (firstLogin) {
        await update({ is_first_logged_in: false });
        router.replace("/dashboard");
      }
    } catch (err) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ??
        "Could not change your password. Try again.";
      setError(msg);
    }
  };

  const name = profile?.full_name ?? session?.user?.name ?? "";
  const email = profile?.email ?? session?.user?.email ?? "";

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-4">
      <div>
        <h1 className="text-2xl font-bold text-admin-heading">Profile</h1>
        <p className="text-sm text-admin-muted mt-0.5">
          Your account details and password.
        </p>
      </div>

      {firstLogin && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-admin-warn/40 bg-admin-warn/10 px-4 py-3 text-sm text-admin-text"
        >
          <ShieldAlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-admin-warn" />
          <span>
            <b>Set a new password to continue.</b> You signed in with a
            temporary password. Choose your own below; you can use the rest of
            the admin after that.
          </span>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] items-start">
        {/* ─── Account ─────────────────────────────────────── */}
        <section className={panelClass} aria-labelledby="account-h">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-admin-chip text-base font-bold text-admin-text">
              {name
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((p) => p[0]?.toUpperCase())
                .join("") || "?"}
            </span>
            <div className="min-w-0">
              <h2 id="account-h" className="truncate text-base font-semibold text-admin-heading">
                {name || "Your account"}
              </h2>
              <p className="truncate text-sm text-admin-muted">{email}</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2Icon className="h-5 w-5 animate-spin text-admin-faint" />
            </div>
          ) : (
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-3 text-sm">
              <dt className="text-admin-muted">Phone</dt>
              <dd className="text-admin-text">{profile?.phone_number || "—"}</dd>
              <dt className="text-admin-muted">Account type</dt>
              <dd className="text-admin-text">{profile?.userType?.name ?? "—"}</dd>
              <dt className="text-admin-muted">Roles</dt>
              <dd className="flex flex-wrap gap-1.5">
                {roles.length ? (
                  roles.map((r) => (
                    <span
                      key={r.name}
                      className="rounded-full bg-admin-chip px-2.5 py-0.5 text-xs font-medium text-admin-text"
                    >
                      {r.name}
                    </span>
                  ))
                ) : (
                  <span className="text-admin-text">—</span>
                )}
              </dd>
              <dt className="text-admin-muted">Last sign-in</dt>
              <dd className="text-admin-text">{formatDate(profile?.last_login_at)}</dd>
              <dt className="text-admin-muted">Password changed</dt>
              <dd className="text-admin-text">{formatDate(profile?.password_changed_at)}</dd>
            </dl>
          )}
          <p className="text-xs text-admin-faint">
            To change your name, email or phone, ask an administrator.
          </p>
        </section>

        {/* ─── Change password ─────────────────────────────── */}
        <section className={panelClass} aria-labelledby="password-h">
          <div className="flex items-center gap-2">
            <KeyRoundIcon className="h-4 w-4 text-admin-accent-text" />
            <h2 id="password-h" className="text-base font-semibold text-admin-heading">
              Change password
            </h2>
          </div>

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <PasswordField
              id="current-password"
              label="Current password"
              value={current}
              onChange={(v) => {
                setCurrent(v);
                setError(null);
              }}
              autoComplete="current-password"
            />
            <PasswordField
              id="new-password"
              label="New password"
              value={next}
              onChange={(v) => {
                setNext(v);
                setError(null);
              }}
              autoComplete="new-password"
              invalid={next.length > 0 && (!longEnough || !different)}
            />
            <PasswordField
              id="confirm-password"
              label="Confirm new password"
              value={confirm}
              onChange={(v) => {
                setConfirm(v);
                setError(null);
              }}
              autoComplete="new-password"
              invalid={confirm.length > 0 && !matches}
            />

            <ul className="space-y-1" aria-label="Password requirements">
              <Rule ok={longEnough}>At least {MIN_LENGTH} characters</Rule>
              <Rule ok={different}>Different from your current password</Rule>
              <Rule ok={matches}>Both new passwords match</Rule>
            </ul>

            {error && (
              <p
                role="alert"
                className="rounded-md border border-admin-bad/30 bg-admin-bad/10 px-3 py-2 text-sm text-admin-bad"
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={!canSubmit}
              className="bg-admin-accent hover:bg-admin-accent/90 text-admin-accent-ink hover:text-admin-accent-ink"
            >
              {saving && <Loader2Icon className="h-4 w-4 animate-spin" />}
              Change password
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
