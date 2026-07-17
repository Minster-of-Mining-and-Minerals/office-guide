"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

interface DataPaginationProps {
  total: number;
  currentPage: number;
  totalPages: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function DataPagination({
  total,
  currentPage,
  totalPages,
  limit,
  onPageChange,
}: DataPaginationProps) {
  if (total === 0) return null;
  const from = (currentPage - 1) * limit + 1;
  const to = Math.min(currentPage * limit, total);

  return (
    <div className="flex items-center justify-between border-t pt-3 mt-3">
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium">{from}</span>–
        <span className="font-medium">{to}</span> of{" "}
        <span className="font-medium">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Prev
        </Button>
        <span className="text-sm px-2 text-muted-foreground">
          Page {currentPage} of {totalPages || 1}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
