import React, { useState, useEffect } from 'react';
import { wardenApi } from '../../api/wardenApi';
import { PageHeader } from '../../components/shared/PageHeader';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import { Calendar, CheckCircle, XCircle, Clock, MapPin, Phone, LogOut, CheckSquare, AlertCircle } from 'lucide-react';

export default function WardenOutings() {
  const [outings, setOutings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, approved, checked_out, returned, rejected, all
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    fetchOutings();
  }, [filter]);

  async function fetchOutings() {
    try {
      setLoading(true);
      const res = await wardenApi.getOutings(filter !== 'all' ? filter : undefined);
      setOutings(res.data || []);
    } catch (err) {
      showToast('Failed to load applications', 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleApprove = async (id) => {
    try {
      await wardenApi.updateOutingStatus(id, { status: 'approved' });
      showToast('Application approved', 'success');
      fetchOutings();
    } catch (err) {
      showToast(err.message || 'Failed to approve', 'error');
    }
  };

  const handleReject = async (id) => {
    if (!rejectionReason.trim()) {
      showToast('Please provide a reason for rejection', 'error');
      return;
    }
    try {
      await wardenApi.updateOutingStatus(id, { status: 'rejected', rejection_reason: rejectionReason });
      showToast('Application rejected', 'success');
      setRejectingId(null);
      setRejectionReason('');
      fetchOutings();
    } catch (err) {
      showToast(err.message || 'Failed to reject', 'error');
    }
  };

  const handleCheckout = async (id) => {
    try {
      await wardenApi.checkoutRequest(id);
      showToast('Student checked out successfully', 'success');
      fetchOutings();
    } catch (err) {
      showToast(err.response?.data?.error || err.message || 'Failed to checkout', 'error');
    }
  };

  const handleReturn = async (id) => {
    try {
      await wardenApi.returnRequest(id);
      showToast('Student marked as returned', 'success');
      fetchOutings();
    } catch (err) {
      showToast(err.response?.data?.error || err.message || 'Failed to return', 'error');
    }
  };

  const isOverdue = (outing) => {
    const now = new Date();
    if (outing.application_type === 'out_pass') {
      if (outing.status === 'checked_out' && !outing.actual_in_datetime) {
        return now > new Date(outing.in_datetime);
      }
    } else if (outing.application_type === 'leave') {
      if (outing.status === 'approved' && !outing.actual_in_datetime) {
        const toDate = new Date(outing.leave_to_date);
        toDate.setHours(23, 59, 59, 999);
        return now > toDate;
      }
    }
    return false;
  };

  const getStatusBadge = (outing) => {
    if (isOverdue(outing)) {
      return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold flex items-center"><AlertCircle className="w-3 h-3 mr-1"/> Overdue</span>;
    }
    switch(outing.status) {
      case 'pending': return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-semibold">Pending</span>;
      case 'approved': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold">Approved</span>;
      case 'rejected': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold">Rejected</span>;
      case 'cancelled': return <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-semibold">Cancelled</span>;
      case 'checked_out': return <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-semibold">Checked Out</span>;
      case 'returned': return <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-semibold">Returned</span>;
      default: return null;
    }
  };

  const formatLeaveType = (type) => {
    return type?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Application Management & Movement Register" 
        description="Review student out passes and leaves, and manage campus exits/entries."
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', 'pending', 'approved', 'checked_out', 'returned', 'rejected', 'cancelled'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === status 
                ? 'bg-primary text-white shadow-sm' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
        ) : outings.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <Calendar className="w-12 h-12 text-slate-300 mb-4" />
            <p>No {filter !== 'all' ? filter : ''} applications found.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {outings.map(outing => (
              <div key={outing.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2 flex-wrap gap-y-2">
                      <h4 className="font-bold text-slate-900 text-lg">{outing.students?.name}</h4>
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded font-mono">{outing.students?.jntu_number}</span>
                      <span className="text-xs text-slate-500 flex items-center"><Phone className="w-3 h-3 mr-1"/> {outing.students?.phone}</span>
                      {getStatusBadge(outing)}
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-3 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${outing.application_type === 'leave' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {outing.application_type === 'out_pass' ? 'Out Pass' : 'Leave'}
                      </span>
                      {outing.application_type === 'leave' && outing.leave_type && (
                        <span className="text-xs font-medium text-slate-500">
                          {formatLeaveType(outing.leave_type)}
                        </span>
                      )}
                    </div>

                    <p className="font-medium text-slate-700 text-sm mb-4">{outing.reason}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-white border border-slate-100 rounded-lg p-3">
                      {outing.application_type === 'out_pass' ? (
                        <>
                          <div>
                            <span className="block text-slate-500 text-[10px] uppercase tracking-wider font-semibold mb-1">Expected Out</span>
                            <span className="font-medium flex items-center"><Clock className="w-3 h-3 mr-1.5 text-slate-400"/> {new Date(outing.out_datetime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                          </div>
                          <div>
                            <span className="block text-slate-500 text-[10px] uppercase tracking-wider font-semibold mb-1">Expected In</span>
                            <span className="font-medium flex items-center"><Clock className="w-3 h-3 mr-1.5 text-slate-400"/> {new Date(outing.in_datetime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <span className="block text-slate-500 text-[10px] uppercase tracking-wider font-semibold mb-1">Leave From</span>
                            <span className="font-medium flex items-center"><Calendar className="w-3 h-3 mr-1.5 text-slate-400"/> {new Date(outing.leave_from_date).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="block text-slate-500 text-[10px] uppercase tracking-wider font-semibold mb-1">Leave To</span>
                            <span className="font-medium flex items-center"><Calendar className="w-3 h-3 mr-1.5 text-slate-400"/> {new Date(outing.leave_to_date).toLocaleDateString()}</span>
                          </div>
                        </>
                      )}
                      
                      {outing.actual_out_datetime && (
                        <div>
                          <span className="block text-slate-500 text-[10px] uppercase tracking-wider font-semibold mb-1 text-orange-600">Actual Out</span>
                          <span className="font-medium flex items-center"><LogOut className="w-3 h-3 mr-1.5 text-orange-400"/> {new Date(outing.actual_out_datetime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                      )}
                      {outing.actual_in_datetime && (
                        <div>
                          <span className="block text-slate-500 text-[10px] uppercase tracking-wider font-semibold mb-1 text-emerald-600">Actual In</span>
                          <span className="font-medium flex items-center"><CheckSquare className="w-3 h-3 mr-1.5 text-emerald-400"/> {new Date(outing.actual_in_datetime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                      )}
                    </div>
                    
                    {(outing.destination || outing.contact_info) && (
                      <div className="flex items-center space-x-6 mt-4 text-xs text-slate-500">
                        {outing.destination && (
                          <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1" /> {outing.destination}</span>
                        )}
                        {outing.contact_info && (
                          <span className="flex items-center"><Phone className="w-3.5 h-3.5 mr-1" /> {outing.contact_info} (Emergency)</span>
                        )}
                      </div>
                    )}
                    
                    {outing.status === 'rejected' && outing.rejection_reason && (
                      <p className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100 flex items-start">
                        <strong>Rejection Reason:</strong> <span className="ml-1">{outing.rejection_reason}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 min-w-[140px] shrink-0">
                    {/* Approvals */}
                    {outing.status === 'pending' && (
                      rejectingId === outing.id ? (
                        <div className="space-y-2 bg-white border border-slate-200 p-2 rounded-lg shadow-sm">
                          <input 
                            type="text"
                            placeholder="Reason..."
                            className="w-full text-sm border border-slate-300 rounded px-2 py-1.5"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            autoFocus
                          />
                          <div className="flex space-x-2">
                            <Button size="sm" variant="danger" className="flex-1 px-0" onClick={() => handleReject(outing.id)}>Confirm</Button>
                            <Button size="sm" variant="outline" className="flex-1 px-0" onClick={() => {setRejectingId(null); setRejectionReason('');}}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Button size="sm" variant="success" className="w-full justify-center" onClick={() => handleApprove(outing.id)}>
                            <CheckCircle className="w-4 h-4 mr-1.5" /> Approve
                          </Button>
                          <Button size="sm" variant="danger" className="w-full justify-center" onClick={() => setRejectingId(outing.id)}>
                            <XCircle className="w-4 h-4 mr-1.5" /> Reject
                          </Button>
                        </>
                      )
                    )}

                    {/* Movement / Register Actions */}
                    {outing.status === 'approved' && outing.application_type === 'out_pass' && (
                      <Button size="sm" className="w-full justify-center bg-orange-500 hover:bg-orange-600 text-white border-0" onClick={() => handleCheckout(outing.id)}>
                        <LogOut className="w-4 h-4 mr-1.5" /> Mark Checked Out
                      </Button>
                    )}
                    
                    {((outing.status === 'checked_out' && outing.application_type === 'out_pass') || 
                      (outing.status === 'approved' && outing.application_type === 'leave')) && (
                      <Button size="sm" className="w-full justify-center bg-emerald-500 hover:bg-emerald-600 text-white border-0" onClick={() => handleReturn(outing.id)}>
                        <CheckSquare className="w-4 h-4 mr-1.5" /> Mark Returned
                      </Button>
                    )}
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
