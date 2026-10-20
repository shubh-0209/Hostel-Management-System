import React, { useState, useEffect } from 'react';
import { wardenApi } from '../../api/wardenApi';
import { PageHeader } from '../../components/shared/PageHeader';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import { Wrench, CheckCircle, Clock } from 'lucide-react';

export default function WardenMaintenance() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    try {
      setLoading(true);
      const res = await wardenApi.getMaintenanceRequests();
      setRequests(res.data || []);
    } catch (err) {
      showToast('Failed to load maintenance requests', 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateStatus = async (id, status) => {
    try {
      await wardenApi.updateMaintenanceStatus(id, status);
      showToast('Status updated successfully', 'success');
      fetchRequests();
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Maintenance Requests" 
        description="Track and resolve hostel maintenance issues."
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
           <div className="p-12 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <Wrench className="w-12 h-12 text-slate-300 mb-4" />
            <p>No maintenance requests found.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {requests.map(req => (
              <div key={req.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-bold text-slate-900">{req.issue_type}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${req.priority === 'high' || req.priority === 'critical' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                        {req.priority?.toUpperCase()}
                      </span>
                      <StatusBadge status={req.status} />
                    </div>
                    
                    <p className="text-slate-700 text-sm mb-3">{req.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-slate-500">
                      <span><strong>Hostel:</strong> {req.hostels?.name}</span>
                      {req.rooms && <span><strong>Room:</strong> {req.rooms?.room_number}</span>}
                      <span><strong>Reported:</strong> {new Date(req.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {req.status !== 'resolved' && (
                    <div className="flex flex-col space-y-2 min-w-[140px]">
                      {req.status === 'pending' && (
                        <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(req.id, 'in_progress')}>
                          <Clock className="w-4 h-4 mr-2" /> Start Work
                        </Button>
                      )}
                      {(req.status === 'pending' || req.status === 'in_progress') && (
                        <Button size="sm" variant="success" onClick={() => handleUpdateStatus(req.id, 'resolved')}>
                          <CheckCircle className="w-4 h-4 mr-2" /> Mark Resolved
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
