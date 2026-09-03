import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { allocationService } from '../../api/allocationService';
import { Button } from '../../components/ui/Button';
import { Bed, ArrowRight, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';

export default function StudentAllocation() {
  const [allocation, setAllocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchAllocation() {
      try {
        const res = await allocationService.getMyAllocation();
        setAllocation(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAllocation();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-pulse">
        <div className="h-24 bg-slate-200 rounded-xl w-full"></div>
        <div className="h-64 bg-slate-200 rounded-xl w-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
      
      <PageHeader 
        title="My Allocation" 
        description="View the details of your current hostel accommodation."
      />

      {allocation ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8 bg-primary/5 border-b border-slate-100 flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-primary/20 p-4 rounded-2xl text-primary">
                <Bed className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{allocation.hostel?.name}</h2>
                <div className="flex items-center space-x-2 mt-2 text-sm text-slate-600 font-medium">
                  <span className="bg-white px-2 py-1 rounded border border-slate-200">Floor {allocation.floor?.floor_number}</span>
                  <span className="bg-white px-2 py-1 rounded border border-slate-200">Room {allocation.room?.room_number}</span>
                  <span className="bg-primary text-white px-2 py-1 rounded shadow-sm">Bed {allocation.bed?.bed_number}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <span className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Allocated</span>
              </span>
              <span className="text-xs text-slate-500">
                Since {new Date(allocation.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="p-6 sm:p-8 grid grid-cols-2 gap-8">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Room Details</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex justify-between border-b border-slate-100 pb-2">
                  <span>Room Type</span>
                  <span className="font-medium text-slate-900">{allocation.room?.type || 'N/A'}</span>
                </li>
                <li className="flex justify-between border-b border-slate-100 pb-2">
                  <span>Capacity</span>
                  <span className="font-medium text-slate-900">{allocation.room?.capacity || 0} Beds</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Hostel Rules</h4>
              <ul className="space-y-3 text-sm text-slate-600 list-disc pl-4 marker:text-slate-300">
                <li>No loud noise after 10 PM.</li>
                <li>Visitors allowed only in common areas.</li>
                <li>Maintain cleanliness in the room.</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <Bed className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">You don't have an active bed allocation.</h3>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            You haven't been assigned a bed yet. Browse the available hostels and select a bed that suits your preferences.
          </p>
          <Button size="lg" onClick={() => navigate('/student/hostels')}>
            Browse Available Hostels <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
