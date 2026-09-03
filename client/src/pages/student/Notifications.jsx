import React, { useState, useEffect } from 'react';
import { notificationService } from '../../api/notificationService';
import { PageHeader } from '../../components/shared/PageHeader';
import { Bell, CheckCircle } from 'lucide-react';

export default function StudentNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await notificationService.getNotifications();
        setNotifications(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 animate-pulse space-y-6">
        <div className="h-24 bg-slate-200 rounded-xl"></div>
        <div className="h-64 bg-slate-200 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Notifications" 
        description="Stay updated with your latest alerts and announcements."
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <Bell className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-1">No notifications</h3>
            <p>You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map(notif => (
              <div key={notif.id} className="p-4 sm:p-6 hover:bg-slate-50 transition-colors flex items-start space-x-4">
                <div className={`p-2 rounded-full ${notif.status === 'sent' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'}`}>
                  <Bell className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-slate-900">{notif.title || 'Notification'}</h4>
                    <span className="text-xs text-slate-500">{new Date(notif.sent_at || notif.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-600 text-sm mt-1">{notif.message || 'You have a new alert regarding your outing request.'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
