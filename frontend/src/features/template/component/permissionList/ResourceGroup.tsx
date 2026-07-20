import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronRight } from "lucide-react";
import { PermissionItem } from "./PermissionItem";
import { ResourceGroup as ResourceGroupType } from "../../types/permission";

interface ResourceGroupProps {
  group: ResourceGroupType;
  onToggle: (id: string) => Promise<void>;
  isToggling: boolean;
  onToggleExpand: (resource: string) => void;
}

export const ResourceGroup: React.FC<ResourceGroupProps> = ({
  group,
  onToggle,
  isToggling,
  onToggleExpand,
}) => {
  const isAllActive = group.activeCount === group.totalCount;
  const isSomeActive =
    group.activeCount > 0 && group.activeCount < group.totalCount;

  const getSelectionStatusText = () => {
    if (isAllActive) return "All Active";
    if (isSomeActive) return "Partial";
    return "All Inactive";
  };

  const getSelectionStatusClass = () => {
    if (isAllActive) return "bg-green-100 text-green-800 border-green-200";
    if (isSomeActive) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-gray-100 text-gray-600 border-gray-200";
  };

  return (
    <div className="border border-white/10 rounded-xl self-start bg-white/5 shadow-sm hover:border-golden-classic/40 transition-colors">
      {/* Resource Header */}
      <div
        onClick={() => onToggleExpand(group.resource)}
        className="flex transition-all hover:bg-white/10 duration-200 cursor-pointer items-center justify-between p-4 bg-white/5 rounded-t-xl"
      >
        <div className="flex items-center space-x-3 flex-1">
          <button
            type="button"
            onClick={() => onToggleExpand(group.resource)}
            className="p-1 hover:bg-white/10 rounded"
          >
            {group.isExpanded ? (
              <ChevronDown className="h-5 w-5 text-golden-classic cursor-pointer" />
            ) : (
              <ChevronRight className="h-5 w-5 text-golden-classic cursor-pointer" />
            )}
          </button>
          <div className="p-2 text-golden-classic bg-white/5 rounded-lg border border-white/10">
            {group.icon}
          </div>
          <div>
            <h3 className="font-semibold text-golden-classic">
              {group.label ??
                group.resource.replace(/_/g, " ")}
            </h3>
            <p className="text-xs text-white/60">
              {group.totalCount} permission
              {group.totalCount === 1 ? "" : "s"} • {group.activeCount} active
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span
            className={`px-2.5 py-0.5 text-[11px] font-medium border rounded-full ${getSelectionStatusClass()}`}
          >
            {getSelectionStatusText()}
          </span>
        </div>
      </div>

      {/* Permissions List with Animation */}
      <AnimatePresence>
        {group.isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-transparent rounded-b-xl border-t border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.permissions.map((permission) => (
                  <PermissionItem
                    key={permission.permission_id}
                    permission={permission}
                    onToggle={onToggle}
                    isToggling={isToggling}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
