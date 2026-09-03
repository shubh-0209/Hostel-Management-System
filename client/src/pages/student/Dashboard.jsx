import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { allocationService } from '../../api/allocationService';
import { Button } from '../../components/ui/Button';
import { Bed, Building2, UserCircle, ArrowRight } from 'lucide-react';

export default function StudentDashboard() {
  const [allocation, setAllocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await allocationService.getMyAllocation();
        setAllocation(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-pulse">
        <div className="h-32 bg-slate-200 rounded-xl w-full"></div>
        <div className="h-64 bg-slate-200 rounded-xl w-full"></div>
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
            Welcome back, Student
          </h1>
          <p className="text-slate-500 mt-1">Manage your accommodation and profile.</p>
        </div>
        <div className="mt-4 md:mt-0 relative z-10">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700 border border-slate-200 shadow-sm">
            {today}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-slate-900">Current Allocation</h2>
          </div>
          
          {allocation ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 relative">
              <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                Allocated
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-primary/10 p-3 rounded-xl text-primary">
                  <Bed className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{allocation.hostel?.name}</h3>
                  <p className="text-slate-600 mt-1">
                    Floor {allocation.floor?.floor_number} &middot; Room {allocation.room?.room_number} &middot; Bed {allocation.bed?.bed_number}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">Room Type: {allocation.room?.type || 'N/A'}</p>
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
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Quick Actions</h2>
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
                onClick={() => navigate('/student/allocation')}
                className="w-full flex items-center p-4 hover:bg-slate-50 transition-colors text-left group"
              >
                <div className="bg-emerald-100 p-2 rounded-lg text-emerald-700 mr-3 group-hover:scale-110 transition-transform">
                  <Bed className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-900">My Allocation</div>
                  <div className="text-xs text-slate-500">View current bed details</div>
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
        </div>

      </div>
    </div>
  );
}
