import React from "react";
import { Shield, Activity, Settings } from "lucide-react";
import { PermissionStats as StatsType } from "../../types/permission";

interface PermissionStatsProps {
  stats: StatsType;
}

export const PermissionStats: React.FC<PermissionStatsProps> = ({ stats }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
    {/* Total Card */}
    <div className="bg-admin-surface/80 backdrop-blur border border-admin-border rounded-xl shadow-xl">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-admin-muted">
              Total Permissions
            </p>
            <p className="text-2xl font-bold text-admin-text">{stats.total}</p>
          </div>
          <div className="p-3 bg-admin-info/10 rounded-lg">
            <Shield className="h-6 w-6 text-admin-info" />
          </div>
        </div>
      </div>
    </div>

    {/* Active Card */}
    <div className="bg-admin-surface/80 backdrop-blur border border-admin-border rounded-xl shadow-xl">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-admin-muted">Active</p>
            <p className="text-2xl font-bold text-admin-ok">{stats.active}</p>
          </div>
          <div className="p-3 bg-admin-ok/10 rounded-lg">
            <Activity className="h-6 w-6 text-admin-ok" />
          </div>
        </div>
      </div>
    </div>

    {/* Inactive Card */}
    <div className="bg-admin-surface/80 backdrop-blur border border-admin-border rounded-xl shadow-xl">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-admin-muted">Inactive</p>
            <p className="text-2xl font-bold text-destructive">{stats.inactive}</p>
          </div>
          <div className="p-3 bg-destructive/10 rounded-lg">
            <Settings className="h-6 w-6 text-destructive" />
          </div>
        </div>
      </div>
    </div>
  </div>
);
