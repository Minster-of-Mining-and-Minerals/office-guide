import React from "react";
import { Shield } from "lucide-react";

export const PermissionHeader: React.FC = () => (
  <div className="flex mb-8 rounded-2xl items-center justify-between p-6 border border-golden-classic/30 bg-gradient-to-r from-golden-metallic/60 to-golden-metallic/10 shadow-sm">
    <div className="flex items-center space-x-3">
      <div className="p-3 bg-white/60 border border-golden-classic/40 rounded-xl shadow-inner">
        <Shield className="h-6 w-6 text-golden-dark" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-golden-dark">
          Permission Management
        </h2>
        <p className="text-sm text-muted-foreground">
          Curate what each role can do inside the Office Guide admin.
        </p>
      </div>
    </div>
  </div>
);
