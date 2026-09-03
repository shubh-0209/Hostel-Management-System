import React, { useState, useEffect } from 'react';
import { outingService } from '../../api/outingService';
import { PageHeader } from '../../components/shared/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../context/ToastContext';
import { Calendar, Clock, LogOut, Info } from 'lucide-react';

export default function StudentOutings() {
  const [outings, setOutings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const [outDate, setOutDate] = useState('');
  const [inDate, setInDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOutings();
  }, []);

  async function fetchOutings() {
    try {
      setLoading(true);
      const res = await outingService.getOutings();
      setOutings(res.data || []);
    } catch (err) {
      showToast('Failed to load outings', 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await outingService.createOuting({
        out_datetime: new Date(outDate).toISOString(),
        in_datetime: new Date(inDate).toISOString(),
        reason
      });
      showToast('Outing request submitted successfully', 'success');
      setOutDate('');
      setInDate('');
      setReason('');
      fetchOutings();
    } catch (err) {
      showToast(err.response?.data?.error || err.message || 'Submission failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-semibold">Pending</span>;
      case 'approved': return <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-semibold">Approved</span>;
      case 'rejected': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold">Rejected</span>;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-pulse space-y-6">
        <div className="h-24 bg-slate-200 rounded-xl"></div>
        <div className="h-64 bg-slate-200 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Outing Requests" 
        description="Request permission to leave the hostel and track your history."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Request Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <LogOut className="w-5 h-5 mr-2 text-primary" /> New Request
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Out Time</label>
                <Input 
                  type="datetime-local" 
                  value={outDate} 
                  onChange={e => setOutDate(e.target.value)}
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Return Time</label>
                <Input 
                  type="datetime-local" 
                  value={inDate} 
                  onChange={e => setInDate(e.target.value)}
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                <textarea 
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  rows={3}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  required 
                  minLength={5}
                ></textarea>
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </form>
          </div>
        </div>

        {/* History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900">Request History</h3>
            </div>
            {outings.length === 0 ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                <Calendar className="w-12 h-12 text-slate-300 mb-4" />
                <p>No outing requests found.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {outings.map(outing => (
                  <div key={outing.id} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-sm text-slate-500 mb-1 flex items-center">
                          <Clock className="w-4 h-4 mr-1" /> Requested on {new Date(outing.created_at).toLocaleDateString()}
                        </div>
                        <p className="font-medium text-slate-900 text-sm mt-2">{outing.reason}</p>
                      </div>
                      {getStatusBadge(outing.status)}
                    </div>
                    <div className="flex items-center space-x-6 text-sm">
                      <div>
                        <span className="block text-slate-500 text-xs uppercase tracking-wider">Out</span>
                        <span className="font-medium text-slate-700">{new Date(outing.out_datetime).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500 text-xs uppercase tracking-wider">In</span>
                        <span className="font-medium text-slate-700">{new Date(outing.in_datetime).toLocaleString()}</span>
                      </div>
                    </div>
                    {outing.status === 'rejected' && outing.rejection_reason && (
                      <div className="mt-3 p-3 bg-red-50 text-red-700 text-sm rounded flex items-start">
                        <Info className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
                        <span>{outing.rejection_reason}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
