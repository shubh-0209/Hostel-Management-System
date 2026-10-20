import React, { useState, useEffect } from 'react';
import { notificationService } from '../../api/notificationService';
import { PageHeader } from '../../components/shared/PageHeader';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import { 
  Bell, 
  CheckCircle2, 
  CheckCheck, 
  RotateCw, 
  Calendar, 
  AlertCircle,
  Inbox
} from 'lucide-react';

export default function StudentNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState(null);
  const [error, setError] = useState(null);

  const { showToast } = useToast();

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      setLoading(true);
      setError(null);
      const res = await notificationService.getNotifications();
      setNotifications(res.data || []);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to load notifications';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleMarkRead = async (id) => {
    try {
      setMarkingId(id);
      await notificationService.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      showToast('Notification marked as read', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to mark as read', 'error');
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    const unreadCount = notifications.filter(n => !n.is_read).length;
    if (unreadCount === 0) return;

    try {
      setMarkingAll(true);
      await notificationService.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      showToast('All notifications marked as read', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to mark all as read', 'error');
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 animate-pulse space-y-6">
        <div className="h-20 bg-slate-200 rounded-xl"></div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-slate-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
      
      <PageHeader 
        title="Notifications" 
        description="Stay informed with real-time alerts regarding your bed allocation, outings, and institution announcements."
        action={
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchNotifications}
              disabled={loading}
              title="Refresh notifications"
            >
              <RotateCw className="w-3.5 h-3.5 mr-1.5" />
              Refresh
            </Button>
            {unreadCount > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleMarkAllRead}
                disabled={markingAll}
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1.5 text-primary" />
                {markingAll ? 'Marking...' : 'Mark All Read'}
              </Button>
            )}
          </div>
        }
      />

      {error && !notifications.length && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="outline" onClick={fetchNotifications}>Retry</Button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Header stats bar */}
        <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">All Notifications</span>
            <span className="bg-slate-200 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              {notifications.length}
            </span>
          </div>
          {unreadCount > 0 ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              {unreadCount} unread
            </span>
          ) : (
            <span className="text-xs text-slate-500 font-medium">All caught up</span>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">No notifications yet</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              You will receive updates here whenever your out pass or leave requests are reviewed, or when room changes occur.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map(notif => {
              const isUnread = !notif.is_read;
              return (
                <div 
                  key={notif.id} 
                  className={`p-5 sm:p-6 transition-colors flex items-start space-x-4 ${
                    isUnread ? 'bg-primary/5 hover:bg-primary/[0.08]' : 'hover:bg-slate-50/70'
                  }`}
                >
                  {/* Icon */}
                  <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                    isUnread 
                      ? 'bg-primary text-white shadow-xs' 
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    <Bell className="w-4 h-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                      <div className="flex items-center space-x-2">
                        <h4 className={`text-sm ${isUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                          {notif.title || 'Institutional Notification'}
                        </h4>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0" title="Unread"></span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(notif.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>

                    <p className={`text-xs leading-relaxed ${isUnread ? 'text-slate-800' : 'text-slate-600'}`}>
                      {notif.message}
                    </p>

                    {isUnread && (
                      <div className="mt-3">
                        <button 
                          onClick={() => handleMarkRead(notif.id)}
                          disabled={markingId === notif.id}
                          className="text-xs font-semibold text-primary hover:text-primary-dark inline-flex items-center transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          {markingId === notif.id ? 'Marking...' : 'Mark as read'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
