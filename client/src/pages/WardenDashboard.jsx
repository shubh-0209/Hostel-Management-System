import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { hostelApi } from '../api/hostelApi';
import { wardenApi } from '../api/wardenApi';
import { StatCard } from '../components/shared/StatCard';
import { Users, Bed, BedDouble, AlertCircle, TrendingUp } from 'lucide-react';
import { OccupancyChart } from '../components/dashboard/OccupancyChart';
import { HostelOverviewCard } from '../components/dashboard/HostelOverviewCard';
import { ActivityList } from '../components/dashboard/ActivityList';
import { OutingRequestCard } from '../components/dashboard/OutingRequestCard';
import { NotificationPanel } from '../components/dashboard/NotificationPanel';
import { QuickActions } from '../components/dashboard/QuickActions';

export default function WardenDashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [outings, setOutings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Fetch dashboard statistics
        const statsRes = await wardenApi.getDashboardStats();
        setStats(statsRes.data);
        
        // Fetch Top 2 Hostels for overview
        const hostelsRes = await hostelApi.getAll();
        setHostels(hostelsRes.data.slice(0, 2) || []);
        
        // Fetch Pending Outings for quick action
        const outingsRes = await wardenApi.getOutings('pending');
        // Slice top 3 for dashboard
        setOutings(outingsRes.data.slice(0, 3) || []);
        
        // Activity API is pending
        setActivities([]); 
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-20 bg-slate-200 rounded-xl w-full"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
      {/* Welcome Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Good morning, Warden
          </h1>
          <p className="text-slate-500 mt-1">Here's what's happening across your hostels today.</p>
        </div>
        <div className="mt-4 md:mt-0 relative z-10">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700 border border-slate-200 shadow-sm">
            {today}
          </span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard 
          title="Total Students" 
          value={stats?.total_students || 0} 
          icon={<Users className="w-5 h-5 text-primary" />} 
          trend="Enrolled"
          trendPositive={true}
        />
        <StatCard 
          title="Occupancy Rate" 
          value={`${stats?.occupancy_rate || 0}%`} 
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />} 
          trend={`${stats?.occupied_beds || 0} beds allocated`}
          trendPositive={true}
        />
        <StatCard 
          title="Available Beds" 
          value={stats?.available_beds || 0} 
          icon={<Bed className="w-5 h-5 text-amber-600" />} 
          trend={`Out of ${stats?.total_beds || 0} total`}
          trendPositive={true}
        />
        <StatCard 
          title="Pending Operations" 
          value={(stats?.pending_outings || 0) + (stats?.pending_maintenance || 0)} 
          icon={<AlertCircle className="w-5 h-5 text-red-600" />} 
          trend={`${stats?.pending_outings || 0} outings, ${stats?.pending_maintenance || 0} tasks`}
          trendPositive={false}
        />
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        
        {/* Left Column (Charts & Hostels) */}
        <div className="lg:col-span-2 space-y-6 lg:space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <OccupancyChart 
              occupied={stats?.occupied_beds || 0} 
              available={stats?.available_beds || 0} 
              maintenance={0} 
            />
            <QuickActions />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Hostel Overview</h2>
              <a href="/warden/hostels" className="text-sm font-medium text-primary hover:text-primary-light">View all</a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {hostels.length > 0 ? hostels.map(hostel => (
                <HostelOverviewCard key={hostel.id} hostel={hostel} />
              )) : (
                <div className="col-span-2 text-sm text-slate-500 bg-white p-6 rounded-xl border border-slate-200 text-center">No hostels configured.</div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Pending Outing Requests</h2>
              <a href="/warden/outings" className="text-sm font-medium text-primary hover:text-primary-light">View all</a>
            </div>
            <div className="space-y-3">
              {outings.map((request, idx) => (
                <OutingRequestCard key={idx} request={request} />
              ))}
              {outings.length === 0 && (
                <div className="text-sm text-slate-500 bg-white p-6 rounded-xl border border-slate-200 text-center">API coming soon. No pending requests available.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Activity & Notifications) */}
        <div className="space-y-6 lg:space-y-8">
          <NotificationPanel notifications={[]} />
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center text-sm text-slate-500">
            Activity feed API coming soon.
          </div>
        </div>
        
      </div>
    </div>
  );
}
