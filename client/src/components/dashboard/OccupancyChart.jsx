import React from 'react';

export function OccupancyChart({ occupied, available, maintenance }) {
  const total = occupied + available + maintenance;
  if (total === 0) return <div>No data</div>;
  
  const occupiedPct = (occupied / total) * 100;
  const maintenancePct = (maintenance / total) * 100;
  
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900 mb-6 self-start w-full">Current Occupancy</h3>
      <div className="relative w-48 h-48 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
          <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="20" />
          {/* Occupied */}
          <circle 
            cx="50" cy="50" r="40" 
            fill="transparent" 
            stroke="#1e293b" 
            strokeWidth="20" 
            strokeDasharray={`${occupiedPct * 2.51327} 251.327`} 
            strokeDashoffset="0"
          />
          {/* Maintenance */}
          <circle 
            cx="50" cy="50" r="40" 
            fill="transparent" 
            stroke="#f59e0b" 
            strokeWidth="20" 
            strokeDasharray={`${maintenancePct * 2.51327} 251.327`} 
            strokeDashoffset={`-${occupiedPct * 2.51327}`}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-slate-900">{Math.round(occupiedPct)}%</span>
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Occupied</span>
        </div>
      </div>
      <div className="flex justify-between w-full mt-8 space-x-2">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-slate-900"></div>
          <span className="text-xs text-slate-600 font-medium">Occupied ({occupied})</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-slate-100 border border-slate-300"></div>
          <span className="text-xs text-slate-600 font-medium">Available ({available})</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <span className="text-xs text-slate-600 font-medium">Maint. ({maintenance})</span>
        </div>
      </div>
    </div>
  );
}
