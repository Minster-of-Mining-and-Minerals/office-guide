import React from "react";
import { Shield, Activity, Settings } from "lucide-react";
import { PermissionStats as StatsType } from "../../types/permission";

interface PermissionStatsProps {
  stats: StatsType;
}

export const PermissionStats: React.FC<PermissionStatsProps> = ({ stats }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
    {/* Total Card */}
    <div className="bg-[#0D1F3C]/80 backdrop-blur border border-white/10 rounded-xl shadow-xl">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white/60">
              Total Permissions
            </p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-lg">
            <Shield className="h-6 w-6 text-blue-400" />
          </div>
        </div>
      </div>
    </div>

    {/* Active Card */}
    <div className="bg-[#0D1F3C]/80 backdrop-blur border border-white/10 rounded-xl shadow-xl">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white/60">Active</p>
            <p className="text-2xl font-bold text-emerald-400">{stats.active}</p>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-lg">
            <Activity className="h-6 w-6 text-emerald-400" />
          </div>
        </div>
      </div>
    </div>

    {/* Inactive Card */}
    <div className="bg-[#0D1F3C]/80 backdrop-blur border border-white/10 rounded-xl shadow-xl">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white/60">Inactive</p>
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
