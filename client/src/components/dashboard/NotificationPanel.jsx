import React from 'react';
import { Bell } from 'lucide-react';

export function NotificationPanel({ notifications }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
        <div className="p-1.5 bg-slate-50 rounded-md text-slate-500">
          <Bell className="w-4 h-4" />
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {notifications?.map((notif, idx) => (
          <div key={idx} className="p-4 hover:bg-slate-50 transition-colors">
            <h4 className="text-sm font-medium text-slate-900">{notif.title}</h4>
            <p className="text-xs text-slate-500 mt-1">{notif.description}</p>
            <span className="text-[10px] text-slate-400 mt-2 block">{notif.date}</span>
          </div>
        ))}
        {(!notifications || notifications.length === 0) && (
          <div className="p-8 text-center text-sm text-slate-500">All caught up!</div>
        )}
      </div>
    </div>
  );
}
