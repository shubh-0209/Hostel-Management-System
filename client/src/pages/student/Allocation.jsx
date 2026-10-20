import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { allocationService } from '../../api/allocationService';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import { 
  Bed, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  LogOut, 
  Building2, 
  ShieldAlert, 
  Calendar,
  X
} from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';

export default function StudentAllocation() {
  const [allocation, setAllocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showVacateModal, setShowVacateModal] = useState(false);
  const [vacating, setVacating] = useState(false);

  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    fetchAllocation();
  }, []);

  async function fetchAllocation() {
    try {
      setLoading(true);
      setError(null);
      const res = await allocationService.getMyAllocation();
      setAllocation(res.data);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to fetch allocation';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleVacateConfirm = async () => {
    try {
      setVacating(true);
      await allocationService.vacateBed();
      showToast('Bed vacated successfully. Your allocation has been released.', 'success');
      setShowVacateModal(false);
      setAllocation(null);
      await fetchAllocation();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to vacate bed';
      showToast(msg, 'error');
    } finally {
      setVacating(false);
    }
  };

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
        description="View details of your active hostel room and bed assignment."
      />

      {error && !allocation && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="outline" onClick={fetchAllocation}>Retry</Button>
        </div>
      )}

      {allocation ? (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header with primary status */}
            <div className="p-6 sm:p-8 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="bg-primary/10 p-4 rounded-2xl text-primary border border-primary/20">
                  <Bed className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{allocation.hostel?.name}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-slate-600 font-medium">
                    <span className="bg-white px-2.5 py-1 rounded border border-slate-200 shadow-xs">
                      Floor {allocation.floor?.floor_number ?? 'N/A'}
                    </span>
                    <span className="bg-white px-2.5 py-1 rounded border border-slate-200 shadow-xs">
                      Room {allocation.room?.room_number}
                    </span>
                    <span className="bg-primary text-white px-2.5 py-1 rounded shadow-xs font-semibold">
                      Bed {allocation.bed?.bed_number}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                <span className="inline-flex items-center space-x-1.5 bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Active Allocation</span>
                </span>
                <span className="text-xs text-slate-500 flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  Allocated: {allocation.created_at ? new Date(allocation.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Accommodation Specs</h4>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex justify-between border-b border-slate-100 pb-2">
                    <span>Hostel Code</span>
                    <span className="font-semibold text-slate-900">{allocation.hostel?.code || 'N/A'}</span>
                  </li>
                  <li className="flex justify-between border-b border-slate-100 pb-2">
                    <span>Room Type</span>
                    <span className="font-semibold text-slate-900">{allocation.room?.type || 'Standard'}</span>
                  </li>
                  <li className="flex justify-between border-b border-slate-100 pb-2">
                    <span>Room Total Capacity</span>
                    <span className="font-semibold text-slate-900">{allocation.room?.capacity || 0} Beds</span>
                  </li>
                  <li className="flex justify-between border-b border-slate-100 pb-2">
                    <span>Assigned Bed</span>
                    <span className="font-bold text-primary">Bed {allocation.bed?.bed_number}</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Hostel Guidelines</h4>
                <ul className="space-y-3 text-sm text-slate-600 list-disc pl-4 marker:text-primary">
                  <li>Quiet hours are observed between 10:00 PM and 6:00 AM.</li>
                  <li>All movements out of campus must be requested via Out Pass or Leave.</li>
                  <li>Vacating your bed will release it immediately back into the available pool.</li>
                  <li>Maintain room cleanliness and report any damages promptly.</li>
                </ul>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="p-6 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                Need to relocate or leave the hostel? You can vacate your current bed below.
              </div>
              <Button 
                variant="outline" 
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 w-full sm:w-auto"
                onClick={() => setShowVacateModal(true)}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Vacate Bed
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-300">
            <Bed className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No active bed allocation.</h3>
          <p className="text-slate-500 mb-8 max-w-md mx-auto text-sm">
            You currently do not hold an active bed allocation in any campus hostel.
            Browse the available hostels eligible for your academic year to book your accommodation.
          </p>
          <Button size="lg" onClick={() => navigate('/student/hostels')}>
            Browse Available Hostels <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      )}

      {/* Confirmation Modal for Vacating Bed */}
      {showVacateModal && allocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-6 border-b border-slate-100 flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-amber-100 p-2.5 rounded-full text-amber-700">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Confirm Bed Deallocation</h3>
                  <p className="text-xs text-slate-500">Please review before releasing your bed.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowVacateModal(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 text-xs">Hostel:</span>
                  <span className="font-semibold text-slate-900">{allocation.hostel?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 text-xs">Room & Bed:</span>
                  <span className="font-semibold text-slate-900">Room {allocation.room?.room_number} • Bed {allocation.bed?.bed_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 text-xs">Allocated Since:</span>
                  <span className="text-slate-700">{allocation.created_at ? new Date(allocation.created_at).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>

              <div className="text-slate-600 space-y-2 text-xs leading-relaxed">
                <p className="font-medium text-slate-800">What happens when you vacate:</p>
                <ul className="list-disc pl-5 space-y-1 text-slate-500">
                  <li>Your active accommodation will be marked as <strong>completed</strong>.</li>
                  <li><strong>Bed {allocation.bed?.bed_number}</strong> will immediately become available for other students to book.</li>
                  <li>Your historical allocation record will remain permanently preserved for administrative audit.</li>
                  <li>You will be eligible to browse and apply for new available hostel beds.</li>
                </ul>
              </div>
            </div>

            <div className="p-6 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowVacateModal(false)}
                disabled={vacating}
              >
                Cancel
              </Button>
              <Button 
                className="bg-red-600 hover:bg-red-700 text-white" 
                onClick={handleVacateConfirm}
                disabled={vacating}
              >
                {vacating ? 'Releasing Bed...' : 'Yes, Vacate Bed'}
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
