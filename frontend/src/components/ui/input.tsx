import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:border-0 file:bg-transparent file:text-sm file:font-medium text-admin-text placeholder:text-admin-faint selection:bg-admin-active/30 h-9 w-full min-w-0 rounded-md border border-admin-border-strong bg-admin-input px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-golden-classic focus-visible:ring-golden-classic/30 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
