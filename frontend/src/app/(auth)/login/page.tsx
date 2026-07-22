"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { ArrowLeftIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Only trust `callbackUrl` values that stay on-site AND don't loop
 * back to the auth flow. Prevents open-redirect bugs like
 * `/login?callbackUrl=https://evil.example`.
 */
function safeCallback(raw: string | null): string {
  if (!raw) return "/dashboard";
  if (!raw.startsWith("/")) return "/dashboard";
  if (raw.startsWith("//")) return "/dashboard";
  if (raw.startsWith("/login")) return "/dashboard";
  return raw;
}

export default function ExternalLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status, update } = useSession();

  const callbackUrl = useMemo(
    () => safeCallback(searchParams.get("callbackUrl")),
    [searchParams]
  );

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Already logged in? Skip the form and jump straight through. Covers
  // the case where someone hits /login with a valid cookie (e.g. from
  // a bookmark).
  useEffect(() => {
    if (status !== "authenticated") return;
    if (session?.user?.is_first_logged_in) {
      router.replace("/change-password");
    } else {
      router.replace(callbackUrl);
    }
  }, [status, session, callbackUrl, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError("");
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: formData.email.trim(),
        password: formData.password,
      });

      if (res?.error) {
        if (res.error === "inactive_user" || (res as any).code === "inactive_user") {
          setAuthError("Your account is inactive. Please contact an administrator.");
        } else {
          setAuthError("Invalid email or password.");
        }
        setIsLoading(false);
        return;
      }

      if (res?.ok) {
        const fresh = (await update()) as any;
        if (fresh?.user?.is_first_logged_in) {
          router.replace("/change-password");
        } else {
          router.replace(callbackUrl);
        }
        return;
      }
      setAuthError("Invalid email or password.");
    } catch (err: any) {
      console.error("Login submission error:", err);
      setAuthError("Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FBFC] flex items-center justify-center px-4">
      <div className="w-full relative max-w-6xl min-h-[80vh] shadow-2xl rounded-2xl border border-[#DCE7F1] bg-white overflow-hidden flex flex-col lg:flex-row">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="cursor-pointer shadow-none z-50 bg-transparent hover:bg-slate-100 p-2 top-4 left-4 absolute flex items-center gap-1 text-golden-dark hover:text-golden-dark"
        >
          <ArrowLeftIcon className="w-5 h-5 text-golden-dark" />
          <span className="text-sm text-golden-dark font-medium">Back</span>
        </Button>

        {/* Left Section — Branding */}
        <div className="w-full bg-cover bg-center p-8 flex items-center justify-center">
          <div className="backdrop-blur-md p-6 rounded-xl text-center">
            <Image
              src="/logo-mom.png"
              alt="Ministry of Mining Logo"
              width={384}
              height={384}
              priority
              className="h-96 w-auto mx-auto mb-3 rounded-xl p-2 object-contain"
            />
          </div>
        </div>

        {/* Right Section — Form */}
        <div className="w-full px-8 md:px-16 py-8 flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-semibold text-golden-dark">Login</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                MoM Digital Signage System
              </p>
            </div>

            {authError && (
              <div className="rounded-md w-full text-center bg-red-50 border border-red-200 px-3 py-2 mb-4">
                <div className="text-sm text-red-700">{authError}</div>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <Label className="text-golden-dark font-medium">Email</Label>
                <Input
                  placeholder="example.xx@gov.et"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full h-14 mt-1 px-3 py-2 rounded-md text-sm border-golden-dark text-slate-900 bg-white focus:ring-2 focus:ring-golden-dark focus:border-golden-dark placeholder:text-slate-400"
                />
              </div>

              {/* Password */}
              <div>
                <Label className="text-golden-dark font-medium">Password</Label>
                <div className="relative mt-1">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full h-14 px-3 py-2 pr-10 border rounded-md text-sm border-golden-dark text-slate-900 bg-white focus:ring-2 focus:ring-golden-dark focus:border-golden-dark placeholder:text-slate-400"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-golden-dark hover:text-golden-dark/80 p-1 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeIcon className="h-5 w-5 text-golden-dark" />
                    ) : (
                      <EyeOffIcon className="h-5 w-5 text-golden-dark" />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="w-full text-right">
                <Link
                  href="/forgot-password"
                  className="text-sm text-golden-dark hover:underline font-medium"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-golden-classic hover:bg-golden-dark hover:text-white text-slate-900 font-semibold h-14 text-lg py-2 rounded-md shadow-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? "Logging In..." : "Log In"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
