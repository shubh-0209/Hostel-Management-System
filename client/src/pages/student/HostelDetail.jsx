import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { studentService } from '../../api/studentService';
import { floorApi } from '../../api/floorApi';
import { roomApi } from '../../api/roomApi';
import { Button } from '../../components/ui/Button';
import { ChevronRight, ArrowLeft, ArrowRight, LayoutGrid, Users } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';

export default function StudentHostelDetail() {
  const { hostelId } = useParams();
  const navigate = useNavigate();
  
  const [hostel, setHostel] = useState(null);
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Get hostel details from student eligible list
        const allHostelsRes = await studentService.getHostels();
        const currentHostel = allHostelsRes.data.find(h => h.id === hostelId);
        if (!currentHostel) throw new Error("Hostel not found or not eligible");
        
        setHostel(currentHostel);

        // Fetch floors and rooms
        const floorsRes = await floorApi.getByHostelId(hostelId);
        const floorsData = floorsRes.data || [];
        setFloors(floorsData);

        let allRooms = [];
        for (const floor of floorsData) {
          const rRes = await roomApi.getByFloorId(floor.id);
          allRooms = [...allRooms, ...(rRes.data || [])];
        }
        setRooms(allRooms);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [hostelId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-pulse">
        <div className="h-20 bg-slate-200 rounded-xl w-full"></div>
        <div className="h-48 bg-slate-200 rounded-xl w-full mt-8"></div>
      </div>
    );
  }

  if (!hostel) {
    return (
      <div className="max-w-7xl mx-auto p-12 text-center">
        <h2 className="text-2xl font-bold text-slate-900">Hostel Not Found</h2>
        <Button onClick={() => navigate('/student/hostels')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Hostels
        </Button>
      </div>
    );
  }

  const occupied = hostel.occupied_beds || 0;
  const total = hostel.bed_count || 0;
  const available = total - occupied;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
      
      <nav className="flex items-center space-x-2 text-sm text-slate-500 font-medium mb-[-1rem]">
        <Link to="/student/hostels" className="hover:text-primary transition-colors">Browse Hostels</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-900">{hostel.name}</span>
      </nav>

      <PageHeader 
        title={hostel.name}
        description={`${hostel.type || 'Hostel'} • Code: ${hostel.code} • Allowed Years: ${hostel.academic_years?.join(', ')}`}
        action={
          <Button variant="outline" onClick={() => navigate('/student/hostels')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        }
      />

      {/* Hostel Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Hostel Details</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-1">
            <span className="text-sm text-slate-500 block">Total Capacity</span>
            <span className="text-xl font-bold text-slate-900">{total} Beds</span>
          </div>
          <div className="space-y-1">
            <span className="text-sm text-slate-500 block">Available Beds</span>
            <span className="text-xl font-bold text-emerald-600">{available} Beds</span>
          </div>
          <div className="space-y-1">
            <span className="text-sm text-slate-500 block">Total Floors</span>
            <span className="text-xl font-bold text-slate-900">{hostel.floor_count || 0}</span>
          </div>
          <div className="space-y-1">
            <span className="text-sm text-slate-500 block">Total Rooms</span>
            <span className="text-xl font-bold text-slate-900">{hostel.room_count || 0}</span>
          </div>
        </div>
      </div>

      {/* Available Floors and Rooms */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-slate-900">Select a Room</h3>
        
        {floors.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center text-slate-500">
            No floors are currently available in this hostel.
          </div>
        ) : (
          <div className="space-y-8">
            {floors.map(floor => {
              const floorRooms = rooms.filter(r => r.floor_id === floor.id);
              if (floorRooms.length === 0) return null; // Don't show empty floors
              
              return (
                <div key={floor.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                    <h4 className="font-semibold text-slate-900">Floor {floor.floor_number}</h4>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {floorRooms.map(room => (
                        <div key={room.id} className="border border-slate-200 rounded-lg p-5 hover:border-primary/50 transition-colors bg-white group flex flex-col justify-between h-full">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <span className="font-bold text-slate-900 block text-lg">Room {room.room_number}</span>
                              <span className="text-sm text-slate-500">{room.type || 'Standard'}</span>
                            </div>
                            <div className="bg-primary/10 p-2 rounded-lg text-primary">
                              <LayoutGrid className="w-5 h-5" />
                            </div>
                          </div>
                          
                          <div className="flex items-center text-slate-600 text-sm font-medium mb-5">
                            <Users className="w-4 h-4 mr-2" />
                            <span>Capacity: {room.capacity} Beds</span>
                          </div>
                          
                          <Button 
                            className="w-full justify-between" 
                            variant="outline"
                            onClick={() => navigate(`/student/rooms/${room.id}`, { state: { room, floor, hostel } })}
                          >
                            View Beds
                            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
