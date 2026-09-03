import React from 'react';
import { Plus, Settings, Users, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function QuickActions() {
  const navigate = useNavigate();
  
  const actions = [
    { icon: Plus, label: 'Add Hostel', color: 'text-blue-600', bg: 'bg-blue-50', path: '/warden/hostels' },
    { icon: Settings, label: 'Infrastructure', color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/warden/hostels' },
    { icon: Users, label: 'View Students', color: 'text-amber-600', bg: 'bg-amber-50', path: '/warden/students' },
    { icon: FileText, label: 'Review Outings', color: 'text-purple-600', bg: 'bg-purple-50', path: '/warden/outings' },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <button
              key={idx}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center justify-center p-4 rounded-lg border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all bg-slate-50/50 hover:bg-white group"
            >
              <div className={`${action.bg} ${action.color} p-2.5 rounded-lg mb-2 group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-slate-700 text-center">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
