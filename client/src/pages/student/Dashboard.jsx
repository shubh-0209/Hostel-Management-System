import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { allocationService } from '../../api/allocationService';
import { studentService } from '../../api/studentService';
import { outingService } from '../../api/outingService';
import { notificationService } from '../../api/notificationService';
import { Button } from '../../components/ui/Button';
import { Bed, Building2, UserCircle, ArrowRight, Clock, Bell, LogOut, CheckCircle } from 'lucide-react';

export default function StudentDashboard() {
  const [allocation, setAllocation] = useState(null);
  const [profile, setProfile] = useState(null);
  const [recentOuting, setRecentOuting] = useState(null);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      
      // Fetch allocation (critical)
      try {
        const res = await allocationService.getMyAllocation();
        setAllocation(res.data);
      } catch (err) {
        console.error('Failed to fetch allocation:', err);
      }

      // Fetch other data gracefully
      const promises = [
        studentService.getProfile().catch(e => ({ error: e })),
        outingService.getOutings().catch(e => ({ error: e })),
        notificationService.getNotifications().catch(e => ({ error: e }))
      ];

      const [profileRes, outingsRes, notifRes] = await Promise.all(promises);

      if (!profileRes.error) {
        setProfile(profileRes.data);
      }
      
      if (!outingsRes.error && outingsRes.data?.length > 0) {
        setRecentOuting(outingsRes.data[0]); // latest outing
      }

      if (!notifRes.error && notifRes.data) {
        setRecentNotifications(notifRes.data.filter(n => !n.is_read).slice(0, 3));
      }

      setLoading(false);
    }
    
    fetchDashboardData();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markRead(id);
      setRecentNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const getOutingStatusBadge = (status) => {
    switch(status) {
      case 'pending': return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-semibold">Pending</span>;
      case 'approved': return <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-semibold">Approved</span>;
      case 'rejected': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold">Rejected</span>;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-pulse">
        <div className="h-32 bg-slate-200 rounded-xl w-full"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-48 bg-slate-200 rounded-xl w-full"></div>
            <div className="h-48 bg-slate-200 rounded-xl w-full"></div>
          </div>
          <div className="space-y-6">
            <div className="h-64 bg-slate-200 rounded-xl w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const studentName = profile?.name || 'Student';

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
      
      {/* Welcome Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex items-center space-x-4">
          <div className="bg-primary/10 p-3 rounded-full text-primary">
            <UserCircle className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Welcome back, {studentName}
            </h1>
            <p className="text-slate-500 mt-1">
              {profile?.jntu_number ? `Roll No: ${profile.jntu_number}` : 'Manage your accommodation and profile.'}
              {profile?.department && ` • ${profile.department}`}
            </p>
          </div>
        </div>
        <div className="mt-4 md:mt-0 relative z-10">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700 border border-slate-200 shadow-sm">
            {today}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Allocation Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Current Allocation</h2>
            </div>
            
            {allocation ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 relative">
                <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Allocated
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 p-4 rounded-xl text-primary">
                    <Bed className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">{allocation.hostel?.name}</h3>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                      <p className="text-slate-600"><span className="text-slate-400">Floor:</span> {allocation.floor?.floor_number}</p>
                      <p className="text-slate-600"><span className="text-slate-400">Room:</span> {allocation.room?.room_number}</p>
                      <p className="text-slate-600"><span className="text-slate-400">Bed:</span> {allocation.bed?.bed_number}</p>
                      <p className="text-slate-600"><span className="text-slate-400">Type:</span> {allocation.room?.type || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 border-dashed shadow-sm p-8 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bed className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">No bed allocated yet.</h3>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">
                  You currently don't have an active bed allocation in any of our hostels. 
                  Browse available hostels to find your accommodation.
                </p>
                <Button onClick={() => navigate('/student/hostels')}>
                  Browse Available Hostels <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </section>

          {/* Outings Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Latest Outing Request</h2>
              <button 
                onClick={() => navigate('/student/outings')}
                className="text-sm font-medium text-primary hover:text-primary-light flex items-center"
              >
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
            
            {recentOuting ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-slate-300 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center text-slate-700 font-medium">
                    <LogOut className="w-5 h-5 mr-2 text-primary" />
                    {recentOuting.reason}
                  </div>
                  {getOutingStatusBadge(recentOuting.status)}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mt-4 bg-slate-50 p-3 rounded-lg">
                  <div>
                    <span className="block text-slate-500 text-xs uppercase tracking-wider mb-1">Out</span>
                    <span className="font-medium text-slate-800 flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                      {new Date(recentOuting.out_datetime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-500 text-xs uppercase tracking-wider mb-1">In</span>
                    <span className="font-medium text-slate-800 flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                      {new Date(recentOuting.in_datetime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-center">
                <LogOut className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No recent outing requests.</p>
                <button 
                  onClick={() => navigate('/student/outings')}
                  className="mt-3 text-sm font-medium text-primary hover:underline"
                >
                  Create new request
                </button>
              </div>
            )}
          </section>

        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          
          {/* Notifications */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center">
                Notifications
                {recentNotifications.length > 0 && (
                  <span className="ml-2 bg-red-100 text-red-700 py-0.5 px-2 rounded-full text-xs font-bold">
                    {recentNotifications.length} new
                  </span>
                )}
              </h2>
              <button 
                onClick={() => navigate('/student/notifications')}
                className="text-sm font-medium text-primary hover:text-primary-light"
              >
                All
              </button>
            </div>
            
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {recentNotifications.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {recentNotifications.map(notif => (
                    <div key={notif.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex space-x-3">
                        <div className="bg-primary/10 p-2 rounded-full text-primary shrink-0 self-start">
                          <Bell className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-slate-900 truncate">{notif.title || 'Notification'}</h4>
                          <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{notif.message}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[10px] text-slate-400">
                              {new Date(notif.created_at).toLocaleDateString()}
                            </span>
                            <button 
                              onClick={() => handleMarkRead(notif.id)}
                              className="text-[10px] font-medium text-primary hover:text-primary-light flex items-center"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" /> Mark read
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">You're all caught up!</p>
                </div>
              )}
            </div>
          </section>

          {/* Quick Actions */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h2>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-100">
                <button 
                  onClick={() => navigate('/student/hostels')}
                  className="w-full flex items-center p-4 hover:bg-slate-50 transition-colors text-left group"
                >
                  <div className="bg-primary/10 p-2 rounded-lg text-primary mr-3 group-hover:scale-110 transition-transform">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900">Browse Hostels</div>
                    <div className="text-xs text-slate-500">View available rooms</div>
                  </div>
                </button>
                
                <button 
                  onClick={() => navigate('/student/profile')}
                  className="w-full flex items-center p-4 hover:bg-slate-50 transition-colors text-left group"
                >
                  <div className="bg-blue-100 p-2 rounded-lg text-blue-700 mr-3 group-hover:scale-110 transition-transform">
                    <UserCircle className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900">Update Profile</div>
                    <div className="text-xs text-slate-500">Manage your details</div>
                  </div>
                </button>
              </div>
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}

