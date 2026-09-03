import React from 'react';

export function ActivityList({ activities }) {
  if (!activities || activities.length === 0) return <div className="p-6 text-sm text-slate-500">No recent activities.</div>;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-sm font-semibold text-slate-900 mb-6">Recent Activities</h3>
      <div className="space-y-6">
        {activities.map((activity, idx) => (
          <div key={activity.id || idx} className="flex relative">
            {idx !== activities.length - 1 && (
              <div className="absolute top-8 left-4 bottom-[-24px] w-0.5 bg-slate-100"></div>
            )}
            <div className="relative flex-shrink-0 w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mr-4 z-10">
              <span className="text-slate-400 text-xs">●</span>
            </div>
            <div className="flex-1 pb-1">
              <p className="text-sm text-slate-800">{activity.description}</p>
              <p className="text-xs text-slate-500 mt-1">{activity.timestamp}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
