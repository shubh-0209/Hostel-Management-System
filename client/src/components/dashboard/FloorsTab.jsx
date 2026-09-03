import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { floorApi } from '../../api/floorApi';
import { roomApi } from '../../api/roomApi';
import { bedApi } from '../../api/bedApi';
import { useToast } from '../../context/ToastContext';
import { Trash2, Edit2, Plus, AlertTriangle } from 'lucide-react';
import { EmptyState } from '../shared/EmptyState';

export function FloorsTab({ hostelId }) {
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Modals state
  const [floorModal, setFloorModal] = useState({ open: false, data: null });
  const [roomModal, setRoomModal] = useState({ open: false, data: null, floorId: null });
  const [bedModal, setBedModal] = useState({ open: false, data: null, roomId: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, type: '', id: '', name: '' });

  // Form State
  const [floorForm, setFloorForm] = useState({ floor_number: '' });
  const [roomForm, setRoomForm] = useState({ room_number: '', type: 'Non-AC', capacity: '1' });
  const [bedForm, setBedForm] = useState({ bed_number: '' });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadAllData();
  }, [hostelId]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const floorsRes = await floorApi.getByHostelId(hostelId);
      const allFloors = floorsRes.data || [];
      
      let allRooms = [];
      let allBeds = [];

      for (const floor of allFloors) {
        const rRes = await roomApi.getByFloorId(floor.id);
        const floorRooms = rRes.data || [];
        allRooms = [...allRooms, ...floorRooms];

        for (const room of floorRooms) {
          const bRes = await bedApi.getByRoomId(room.id);
          allBeds = [...allBeds, ...(bRes.data || [])];
        }
      }

      setFloors(allFloors);
      setRooms(allRooms);
      setBeds(allBeds);
    } catch (err) {
      showToast('Failed to load infrastructure data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- FLOORS ---
  const handleFloorSubmit = async (e) => {
    e.preventDefault();
    try {
      setFormLoading(true);
      if (floorModal.data) {
        await floorApi.update(floorModal.data.id, { ...floorForm, floor_number: Number(floorForm.floor_number) });
        showToast('Floor updated');
      } else {
        await floorApi.create({ hostel_id: hostelId, floor_number: Number(floorForm.floor_number) });
        showToast('Floor created');
      }
      setFloorModal({ open: false, data: null });
      loadAllData();
    } catch (err) {
      showToast(err.message || 'Error saving floor', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // --- ROOMS ---
  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    try {
      setFormLoading(true);
      const payload = { ...roomForm, capacity: Number(roomForm.capacity) };
      if (roomModal.data) {
        await roomApi.update(roomModal.data.id, payload);
        showToast('Room updated');
      } else {
        await roomApi.create({ ...payload, floor_id: roomModal.floorId, hostel_id: hostelId });
        showToast('Room created');
      }
      setRoomModal({ open: false, data: null, floorId: null });
      loadAllData();
    } catch (err) {
      showToast(err.message || 'Error saving room', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // --- BEDS ---
  const handleBedSubmit = async (e) => {
    e.preventDefault();
    try {
      setFormLoading(true);
      if (bedModal.data) {
        await bedApi.update(bedModal.data.id, { bed_number: Number(bedForm.bed_number) });
        showToast('Bed updated');
      } else {
        await bedApi.create({ room_id: bedModal.roomId, bed_number: Number(bedForm.bed_number) });
        showToast('Bed added');
      }
      setBedModal({ open: false, data: null, roomId: null });
      loadAllData();
    } catch (err) {
      showToast(err.message || 'Error saving bed', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const toggleBedStatus = async (bed) => {
    if (bed.status === 'Allocated') {
      return showToast('Cannot change status of allocated bed', 'info');
    }
    const newStatus = bed.status === 'Available' ? 'Maintenance' : 'Available';
    try {
      await bedApi.update(bed.id, { status: newStatus });
      showToast(`Bed marked as ${newStatus}`);
      loadAllData();
    } catch (err) {
      showToast('Failed to update bed status', 'error');
    }
  };

  // --- DELETE ---
  const confirmDelete = (type, id, name) => {
    setDeleteModal({ open: true, type, id, name });
  };

  const handleDelete = async () => {
    try {
      setFormLoading(true);
      const { type, id } = deleteModal;
      if (type === 'floor') await floorApi.delete(id);
      if (type === 'room') await roomApi.delete(id);
      if (type === 'bed') await bedApi.delete(id);
      showToast(`${type} deleted successfully`);
      setDeleteModal({ open: false, type: '', id: '', name: '' });
      loadAllData();
    } catch (err) {
      showToast('Delete failed', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) return <div className="p-8 animate-pulse bg-slate-100 h-64 rounded-xl"></div>;

  return (
    <div className="space-y-6">
      {floors.length === 0 ? (
        <EmptyState 
          title="No Floors Configured"
          description="Start by adding floors to this hostel."
          action={<Button onClick={() => { setFloorForm({ floor_number: '' }); setFloorModal({ open: true, data: null }); }}><Plus className="w-4 h-4 mr-2" />Add Floor</Button>}
        />
      ) : (
        <div className="space-y-8">
          <div className="flex justify-end">
            <Button onClick={() => { setFloorForm({ floor_number: '' }); setFloorModal({ open: true, data: null }); }}>
              <Plus className="w-4 h-4 mr-2" /> Add Floor
            </Button>
          </div>

          {floors.map(floor => {
            const floorRooms = rooms.filter(r => r.floor_id === floor.id);
            return (
              <div key={floor.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 p-4 px-6 flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <h3 className="font-semibold text-slate-900 text-lg">Floor {floor.floor_number}</h3>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-500 hover:text-primary" onClick={() => { setFloorForm({ floor_number: floor.floor_number }); setFloorModal({ open: true, data: floor }); }}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-500 hover:text-destructive" onClick={() => confirmDelete('floor', floor.id, `Floor ${floor.floor_number}`)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => { setRoomForm({ room_number: '', type: 'Non-AC', capacity: '1' }); setRoomModal({ open: true, data: null, floorId: floor.id }); }}>
                    Add Room
                  </Button>
                </div>

                <div className="p-6">
                  {floorRooms.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-sm">No rooms on this floor yet.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {floorRooms.map(room => {
                        const roomBeds = beds.filter(b => b.room_id === room.id);
                        return (
                          <div key={room.id} className="border border-slate-200 rounded-lg p-4 hover:border-primary/30 transition-colors bg-white">
                            <div className="flex justify-between items-center mb-3">
                              <div>
                                <span className="font-semibold text-slate-900 block">Room {room.room_number}</span>
                                <span className="text-xs text-slate-500">{room.type} • Cap: {room.capacity}</span>
                              </div>
                              <div className="flex space-x-1">
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-primary" onClick={() => { setRoomForm({ room_number: room.room_number, type: room.type, capacity: room.capacity }); setRoomModal({ open: true, data: room, floorId: floor.id }); }}>
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-destructive" onClick={() => confirmDelete('room', room.id, `Room ${room.room_number}`)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-4">
                              {roomBeds.map(bed => (
                                <div 
                                  key={bed.id} 
                                  onClick={() => toggleBedStatus(bed)}
                                  className={`relative h-14 rounded-md border flex flex-col items-center justify-center cursor-pointer transition-colors ${
                                    bed.status === 'Allocated' ? 'bg-slate-100 border-slate-200' :
                                    bed.status === 'Available' ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100' :
                                    'bg-amber-50 border-amber-200 hover:bg-amber-100'
                                  }`}
                                >
                                  <span className="text-[10px] font-bold text-slate-400 absolute top-1 left-1.5">B{bed.bed_number}</span>
                                  <span className={`text-[10px] font-medium mt-3 ${
                                    bed.status === 'Allocated' ? 'text-slate-500' :
                                    bed.status === 'Available' ? 'text-emerald-700' :
                                    'text-amber-700'
                                  }`}>
                                    {bed.status}
                                  </span>
                                  <Button variant="ghost" size="sm" className="absolute top-0 right-0 h-5 w-5 p-0 text-slate-300 hover:text-destructive opacity-0 hover:opacity-100 transition-opacity group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); confirmDelete('bed', bed.id, `Bed ${bed.bed_number}`); }}>
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              ))}
                              {roomBeds.length < room.capacity && (
                                <div onClick={() => { setBedForm({ bed_number: '' }); setBedModal({ open: true, data: null, roomId: room.id }); }} className="h-14 rounded-md border border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-primary/50 text-slate-400 transition-colors">
                                  <Plus className="w-4 h-4 mb-1" />
                                  <span className="text-[10px] font-medium">Add Bed</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floor Form */}
      <Dialog open={floorModal.open} onOpenChange={(o) => setFloorModal({ ...floorModal, open: o })}>
        <form onSubmit={handleFloorSubmit} className="space-y-4">
          <h2 className="text-lg font-semibold">{floorModal.data ? 'Edit Floor' : 'Add Floor'}</h2>
          <div>
            <label className="text-sm font-medium text-slate-700">Floor Number *</label>
            <Input type="number" value={floorForm.floor_number} onChange={e => setFloorForm({ ...floorForm, floor_number: e.target.value })} required min="0" />
          </div>
          <div className="pt-4 flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => setFloorModal({ open: false, data: null })}>Cancel</Button>
            <Button type="submit" disabled={formLoading}>Save</Button>
          </div>
        </form>
      </Dialog>

      {/* Room Form */}
      <Dialog open={roomModal.open} onOpenChange={(o) => setRoomModal({ ...roomModal, open: o })}>
        <form onSubmit={handleRoomSubmit} className="space-y-4">
          <h2 className="text-lg font-semibold">{roomModal.data ? 'Edit Room' : 'Add Room'}</h2>
          <div>
            <label className="text-sm font-medium text-slate-700">Room Number *</label>
            <Input value={roomForm.room_number} onChange={e => setRoomForm({ ...roomForm, room_number: e.target.value })} required />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Type</label>
            <Select value={roomForm.type} onChange={e => setRoomForm({ ...roomForm, type: e.target.value })}>
              <option value="Non-AC">Non-AC</option>
              <option value="AC">AC</option>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Capacity *</label>
            <Input type="number" value={roomForm.capacity} onChange={e => setRoomForm({ ...roomForm, capacity: e.target.value })} required min="1" max="10" />
          </div>
          <div className="pt-4 flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => setRoomModal({ open: false, data: null, floorId: null })}>Cancel</Button>
            <Button type="submit" disabled={formLoading}>Save</Button>
          </div>
        </form>
      </Dialog>

      {/* Bed Form */}
      <Dialog open={bedModal.open} onOpenChange={(o) => setBedModal({ ...bedModal, open: o })}>
        <form onSubmit={handleBedSubmit} className="space-y-4">
          <h2 className="text-lg font-semibold">{bedModal.data ? 'Edit Bed' : 'Add Bed'}</h2>
          <div>
            <label className="text-sm font-medium text-slate-700">Bed Number *</label>
            <Input type="number" value={bedForm.bed_number} onChange={e => setBedForm({ ...bedForm, bed_number: e.target.value })} required min="1" />
          </div>
          <div className="pt-4 flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => setBedModal({ open: false, data: null, roomId: null })}>Cancel</Button>
            <Button type="submit" disabled={formLoading}>Save</Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteModal.open} onOpenChange={(o) => setDeleteModal({ ...deleteModal, open: o })}>
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-destructive">
            <div className="bg-red-100 p-2 rounded-full">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold">Delete {deleteModal.type}?</h2>
          </div>
          <p className="text-sm text-slate-600">
            Are you sure you want to delete <span className="font-semibold text-slate-900">{deleteModal.name}</span>? 
            {deleteModal.type === 'floor' && ' This will also delete all rooms and beds on this floor.'}
            {deleteModal.type === 'room' && ' This will also delete all beds in this room.'}
            This action cannot be undone.
          </p>
          <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100">
            <Button variant="outline" onClick={() => setDeleteModal({ open: false, type: '', id: '', name: '' })} disabled={formLoading}>Cancel</Button>
            <Button className="bg-destructive hover:bg-destructive-600 text-white" onClick={handleDelete} disabled={formLoading}>
              Delete
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
