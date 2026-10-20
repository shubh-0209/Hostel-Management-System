import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentService } from '../../api/studentService';
import { PageHeader } from '../../components/shared/PageHeader';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Building2, Search, ArrowRight, Bed } from 'lucide-react';

export default function StudentHostels() {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchHostels();
  }, []);

  async function fetchHostels() {
    try {
      setLoading(true);
      setError(null);
      const res = await studentService.getHostels();
      setHostels(res.data || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load hostels');
    } finally {
      setLoading(false);
    }
  }

  const filteredHostels = hostels.filter(h => {
    const matchesSearch = h.name.toLowerCase().includes(search.toLowerCase()) || (h.code && h.code.toLowerCase().includes(search.toLowerCase()));
    const matchesYear = yearFilter ? h.academic_years?.includes(parseInt(yearFilter, 10)) : true;
    // Room Type and Availability filters are omitted or simplified since hostel API doesn't return room types directly
    return matchesSearch && matchesYear;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-pulse">
        <div className="h-24 bg-slate-200 rounded-xl w-full"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-slate-200 rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
      
      <PageHeader 
        title="Find Your Hostel" 
        description="Explore available hostel rooms and choose the accommodation that works best for you."
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <Button size="sm" variant="outline" onClick={fetchHostels}>Retry</Button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            className="pl-9 w-full" 
            placeholder="Search by hostel name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
            <option value="">All Academic Years</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </Select>
        </div>
      </div>

      {filteredHostels.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No hostels are currently available.</h3>
          <p className="text-slate-500">Try adjusting your search filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHostels.map((hostel) => {
            const occupied = hostel.occupied_beds || 0;
            const total = hostel.bed_count || 0;
            const available = total - occupied;
            const isFull = total > 0 && available === 0;

            return (
              <div key={hostel.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:border-primary/50 transition-all overflow-hidden flex flex-col group">
                <div className="bg-slate-50 border-b border-slate-100 p-6 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-3">
                    <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div className="flex space-x-2">
                      {isFull ? (
                        <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-semibold">Full</span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-semibold">Available</span>
                      )}
                      <span className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-xs font-semibold">{hostel.type || 'Hostel'}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{hostel.name}</h3>
                    <p className="text-sm font-medium text-slate-500">{hostel.code}</p>
                  </div>
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                    <div>
                      <span className="block text-slate-500 mb-1">Academic Years</span>
                      <span className="font-semibold text-slate-900">{hostel.academic_years?.join(', ') || 'Any'}</span>
                    </div>
                    <div>
                      <span className="block text-slate-500 mb-1">Total Rooms</span>
                      <span className="font-semibold text-slate-900">{hostel.room_count || 0}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3 flex items-center justify-between mb-6">
                    <div className="flex items-center text-slate-700 font-medium text-sm">
                      <Bed className="w-4 h-4 mr-2 text-primary" />
                      <span>{available} Beds Available</span>
                    </div>
                    <span className="text-xs text-slate-500">out of {total}</span>
                  </div>

                  <div className="mt-auto pt-4 border-t border-slate-100">
                    <Button 
                      className="w-full justify-between" 
                      variant={isFull ? 'outline' : 'default'}
                      onClick={() => navigate(`/student/hostels/${hostel.id}`)}
                    >
                      View Details
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
