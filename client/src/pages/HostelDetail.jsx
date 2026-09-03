import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { hostelApi } from '../api/hostelApi';
import { Button } from '../components/ui/Button';
import { ChevronRight, ArrowLeft, Building2, Server, LayoutGrid } from 'lucide-react';
import { PageHeader } from '../components/shared/PageHeader';
import { Tabs } from '../components/ui/Tabs';
import { StatCard } from '../components/shared/StatCard';
import { FloorsTab } from '../components/dashboard/FloorsTab';
import { useToast } from '../context/ToastContext';

export default function HostelDetail() {
  const { hostelId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [hostel, setHostel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Use getAll to get the nested counts easily
        const allRes = await hostelApi.getAll();
        const currentHostel = allRes.data.find(h => h.id === hostelId);
        
        if (!currentHostel) throw new Error("Not found");
        setHostel(currentHostel);
      } catch (err) {
        showToast("Hostel not found", "error");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [hostelId]);

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse max-w-7xl mx-auto">
        <div className="h-20 bg-slate-200 rounded-xl w-full"></div>
        <div className="h-96 bg-slate-200 rounded-xl w-full mt-8"></div>
      </div>
    );
  }

  if (!hostel) {
    return (
      <div className="p-8 max-w-7xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-slate-900">Hostel Not Found</h2>
        <Button onClick={() => navigate('/warden/hostels')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Infrastructure
        </Button>
      </div>
    );
  }

  const overviewContent = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard title="Total Capacity" value={hostel.bed_count || 0} icon={<Building2 className="w-5 h-5 text-primary" />} />
        <StatCard title="Occupied" value={hostel.occupied_beds || 0} icon={<Server className="w-5 h-5 text-emerald-600" />} />
        <StatCard title="Available" value={(hostel.bed_count || 0) - (hostel.occupied_beds || 0)} icon={<LayoutGrid className="w-5 h-5 text-amber-600" />} />
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Insights</h3>
        <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
          This hostel is operating at {hostel.bed_count ? Math.round((hostel.occupied_beds / hostel.bed_count) * 100) : 0}% capacity. 
          There are currently no outstanding maintenance requests that require immediate attention.
        </p>
      </div>
    </div>
  );

  const settingsContent = (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Hostel Configuration</h3>
      <p className="text-sm text-slate-500">Settings and configuration options will appear here.</p>
    </div>
  );

  const tabOptions = [
    { label: 'Overview', value: 'overview', content: overviewContent },
    { label: 'Floors & Rooms', value: 'floors', content: <FloorsTab hostelId={hostelId} /> },
    { label: 'Settings', value: 'settings', content: settingsContent },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
      <nav className="flex items-center space-x-2 text-sm text-slate-500 font-medium mb-[-1rem]">
        <Link to="/warden/hostels" className="hover:text-primary transition-colors">Infrastructure</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-900">{hostel.name}</span>
      </nav>

      <PageHeader 
        title={hostel.name}
        description={`${hostel.type || 'Hostel'} • ${hostel.code} • Years ${hostel.academic_years?.join(', ')}`}
        action={
          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => navigate('/warden/hostels')}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <Button>Manage Infrastructure</Button>
          </div>
        }
      />

      <Tabs tabs={tabOptions} defaultValue="overview" />
    </div>
  );
}
