import React, { useState, useEffect } from 'react';
import { outingService } from '../../api/outingService';
import { PageHeader } from '../../components/shared/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../context/ToastContext';
import { 
  Calendar, 
  Clock, 
  LogOut, 
  Info, 
  MapPin, 
  Phone, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Clock4,
  ArrowRight,
  RotateCcw,
  FileText
} from 'lucide-react';

export default function StudentOutings() {
  const [outings, setOutings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('out_pass'); // 'out_pass' or 'leave'

  // Common fields
  const [reason, setReason] = useState('');
  const [destination, setDestination] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Out Pass explicit fields: date + time
  const [outPassDate, setOutPassDate] = useState('');
  const [outPassTime, setOutPassTime] = useState('14:00');
  const [returnPassDate, setReturnPassDate] = useState('');
  const [returnPassTime, setReturnPassTime] = useState('18:00');

  // Leave explicit fields
  const [leaveFrom, setLeaveFrom] = useState('');
  const [leaveTo, setLeaveTo] = useState('');
  const [leaveType, setLeaveType] = useState('home_leave');

  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchOutings();
  }, []);

  async function fetchOutings() {
    try {
      setLoading(true);
      const res = await outingService.getOutings();
      setOutings(res.data || []);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to load applications', 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      setSubmitting(true);
      
      const payload = {
        application_type: activeTab,
        reason: reason.trim(),
        destination: destination.trim() || undefined,
        contact_info: contactInfo.trim() || undefined
      };

      if (activeTab === 'out_pass') {
        if (!outPassDate || !outPassTime || !returnPassDate || !returnPassTime) {
          throw new Error('Please enter out date/time and expected return date/time.');
        }

        const outIso = new Date(`${outPassDate}T${outPassTime}:00`).toISOString();
        const returnIso = new Date(`${returnPassDate}T${returnPassTime}:00`).toISOString();

        if (new Date(returnIso) <= new Date(outIso)) {
          throw new Error('Expected return time must be after departure time.');
        }

        payload.out_datetime = outIso;
        payload.in_datetime = returnIso;
      } else {
        if (!leaveFrom || !leaveTo) {
          throw new Error('Please select both From and To dates for leave.');
        }

        if (new Date(leaveTo) < new Date(leaveFrom)) {
          throw new Error('Leave To Date cannot be before Leave From Date.');
        }

        payload.leave_from_date = leaveFrom;
        payload.leave_to_date = leaveTo;
        payload.leave_type = leaveType;
      }

      await outingService.createOuting(payload);
      showToast(`${activeTab === 'out_pass' ? 'Out Pass' : 'Leave'} application submitted successfully`, 'success');
      
      // Reset form
      setReason('');
      setDestination('');
      setContactInfo('');
      setOutPassDate('');
      setReturnPassDate('');
      setLeaveFrom('');
      setLeaveTo('');
      
      await fetchOutings();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Submission failed';
      setFormError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this pending application?')) return;
    try {
      await outingService.cancelOuting(id);
      showToast('Application cancelled successfully', 'success');
      await fetchOutings();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to cancel application', 'error');
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
      return (
        <span className="inline-flex items-center bg-red-100 text-red-700 border border-red-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
          <AlertCircle className="w-3 h-3 mr-1" /> Overdue
        </span>
      );
    }
    switch(outing.status) {
      case 'pending':
        return <span className="inline-flex items-center bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">Pending</span>;
      case 'approved':
        return <span className="inline-flex items-center bg-blue-100 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">Approved</span>;
      case 'rejected':
        return <span className="inline-flex items-center bg-red-100 text-red-800 border border-red-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">Rejected</span>;
      case 'cancelled':
        return <span className="inline-flex items-center bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">Cancelled</span>;
      case 'checked_out':
        return <span className="inline-flex items-center bg-orange-100 text-orange-800 border border-orange-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">Checked Out</span>;
      case 'returned':
        return <span className="inline-flex items-center bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">Returned</span>;
      default:
        return null;
    }
  };

  const formatLeaveType = (type) => {
    if (!type) return '';
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-pulse space-y-6">
        <div className="h-24 bg-slate-200 rounded-xl"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="h-96 bg-slate-200 rounded-xl"></div>
          <div className="lg:col-span-2 h-96 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Out Pass & Leave" 
        description="Submit official movement requests and track gate check-out and return status."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Request Form (1 Col) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden sticky top-6">
            
            {/* Tab Selector */}
            <div className="flex border-b border-slate-200 bg-slate-50/60 p-1.5 gap-1.5">
              <button 
                type="button"
                className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'out_pass' 
                    ? 'bg-white text-primary shadow-xs border border-slate-200' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                onClick={() => handleTabSwitch('out_pass')}
              >
                Day Out Pass
              </button>
              <button 
                type="button"
                className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'leave' 
                    ? 'bg-white text-primary shadow-xs border border-slate-200' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                onClick={() => handleTabSwitch('leave')}
              >
                Extended Leave
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <p className="text-xs text-slate-500">
                  {activeTab === 'out_pass' 
                    ? 'For short off-campus visits returned on the same or next day.'
                    : 'For home visits, medical emergencies, or multi-day absences.'}
                </p>
              </div>

              {formError && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Out Pass Specific: Date + Time */}
                {activeTab === 'out_pass' ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700">Departure (Out Date & Time)</label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input 
                          type="date" 
                          value={outPassDate} 
                          onChange={e => setOutPassDate(e.target.value)}
                          min={todayStr}
                          required 
                        />
                        <Input 
                          type="time" 
                          value={outPassTime} 
                          onChange={e => setOutPassTime(e.target.value)}
                          required 
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700">Expected Return Date & Time</label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input 
                          type="date" 
                          value={returnPassDate} 
                          onChange={e => setReturnPassDate(e.target.value)}
                          min={outPassDate || todayStr}
                          required 
                        />
                        <Input 
                          type="time" 
                          value={returnPassTime} 
                          onChange={e => setReturnPassTime(e.target.value)}
                          required 
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  /* Leave Specific: Leave Type, From Date, To Date */
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700">Leave Category</label>
                      <select 
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-slate-800"
                        value={leaveType}
                        onChange={e => setLeaveType(e.target.value)}
                        required
                      >
                        <option value="home_leave">Home Leave</option>
                        <option value="medical_leave">Medical Leave</option>
                        <option value="personal_leave">Personal Leave</option>
                        <option value="academic_leave">Academic Leave</option>
                        <option value="other">Other Reason</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700">From Date</label>
                        <Input 
                          type="date" 
                          value={leaveFrom} 
                          onChange={e => setLeaveFrom(e.target.value)}
                          min={todayStr}
                          required 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700">To Date</label>
                        <Input 
                          type="date" 
                          value={leaveTo} 
                          onChange={e => setLeaveTo(e.target.value)}
                          min={leaveFrom || todayStr}
                          required 
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Common Fields */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Reason for Request <span className="text-red-500">*</span></label>
                  <textarea 
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    rows={2}
                    placeholder="Provide specific reason (minimum 5 characters)..."
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    required 
                    minLength={5}
                  ></textarea>
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Destination</label>
                  <Input 
                    type="text" 
                    placeholder="e.g. City, Home, Hospital"
                    value={destination} 
                    onChange={e => setDestination(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Emergency Contact Number</label>
                  <Input 
                    type="tel" 
                    placeholder="e.g. Contact phone while away"
                    value={contactInfo} 
                    onChange={e => setContactInfo(e.target.value)}
                  />
                </div>

                <div className="pt-2">
                  <Button type="submit" className="w-full text-xs font-semibold py-2.5" disabled={submitting}>
                    {submitting ? 'Submitting Application...' : `Submit ${activeTab === 'out_pass' ? 'Out Pass' : 'Leave'} Application`}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Application History (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Application Record History</h3>
                <p className="text-xs text-slate-500">Official log of past and ongoing outing and leave requests.</p>
              </div>
              <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
                {outings.length} {outings.length === 1 ? 'Record' : 'Records'}
              </span>
            </div>

            {outings.length === 0 ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center">
                <FileText className="w-12 h-12 text-slate-300 mb-3" />
                <h4 className="font-semibold text-slate-800 text-sm">No applications recorded</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  You haven't submitted any out pass or leave requests yet. Use the form to submit one.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {outings.map(outing => (
                  <div key={outing.id} className="p-6 hover:bg-slate-50/50 transition-colors space-y-4">
                    
                    {/* Top Row: Type, ID, Status, Applied Date */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                          outing.application_type === 'leave' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {outing.application_type === 'out_pass' ? 'Day Out Pass' : 'Extended Leave'}
                        </span>

                        {outing.application_type === 'leave' && outing.leave_type && (
                          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            {formatLeaveType(outing.leave_type)}
                          </span>
                        )}

                        <span className="text-xs font-mono text-slate-400">
                          #{outing.id.slice(0, 8)}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3">
                        {getStatusBadge(outing)}
                        {outing.status === 'pending' && (
                          <button 
                            onClick={() => handleCancel(outing.id)} 
                            className="text-xs text-red-600 hover:text-red-800 font-semibold transition-colors underline"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Reason */}
                    <div>
                      <p className="text-sm font-medium text-slate-900 leading-snug">{outing.reason}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Applied: {new Date(outing.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>

                    {/* Schedule Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
                      {outing.application_type === 'out_pass' ? (
                        <>
                          <div>
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-0.5">Expected Departure</span>
                            <span className="font-semibold text-slate-800 flex items-center">
                              <Clock className="w-3.5 h-3.5 mr-1.5 text-primary" />
                              {new Date(outing.out_datetime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-0.5">Expected Return</span>
                            <span className="font-semibold text-slate-800 flex items-center">
                              <Clock className="w-3.5 h-3.5 mr-1.5 text-primary" />
                              {new Date(outing.in_datetime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-0.5">Leave Start Date</span>
                            <span className="font-semibold text-slate-800 flex items-center">
                              <Calendar className="w-3.5 h-3.5 mr-1.5 text-purple-600" />
                              {new Date(outing.leave_from_date).toLocaleDateString([], { dateStyle: 'medium' })}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-0.5">Leave End Date</span>
                            <span className="font-semibold text-slate-800 flex items-center">
                              <Calendar className="w-3.5 h-3.5 mr-1.5 text-purple-600" />
                              {new Date(outing.leave_to_date).toLocaleDateString([], { dateStyle: 'medium' })}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Actual Movement Recording (if available) */}
                    {(outing.actual_out_datetime || outing.actual_in_datetime) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100 text-emerald-900">
                        {outing.actual_out_datetime && (
                          <div className="flex items-center space-x-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span><strong>Actual Gate Exit:</strong> {new Date(outing.actual_out_datetime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                          </div>
                        )}
                        {outing.actual_in_datetime && (
                          <div className="flex items-center space-x-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span><strong>Actual Return:</strong> {new Date(outing.actual_in_datetime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Destination and Contact Info */}
                    {(outing.destination || outing.contact_info) && (
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                        {outing.destination && (
                          <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" /> {outing.destination}</span>
                        )}
                        {outing.contact_info && (
                          <span className="flex items-center"><Phone className="w-3.5 h-3.5 mr-1 text-slate-400" /> {outing.contact_info}</span>
                        )}
                      </div>
                    )}

                    {/* Rejection notice */}
                    {outing.status === 'rejected' && outing.rejection_reason && (
                      <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block font-semibold">Rejection Reason:</strong>
                          <span>{outing.rejection_reason}</span>
                        </div>
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
