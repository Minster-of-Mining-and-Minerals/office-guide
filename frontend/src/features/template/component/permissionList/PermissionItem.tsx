import React from "react";
import { ToggleLeft, ToggleRight } from "lucide-react";
import { Permission } from "../../types/permission";

interface PermissionItemProps {
  permission: Permission;
  onToggle: (id: string) => Promise<void>;
  isToggling: boolean;
}

export const PermissionItem: React.FC<PermissionItemProps> = ({
  permission,
  onToggle,
  isToggling,
}) => {
  const isActive = !!permission.is_active;

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onToggle(permission.permission_id);
  };

  return (
    <div className="flex items-center justify-between py-1 px-3 border border-admin-border rounded-lg hover:bg-admin-raise bg-transparent transition-colors">
      <div className="flex items-center space-x-3 flex-1">
        <span className="text-sm font-medium text-admin-text capitalize">
          {permission.action.replace("_", " ")}
        </span>
      </div>

      <button
        className={`p-0 transition-all duration-200 ${
          isActive ? "text-admin-ok" : "text-admin-faint"
        }`}
        onClick={handleToggle}
        disabled={isToggling}
        title={isActive ? "Deactivate permission" : "Activate permission"}
      >
        {isToggling ? (
          <div className="w-10 h-10 flex items-center justify-center">
            <div className="h-6 w-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isActive ? (
          <ToggleRight className="h-10 w-10 text-admin-ok hover:text-admin-ok" />
        ) : (
          <ToggleLeft className="h-10 w-10 text-admin-faint hover:text-admin-faint" />
        )}
      </button>
    </div>
  );
};
