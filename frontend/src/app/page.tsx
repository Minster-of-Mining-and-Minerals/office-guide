import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F9FBFC] flex items-center justify-center px-4">
      <div className="w-full max-w-3xl text-center rounded-2xl border border-[#DCE7F1] shadow-xl bg-white p-10 md:p-14">
        <Image
          src="/logo-mom.png"
          alt="Ministry of Mining Logo"
          width={200}
          height={200}
          priority
          className="mx-auto mb-6 h-40 w-auto object-contain"
        />

        <h1 className="text-3xl md:text-4xl font-semibold text-golden-dark">
          Ministry of Mining
        </h1>
        <p className="mt-2 text-lg md:text-xl text-primary font-medium">
          Digital Signage System
        </p>
        <p className="mt-4 text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
          Browse the ministry office directory or manage floors and offices
          from the admin console.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/office-guide"
            className="inline-flex items-center gap-2 bg-golden-dark hover:bg-golden-darkHover text-white h-12 px-6 rounded-md shadow-md text-base font-medium"
          >
            <BookOpen className="h-4 w-4" />
            Browse Office Guide
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 border border-golden-dark text-golden-dark hover:bg-golden-metallic h-12 px-6 rounded-md text-base font-medium"
          >
            Admin Login
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
