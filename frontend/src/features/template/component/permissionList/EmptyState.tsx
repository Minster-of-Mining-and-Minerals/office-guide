import React from "react";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
}) => (
  <div className="text-center py-12">
    <div className="mx-auto w-24 h-24 bg-admin-raise rounded-full flex items-center justify-center mb-4">
      <Shield className="h-10 w-10 text-admin-faint" />
    </div>
    <h3 className="text-lg font-semibold text-admin-text mb-2">{title}</h3>
    <p className="text-admin-muted max-w-md mx-auto mb-6">{description}</p>
    {action}
  </div>
);
