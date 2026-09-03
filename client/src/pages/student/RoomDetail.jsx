import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { bedApi } from '../../api/bedApi';
import { allocationService } from '../../api/allocationService';
import { Button } from '../../components/ui/Button';
import { ChevronRight, ArrowLeft, Bed, Info, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { useToast } from '../../context/ToastContext';

export default function StudentRoomDetail() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  
  // Try to get context from router state, fallback to basic UI if refreshed
  const { room, floor, hostel } = location.state || {};
  
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBed, setSelectedBed] = useState(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    async function loadBeds() {
      try {
        setLoading(true);
        const res = await bedApi.getByRoomId(roomId);
        // Sort beds by bed_number
        const sortedBeds = (res.data || []).sort((a, b) => a.bed_number - b.bed_number);
        setBeds(sortedBeds);
      } catch (err) {
        showToast("Failed to load beds", "error");
      } finally {
        setLoading(false);
      }
    }
    loadBeds();
  }, [roomId]);

  const handleBedSelect = (bed) => {
    if (bed.status !== 'Available') return;
    setSelectedBed(bed.id === selectedBed?.id ? null : bed);
  };

  const handleConfirm = async () => {
    try {
      setConfirming(true);
      await allocationService.allocateBed(selectedBed.id);
      showToast('Bed allocated successfully!');
      navigate('/student/allocation');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-pulse">
        <div className="h-20 bg-slate-200 rounded-xl w-full"></div>
        <div className="h-64 bg-slate-200 rounded-xl w-full mt-8"></div>
      </div>
    );
  }

  // Calculate stats
  const capacity = room?.capacity || beds.length || 0;
  const occupiedCount = beds.filter(b => b.status === 'Allocated').length;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-500 pb-32">
      
      <nav className="flex items-center space-x-2 text-sm text-slate-500 font-medium mb-[-1rem]">
        {hostel && <Link to="/student/hostels" className="hover:text-primary transition-colors">Hostels</Link>}
        {hostel && <ChevronRight className="w-4 h-4" />}
        {hostel && <Link to={`/student/hostels/${hostel.id}`} className="hover:text-primary transition-colors">{hostel.name}</Link>}
        {hostel && <ChevronRight className="w-4 h-4" />}
        <span className="text-slate-900">Room {room?.room_number || 'Details'}</span>
      </nav>

      <PageHeader 
        title={`Room ${room?.room_number || ''}`}
        description={`${hostel?.name ? hostel.name + ' • ' : ''}${floor?.floor_number ? 'Floor ' + floor.floor_number + ' • ' : ''}${room?.type || 'Standard'} Room`}
        action={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Room Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Room Information</h3>
            <ul className="space-y-4">
              <li className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-500 text-sm">Room Type</span>
                <span className="font-semibold text-slate-900">{room?.type || 'N/A'}</span>
              </li>
              <li className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-500 text-sm">Capacity</span>
                <span className="font-semibold text-slate-900">{capacity} Beds</span>
              </li>
              <li className="flex justify-between pb-1">
                <span className="text-slate-500 text-sm">Current Occupancy</span>
                <span className="font-semibold text-slate-900">{occupiedCount} / {capacity}</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 text-sm text-slate-600">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <p>Select an available bed to proceed with the allocation process. Beds marked as Allocated or Maintenance cannot be selected.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Bed Map */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Select a Bed</h3>
            
            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-8 text-sm">
              <div className="flex items-center"><div className="w-4 h-4 rounded bg-emerald-50 border border-emerald-200 mr-2"></div> Available</div>
              <div className="flex items-center"><div className="w-4 h-4 rounded bg-primary border-2 border-primary mr-2"></div> Selected</div>
              <div className="flex items-center"><div className="w-4 h-4 rounded bg-slate-100 border border-slate-200 mr-2"></div> Allocated</div>
              <div className="flex items-center"><div className="w-4 h-4 rounded bg-amber-50 border border-amber-200 mr-2"></div> Maintenance</div>
            </div>

            {/* Bed Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {beds.map(bed => {
                const isAvailable = bed.status === 'Available';
                const isSelected = selectedBed?.id === bed.id;
                
                // Determine styling based on state
                let cardStyle = "bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed"; // Default disabled
                let statusColor = "text-slate-500";
                
                if (bed.status === 'Allocated') {
                  cardStyle = "bg-slate-100 border-slate-200 cursor-not-allowed";
                  statusColor = "text-slate-500";
                } else if (bed.status === 'Maintenance') {
                  cardStyle = "bg-amber-50 border-amber-200 cursor-not-allowed";
                  statusColor = "text-amber-700";
                } else if (isAvailable && isSelected) {
                  cardStyle = "bg-primary border-primary shadow-md ring-2 ring-primary/20 cursor-pointer transform scale-105 transition-all";
                  statusColor = "text-white";
                } else if (isAvailable) {
                  cardStyle = "bg-emerald-50 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 cursor-pointer transition-colors";
                  statusColor = "text-emerald-700";
                }

                return (
                  <button 
                    key={bed.id}
                    disabled={!isAvailable}
                    onClick={() => handleBedSelect(bed)}
                    className={`relative p-6 rounded-xl border flex flex-col items-center justify-center space-y-3 ${cardStyle}`}
                    aria-label={`Bed ${bed.bed_number}, Status: ${bed.status}`}
                  >
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 bg-white rounded-full">
                        <CheckCircle2 className="w-5 h-5 text-primary fill-white" />
                      </div>
                    )}
                    <Bed className={`w-10 h-10 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                    <div className="text-center">
                      <div className={`font-bold text-lg ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                        Bed {bed.bed_number}
                      </div>
                      <div className={`text-xs font-medium uppercase tracking-wider ${statusColor}`}>
                        {bed.status}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            
            {beds.length === 0 && (
              <div className="text-center text-slate-500 py-8">
                No beds have been configured for this room yet.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Sticky Confirmation Panel */}
      {selectedBed && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)] p-4 sm:p-6 z-50 animate-in slide-in-from-bottom duration-300">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="bg-primary/10 p-3 rounded-full text-primary hidden sm:block">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Selected Bed</h4>
                <p className="text-lg font-bold text-slate-900">
                  {hostel?.name ? `${hostel.name} • ` : ''} 
                  {floor?.floor_number ? `Floor ${floor.floor_number} • ` : ''} 
                  Room {room?.room_number || ''} • 
                  <span className="text-primary ml-1">Bed {selectedBed.bed_number}</span>
                </p>
              </div>
            </div>
            <div className="flex space-x-3 w-full sm:w-auto">
              <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setSelectedBed(null)}>Cancel</Button>
              <Button className="flex-1 sm:flex-none" onClick={handleConfirm} disabled={confirming}>
                {confirming ? 'Confirming...' : 'Confirm Selection'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
