import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hostelApi } from '../api/hostelApi';
import { Button } from '../components/ui/Button';
import { Plus, Building, Users, BedDouble, Search, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { PageHeader } from '../components/shared/PageHeader';
import { StatCard } from '../components/shared/StatCard';
import { StatusBadge } from '../components/shared/StatusBadge';
import { EmptyState } from '../components/shared/EmptyState';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/Table';
import { Dialog } from '../components/ui/Dialog';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useToast } from '../context/ToastContext';

export default function Hostels() {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedHostel, setSelectedHostel] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({ name: '', code: '', type: 'Boys', years: '' });
  const [formLoading, setFormLoading] = useState(false);

  const navigate = useNavigate();
  const { showToast } = useToast();

  const fetchHostels = async () => {
    try {
      setLoading(true);
      const res = await hostelApi.getAll();
      setHostels(res.data);
    } catch (err) {
      showToast(err.message || "Failed to load hostels", 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHostels();
  }, []);

  const openAddForm = () => {
    setSelectedHostel(null);
    setFormData({ name: '', code: '', type: 'Boys', years: '' });
    setIsFormOpen(true);
  };

  const openEditForm = (e, hostel) => {
    e.stopPropagation();
    setSelectedHostel(hostel);
    setFormData({ 
      name: hostel.name, 
      code: hostel.code, 
      type: hostel.type || 'Boys', 
      years: hostel.academic_years?.join(', ') || '' 
    });
    setIsFormOpen(true);
  };

  const openDeleteConfirm = (e, hostel) => {
    e.stopPropagation();
    setSelectedHostel(hostel);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return showToast('Hostel Name is required', 'error');
    if (!formData.years) return showToast('Academic years are required', 'error');

    try {
      setFormLoading(true);
      const payload = {
        name: formData.name,
        code: formData.code,
        type: formData.type,
        academic_years: formData.years.split(',').map(y => parseInt(y.trim(), 10)).filter(y => !isNaN(y))
      };

      if (selectedHostel) {
        await hostelApi.update(selectedHostel.id, payload);
        showToast('Hostel updated successfully');
      } else {
        await hostelApi.create(payload);
        showToast('Hostel created successfully');
      }
      setIsFormOpen(false);
      fetchHostels();
    } catch (err) {
      showToast(err.message || 'Failed to save hostel', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setFormLoading(true);
      await hostelApi.delete(selectedHostel.id);
      showToast('Hostel deleted successfully');
      setIsDeleteOpen(false);
      fetchHostels();
    } catch (err) {
      showToast(err.message || 'Failed to delete hostel', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const filteredHostels = hostels.filter(h => 
    h.name.toLowerCase().includes(search.toLowerCase()) || 
    h.code?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading && hostels.length === 0) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-20 bg-slate-200 rounded-xl w-full"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>)}
        </div>
        <div className="h-64 bg-slate-200 rounded-xl w-full mt-8"></div>
      </div>
    );
  }

  const totalHostels = hostels.length;
  const totalBeds = hostels.reduce((sum, h) => sum + (h.bed_count || 0), 0);
  const occupiedBeds = hostels.reduce((sum, h) => sum + (h.occupied_beds || 0), 0); // Not currently fetched but keep for future

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
      
      <PageHeader 
        title="Hostel Infrastructure" 
        description="Manage hostels, floors, rooms and bed availability."
        action={
          <Button onClick={openAddForm}>
            <Plus className="w-4 h-4 mr-2" />
            Add Hostel
          </Button>
        }
      />

      {/* Aggregate Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
        <StatCard title="Total Hostels" value={totalHostels} icon={<Building className="w-5 h-5 text-primary" />} />
        <StatCard title="Total Capacity" value={totalBeds} icon={<Users className="w-5 h-5 text-emerald-600" />} />
        <StatCard title="Occupied Beds" value={occupiedBeds} icon={<BedDouble className="w-5 h-5 text-amber-600" />} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            className="pl-9" 
            placeholder="Search hostels..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filteredHostels.length === 0 ? (
        <EmptyState 
          icon={<Building className="w-12 h-12 text-slate-300" />} 
          title="No Hostels Found" 
          description={search ? "No hostels matched your search." : "You haven't set up any hostels yet."}
          action={!search && <Button onClick={openAddForm}><Plus className="w-4 h-4 mr-2" />Add First Hostel</Button>}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hostel Name</TableHead>
                  <TableHead>Years</TableHead>
                  <TableHead className="text-center">Floors</TableHead>
                  <TableHead className="text-center">Rooms</TableHead>
                  <TableHead className="text-center">Occupancy</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHostels.map((hostel) => (
                  <TableRow key={hostel.id} className="hover:bg-slate-50/50 cursor-pointer transition-colors" onClick={() => navigate(`/warden/hostels/${hostel.id}`)}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="bg-primary/10 p-2 rounded-lg text-primary">
                          <Building className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{hostel.name}</div>
                          <div className="text-xs text-slate-500">{hostel.code}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">{hostel.academic_years?.join(', ')}</span>
                    </TableCell>
                    <TableCell className="text-center text-sm font-medium text-slate-700">{hostel.floor_count || 0}</TableCell>
                    <TableCell className="text-center text-sm font-medium text-slate-700">{hostel.room_count || 0}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-medium text-slate-900">{hostel.occupied_beds || 0}/{hostel.bed_count || 0}</span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full" 
                            style={{ width: `${hostel.bed_count ? ((hostel.occupied_beds || 0) / hostel.bed_count) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={hostel.status || 'Active'} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-500 hover:text-primary" onClick={(e) => openEditForm(e, hostel)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-500 hover:text-destructive" onClick={(e) => openDeleteConfirm(e, hostel)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Hostel Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{selectedHostel ? 'Edit Hostel' : 'Add New Hostel'}</h2>
            <p className="text-sm text-slate-500">Enter the hostel details below.</p>
          </div>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Hostel Name *</label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Hostel Alpha" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Hostel Code</label>
                <Input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="e.g. HA" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Type</label>
                <Select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="Boys">Boys</option>
                  <option value="Girls">Girls</option>
                  <option value="Co-ed">Co-ed</option>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Academic Years *</label>
              <Input value={formData.years} onChange={e => setFormData({...formData, years: e.target.value})} placeholder="e.g. 1, 2, 3, 4" required />
              <p className="text-xs text-slate-500">Comma separated years</p>
            </div>
            <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={formLoading}>Cancel</Button>
              <Button type="submit" disabled={formLoading}>{formLoading ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </form>
        </div>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-destructive">
            <div className="bg-red-100 p-2 rounded-full">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold">Delete Hostel?</h2>
          </div>
          <p className="text-sm text-slate-600">
            Are you sure you want to delete <span className="font-semibold text-slate-900">{selectedHostel?.name}</span>? 
            Deleting this hostel may affect its floors, rooms and beds. This action cannot be undone.
          </p>
          <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={formLoading}>Cancel</Button>
            <Button className="bg-destructive hover:bg-destructive-600 text-white" onClick={handleDelete} disabled={formLoading}>
              {formLoading ? 'Deleting...' : 'Delete Hostel'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

// Inline missing icon
function AlertTriangle(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}
