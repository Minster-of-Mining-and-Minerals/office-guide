import React from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface FooterActionsProps {
  isLoading: boolean;
  isEditMode: boolean;
  name: string;
  selectedPermissionsCount: number;
  onSubmit: () => void;
}

export const FooterActions: React.FC<FooterActionsProps> = ({
  isLoading,
  isEditMode,
  name,
  selectedPermissionsCount,
  onSubmit,
}) => {
  const router = useRouter();

  return (
    <div className="border-t border-admin-border p-6">
      <div className="flex items-center justify-end">
        <div className="flex items-center space-x-3">
          <Button
            type="button"
            variant="outline"
            className="min-w-[150px] text-admin-heading text-base bg-admin-chip hover:bg-admin-chip"
            onClick={() => router.push("/users/roles")}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={onSubmit}
            disabled={
              isLoading || !name.trim() || selectedPermissionsCount === 0
            }
            className="min-w-[150px] text-base bg-admin-accent hover:bg-admin-accent/90 text-admin-accent-ink"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-admin-border-strong mr-2"></div>
                {isEditMode ? "Updating..." : "Creating..."}
              </>
            ) : isEditMode ? (
              "Update"
            ) : (
              "Create"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
