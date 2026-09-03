import React from 'react';
import { Building2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function HostelOverviewCard({ hostel }) {
  const navigate = useNavigate();
  const occupancyPct = Math.round((hostel.occupied_beds / hostel.total_beds) * 100);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-primary/10 p-2 rounded-lg text-primary">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{hostel.name}</h3>
            <p className="text-xs text-slate-500">Years {hostel.years?.join(', ')}</p>
          </div>
        </div>
      </div>
      <div className="p-5 flex-1 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Capacity</p>
          <div className="mt-1 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900">{hostel.occupied_beds}</span>
            <span className="text-sm text-slate-500">/ {hostel.total_beds}</span>
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Occupancy</p>
          <div className="mt-1 flex items-center space-x-2">
            <span className="text-2xl font-bold text-slate-900">{occupancyPct}%</span>
          </div>
        </div>
      </div>
      <div className="p-5 bg-slate-50 border-t border-slate-100">
        <div className="w-full bg-slate-200 rounded-full h-2 mb-4">
          <div className="bg-primary h-2 rounded-full" style={{ width: `${occupancyPct}%` }}></div>
        </div>
        <button 
          onClick={() => navigate(`/warden/hostels/${hostel.id}`)}
          className="w-full text-center text-sm font-medium text-primary hover:text-primary-light transition-colors"
        >
          View Infrastructure &rarr;
        </button>
      </div>
    </div>
  );
}
