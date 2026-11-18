import React from "react";

export const RoleFormSkeleton: React.FC = () => (
  <div className="w-full flex items-center justify-center bg-admin-surface rounded-lg p-4">
    <div className="text-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-admin-accent mx-auto mb-4"></div>
      <p className="text-admin-heading text-lg">Loading role data...</p>
    </div>
  </div>
);
