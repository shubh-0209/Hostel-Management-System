import React, { useState, useEffect } from 'react';
import { wardenApi } from '../../api/wardenApi';
import { PageHeader } from '../../components/shared/PageHeader';
import { BarChart3, Building2 } from 'lucide-react';
import { OccupancyChart } from '../../components/dashboard/OccupancyChart';

export default function WardenOccupancyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await wardenApi.getOccupancyReport();
        setReports(res.data || []);
      } catch (err) {
        console.error("Failed to load reports", err);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Occupancy Reports" 
        description="Detailed hostel allocation and capacity metrics."
      />

      {loading ? (
        <div className="p-12 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {reports.map(report => (
              <div key={report.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-primary/10 rounded-lg mr-3">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{report.name}</h3>
                  </div>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${report.occupancy_percentage >= 90 ? 'bg-red-100 text-red-700' : report.occupancy_percentage >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {report.occupancy_percentage}% Filled
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <span className="block text-xl font-bold text-slate-900">{report.total_beds}</span>
                    <span className="text-xs text-slate-500 uppercase tracking-wider">Total</span>
                  </div>
                  <div className="text-center p-3 bg-emerald-50 rounded-lg">
                    <span className="block text-xl font-bold text-emerald-700">{report.available_beds}</span>
                    <span className="text-xs text-emerald-600 uppercase tracking-wider">Available</span>
                  </div>
                  <div className="text-center p-3 bg-indigo-50 rounded-lg">
                    <span className="block text-xl font-bold text-indigo-700">{report.occupied_beds}</span>
                    <span className="text-xs text-indigo-600 uppercase tracking-wider">Occupied</span>
                  </div>
                </div>

                <div className="mt-auto">
                  <OccupancyChart 
                    occupied={report.occupied_beds} 
                    available={report.available_beds} 
                    maintenance={0} 
                  />
                </div>
              </div>
            ))}
          </div>

          {reports.length === 0 && (
            <div className="p-12 bg-white rounded-xl border border-slate-200 text-center text-slate-500 flex flex-col items-center">
              <BarChart3 className="w-12 h-12 text-slate-300 mb-4" />
              <p>No occupancy data available.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
