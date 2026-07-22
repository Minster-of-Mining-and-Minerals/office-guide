"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, KeyRoundIcon } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F9FBFC] flex items-center justify-center px-4">
      <div className="w-full relative max-w-4xl shadow-2xl rounded-2xl border border-[#DCE7F1] bg-white overflow-hidden flex flex-col md:flex-row">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push("/login")}
          className="cursor-pointer shadow-none z-50 bg-transparent hover:bg-slate-100 p-2 top-4 left-4 absolute flex items-center gap-1 text-golden-dark hover:text-golden-dark"
        >
          <ArrowLeftIcon className="w-5 h-5 text-golden-dark" />
          <span className="text-sm text-golden-dark font-medium">Back to Login</span>
        </Button>

        {/* Branding & Info */}
        <div className="w-full p-8 md:p-12 flex flex-col items-center justify-center text-center">
          <Image
            src="/logo-mom.png"
            alt="Ministry of Mining Logo"
            width={160}
            height={160}
            priority
            className="h-32 w-auto mx-auto mb-6 object-contain"
          />

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 max-w-md my-4">
            <KeyRoundIcon className="w-10 h-10 text-golden-dark mx-auto mb-3" />
            <h1 className="text-2xl font-semibold text-golden-dark mb-2">Password Reset Notice</h1>
            <p className="text-sm text-slate-700 leading-relaxed">
              To request a password reset or recover your account credentials, please contact your
              system administrator or IT department.
            </p>
          </div>

          <Button
            onClick={() => router.push("/login")}
            className="mt-4 bg-golden-classic hover:bg-golden-dark hover:text-white text-slate-900 font-semibold px-6 py-2 rounded-md shadow-md transition-colors cursor-pointer"
          >
            Return to Login
          </Button>
        </div>
      </div>
    </div>
  );
}
