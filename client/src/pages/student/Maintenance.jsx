import React, { useState, useEffect } from 'react';
import { maintenanceService } from '../../api/maintenanceService';
import { allocationService } from '../../api/allocationService';
import { PageHeader } from '../../components/shared/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../context/ToastContext';
import { 
  Wrench, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Building2, 
  Bed, 
  Plus, 
  RotateCcw,
  Calendar,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ISSUE_TYPES = [
  'Electrical Issue',
  'Plumbing & Water',
  'Furniture & Carpentry',
  'Cleanliness & Sanitation',
  'Air Conditioning / Fan',
  'Wi-Fi / Internet',
  'Civil / Wall / Door',
  'Other Maintenance'
];

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'high', label: 'High', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800 border-red-200' }
];

export default function StudentMaintenance() {
  const [requests, setRequests] = useState([]);
  const [allocation, setAllocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [issueType, setIssueType] = useState(ISSUE_TYPES[0]);
  const [priority, setPriority] = useState('medium');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [allocRes, maintRes] = await Promise.all([
        allocationService.getMyAllocation().catch(e => ({ data: null })),
        maintenanceService.getMaintenanceRequests().catch(e => {
          throw e;
        })
      ]);
      setAllocation(allocRes.data);
      setRequests(maintRes.data || []);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to load maintenance data';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!allocation) {
      setFormError('An active bed allocation is required to submit a maintenance complaint.');
      return;
    }

    if (!description.trim() || description.trim().length < 5) {
      setFormError('Please describe the issue in at least 5 characters.');
      return;
    }

    try {
      setSubmitting(true);
      await maintenanceService.createMaintenanceRequest({
        issue_type: issueType,
        priority,
        description: description.trim()
      });
      showToast('Maintenance complaint submitted successfully', 'success');
      setDescription('');
      setPriority('medium');
      setIssueType(ISSUE_TYPES[0]);
      
      // Refresh complaints list
      const res = await maintenanceService.getMaintenanceRequests();
      setRequests(res.data || []);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to submit complaint';
      setFormError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this complaint?')) return;
    try {
      await maintenanceService.cancelMaintenanceRequest(id);
      showToast('Complaint cancelled successfully', 'success');
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r));
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to cancel complaint', 'error');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
            <Clock className="w-3 h-3 mr-1" /> Pending
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center bg-blue-100 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
            <Wrench className="w-3 h-3 mr-1" /> In Progress
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Resolved
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
            <XCircle className="w-3 h-3 mr-1" /> Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const getPriorityBadge = (p) => {
    const item = PRIORITIES.find(x => x.value === p) || PRIORITIES[1];
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border ${item.color}`}>
        {item.label} Priority
      </span>
    );
  };

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
        title="Hostel Maintenance & Complaints" 
        description="Report room repairs, plumbing, electrical, and facility issues directly to the hostel administration."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Submit Complaint Card (1 Col) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden sticky top-6">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center space-x-3">
              <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Report an Issue</h3>
                <p className="text-xs text-slate-500">Submit a repair or maintenance request.</p>
              </div>
            </div>

            <div className="p-6">
              {allocation ? (
                /* Allocated Room Header Notice */
                <div className="mb-5 p-3.5 bg-blue-50/70 border border-blue-200 rounded-lg text-xs space-y-1">
                  <span className="font-bold text-blue-900 block">Current Room Assignment:</span>
                  <div className="text-blue-800 flex flex-wrap items-center gap-1.5 font-medium">
                    <span>{allocation.hostel?.name}</span>
                    <span>•</span>
                    <span>Floor {allocation.floor?.floor_number ?? 'N/A'}</span>
                    <span>•</span>
                    <span>Room {allocation.room?.room_number}</span>
                    <span>•</span>
                    <span>Bed {allocation.bed?.bed_number}</span>
                  </div>
                  <p className="text-[11px] text-blue-600 mt-1">Maintenance requests are automatically linked to your room.</p>
                </div>
              ) : (
                /* No Allocation Notice */
                <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-2">
                  <div className="flex items-center space-x-2 text-amber-900 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>No Active Bed Allocation</span>
                  </div>
                  <p className="text-amber-800 leading-relaxed">
                    Complaints must be tied to an active room. Once you book a bed in an eligible hostel, you can submit room maintenance issues here.
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full text-xs mt-2 border-amber-300 text-amber-900 hover:bg-amber-100"
                    onClick={() => navigate('/student/hostels')}
                  >
                    Browse Available Hostels <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>
              )}

              {formError && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Issue Type */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Issue Category <span className="text-red-500">*</span></label>
                  <select 
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-slate-800"
                    value={issueType}
                    onChange={e => setIssueType(e.target.value)}
                    disabled={!allocation || submitting}
                    required
                  >
                    {ISSUE_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Priority Level</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {PRIORITIES.map(p => (
                      <button
                        key={p.value}
                        type="button"
                        disabled={!allocation || submitting}
                        onClick={() => setPriority(p.value)}
                        className={`py-1.5 px-2 rounded text-xs font-semibold border transition-all text-center ${
                          priority === p.value 
                            ? 'bg-primary text-white border-primary shadow-xs' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Description & Details <span className="text-red-500">*</span></label>
                  <textarea 
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    rows={3}
                    placeholder="Describe the issue, location in room, or urgency (min 5 characters)..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    disabled={!allocation || submitting}
                    required 
                    minLength={5}
                  ></textarea>
                </div>

                <div className="pt-2">
                  <Button 
                    type="submit" 
                    className="w-full text-xs font-semibold py-2.5" 
                    disabled={!allocation || submitting}
                  >
                    {submitting ? 'Submitting Complaint...' : 'Submit Complaint'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Complaints History (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">My Maintenance Complaints</h3>
                <p className="text-xs text-slate-500">Track resolution progress and historical repair records.</p>
              </div>
              <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
                {requests.length} {requests.length === 1 ? 'Complaint' : 'Complaints'}
              </span>
            </div>

            {requests.length === 0 ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3 text-slate-300">
                  <Wrench className="w-8 h-8" />
                </div>
                <h4 className="font-semibold text-slate-800 text-sm">No complaints submitted</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  You haven't reported any room maintenance issues yet. If something in your room requires repair, submit a complaint above.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {requests.map(req => (
                  <div key={req.id} className="p-6 hover:bg-slate-50/50 transition-colors space-y-3">
                    
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {req.issue_type}
                        </span>
                        {getPriorityBadge(req.priority)}
                        <span className="text-xs font-mono text-slate-400">
                          #{req.id.slice(0, 8)}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3">
                        {getStatusBadge(req.status)}
                        {req.status === 'pending' && (
                          <button 
                            onClick={() => handleCancel(req.id)}
                            className="text-xs text-red-600 hover:text-red-800 font-semibold transition-colors underline"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Room reference */}
                    <div className="text-xs text-slate-500 flex items-center space-x-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{req.hostel?.name || 'Hostel'} • Room {req.room?.room_number || 'Room'}</span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                      {req.description}
                    </p>

                    {/* Timestamps */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        Reported: {new Date(req.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                      {req.resolved_at && (
                        <span className="text-emerald-700 font-semibold flex items-center">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Resolved: {new Date(req.resolved_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      )}
                    </div>

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
