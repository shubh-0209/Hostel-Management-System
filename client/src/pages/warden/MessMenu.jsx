import React, { useState, useEffect, useMemo } from 'react';
import { messMenuApi } from '../../api/messMenuApi';
import { hostelApi } from '../../api/hostelApi';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/shared/PageHeader';
import { EmptyState } from '../../components/shared/EmptyState';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Dialog } from '../../components/ui/Dialog';
import { 
  UtensilsCrossed, 
  Plus, 
  Edit3, 
  Trash2, 
  Building2, 
  Calendar, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  SunMedium,
  Soup,
  Coffee,
  Moon,
  CheckCircle2
} from 'lucide-react';

const DAYS = [
  { id: 1, name: 'Monday', short: 'Mon' },
  { id: 2, name: 'Tuesday', short: 'Tue' },
  { id: 3, name: 'Wednesday', short: 'Wed' },
  { id: 4, name: 'Thursday', short: 'Thu' },
  { id: 5, name: 'Friday', short: 'Fri' },
  { id: 6, name: 'Saturday', short: 'Sat' },
  { id: 7, name: 'Sunday', short: 'Sun' },
];

const MEALS_CONFIG = [
  {
    type: 'breakfast',
    title: 'Breakfast',
    timing: '7:30 AM – 9:30 AM',
    icon: SunMedium,
    accent: 'border-amber-200 bg-amber-50/50 text-amber-900',
    emoji: '🍳',
  },
  {
    type: 'lunch',
    title: 'Lunch',
    timing: '12:30 PM – 2:30 PM',
    icon: Soup,
    accent: 'border-emerald-200 bg-emerald-50/50 text-emerald-900',
    emoji: '🍛',
  },
  {
    type: 'snacks',
    title: 'Evening Snacks',
    timing: '5:00 PM – 6:00 PM',
    icon: Coffee,
    accent: 'border-orange-200 bg-orange-50/50 text-orange-900',
    emoji: '☕',
  },
  {
    type: 'dinner',
    title: 'Dinner',
    timing: '7:30 PM – 9:30 PM',
    icon: Moon,
    accent: 'border-indigo-200 bg-indigo-50/50 text-indigo-900',
    emoji: '🍽️',
  },
];

export default function WardenMessMenu() {
  const { showToast } = useToast();

  const [hostels, setHostels] = useState([]);
  const [selectedHostelId, setSelectedHostelId] = useState('');
  const [menuEntries, setMenuEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDayFilter, setActiveDayFilter] = useState('all'); // 'all' or 1..7

  // Form modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    hostel_id: '',
    day_of_week: 1,
    meal_type: 'breakfast',
    menu_items: '',
  });

  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Load hostels on mount
  useEffect(() => {
    async function loadHostels() {
      try {
        const res = await hostelApi.getAll();
        const list = res.data || [];
        setHostels(list);
        if (list.length > 0 && !selectedHostelId) {
          setSelectedHostelId(list[0].id);
        }
      } catch (err) {
        showToast('Failed to load hostels list: ' + err.message, 'error');
      }
    }
    loadHostels();
  }, []);

  // Fetch menu whenever selected hostel changes
  useEffect(() => {
    if (selectedHostelId) {
      fetchMenu(selectedHostelId);
    }
  }, [selectedHostelId]);

  async function fetchMenu(hostelId) {
    try {
      setLoading(true);
      const res = await messMenuApi.getMenu({ hostel_id: hostelId });
      const data = res.data || {};
      setMenuEntries(data.menu || []);
    } catch (err) {
      showToast(err.message || 'Failed to load mess menu', 'error');
    } finally {
      setLoading(false);
    }
  }

  // Lookup map: `${day_of_week}_${meal_type}` -> entry
  const menuMap = useMemo(() => {
    const map = {};
    for (const item of menuEntries) {
      map[`${item.day_of_week}_${item.meal_type.toLowerCase()}`] = item;
    }
    return map;
  }, [menuEntries]);

  const selectedHostel = useMemo(() => {
    return hostels.find((h) => h.id === selectedHostelId) || null;
  }, [hostels, selectedHostelId]);

  // Handle open modal for Create
  const handleOpenAddModal = (presetDay = 1, presetMeal = 'breakfast') => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      hostel_id: selectedHostelId,
      day_of_week: presetDay,
      meal_type: presetMeal,
      menu_items: '',
    });
    setModalOpen(true);
  };

  // Handle open modal for Edit
  const handleOpenEditModal = (entry) => {
    setIsEditing(true);
    setEditingId(entry.id);
    setFormData({
      hostel_id: entry.hostel_id,
      day_of_week: entry.day_of_week,
      meal_type: entry.meal_type,
      menu_items: entry.menu_items,
    });
    setModalOpen(true);
  };

  // Handle Save (Create or Update)
  const handleSave = async (e) => {
    e.preventDefault();

    if (!formData.menu_items.trim()) {
      showToast('Menu items cannot be empty', 'error');
      return;
    }

    try {
      setSaving(true);
      if (isEditing && editingId) {
        await messMenuApi.update(editingId, {
          hostel_id: formData.hostel_id,
          day_of_week: Number(formData.day_of_week),
          meal_type: formData.meal_type,
          menu_items: formData.menu_items.trim(),
        });
        showToast('Mess menu entry updated successfully', 'success');
      } else {
        await messMenuApi.create({
          hostel_id: formData.hostel_id,
          day_of_week: Number(formData.day_of_week),
          meal_type: formData.meal_type,
          menu_items: formData.menu_items.trim(),
        });
        showToast('Mess menu entry created successfully', 'success');
      }
      setModalOpen(false);
      await fetchMenu(selectedHostelId);
    } catch (err) {
      showToast(err.message || 'Failed to save menu entry', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete Confirmation
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      setDeleting(true);
      await messMenuApi.delete(itemToDelete.id);
      showToast('Menu entry deleted successfully', 'success');
      setDeleteModalOpen(false);
      setItemToDelete(null);
      await fetchMenu(selectedHostelId);
    } catch (err) {
      showToast(err.message || 'Failed to delete menu entry', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const displayedDays = activeDayFilter === 'all'
    ? DAYS
    : DAYS.filter((d) => d.id === Number(activeDayFilter));

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300">
      {/* Header */}
      <PageHeader
        title="Mess Menu Management"
        description="Configure and manage the weekly dining schedule for your hostel"
        action={
          <div className="flex flex-wrap items-center gap-3">
            {hostels.length > 0 && (
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-slate-500 hidden sm:inline" />
                <Select
                  value={selectedHostelId}
                  onChange={(e) => setSelectedHostelId(e.target.value)}
                  className="w-48 sm:w-56"
                >
                  {hostels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.code})
                    </option>
                  ))}
                </Select>
              </div>
            )}
            <Button
              onClick={() => handleOpenAddModal(1, 'breakfast')}
              className="flex items-center space-x-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Add Meal Entry</span>
            </Button>
          </div>
        }
      />

      {/* Day Filter Pills */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveDayFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              activeDayFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Days ({menuEntries.length}/28 entries)
          </button>
          {DAYS.map((d) => {
            const countForDay = menuEntries.filter((m) => m.day_of_week === d.id).length;
            const isSelected = activeDayFilter === d.id.toString();
            return (
              <button
                key={d.id}
                onClick={() => setActiveDayFilter(d.id.toString())}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{d.short}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {countForDay}/4
                </span>
              </button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchMenu(selectedHostelId)}
          className="text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-12 bg-slate-200 rounded-lg w-full"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-56 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      ) : displayedDays.length === 0 ? (
        <EmptyState
          title="No Days Selected"
          description="Please select a valid day filter."
          icon={Calendar}
        />
      ) : (
        <div className="space-y-8">
          {displayedDays.map((day) => {
            const countForDay = menuEntries.filter((m) => m.day_of_week === day.id).length;
            return (
              <div key={day.id} className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-bold text-slate-900">{day.name}</h3>
                    <Badge variant={countForDay === 4 ? 'success' : 'warning'}>
                      {countForDay}/4 Meals Configured
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {MEALS_CONFIG.map((cfg) => {
                    const entry = menuMap[`${day.id}_${cfg.type}`];
                    const MealIcon = cfg.icon;

                    return (
                      <Card
                        key={cfg.type}
                        className={`flex flex-col justify-between overflow-hidden border transition-all ${
                          entry
                            ? 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                            : 'border-dashed border-slate-300 bg-slate-50/50'
                        }`}
                      >
                        <CardHeader className={`p-4 border-b ${cfg.accent}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-xl" role="img" aria-label={cfg.title}>
                                {cfg.emoji}
                              </span>
                              <div>
                                <CardTitle className="text-sm font-bold text-slate-900">
                                  {cfg.title}
                                </CardTitle>
                                <span className="text-[11px] text-slate-500">
                                  {cfg.timing}
                                </span>
                              </div>
                            </div>
                            <MealIcon className="h-4 w-4 text-slate-400" />
                          </div>
                        </CardHeader>

                        <CardContent className="p-4 flex-1 flex flex-col justify-between">
                          {entry ? (
                            <div className="space-y-3">
                              <div className="flex flex-wrap gap-1">
                                {entry.menu_items.split(/[,;\n]+/).map((item, idx) => {
                                  const trimmed = item.trim();
                                  if (!trimmed) return null;
                                  return (
                                    <span
                                      key={idx}
                                      className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800"
                                    >
                                      {trimmed}
                                    </span>
                                  );
                                })}
                              </div>
                              <div className="flex items-center justify-end space-x-1 pt-3 border-t border-slate-100">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-xs text-slate-600 hover:text-slate-900"
                                  onClick={() => handleOpenEditModal(entry)}
                                >
                                  <Edit3 className="h-3.5 w-3.5 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => {
                                    setItemToDelete({
                                      ...entry,
                                      dayName: day.name,
                                      mealTitle: cfg.title,
                                    });
                                    setDeleteModalOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
                              <p className="text-xs text-slate-400 italic">Not configured yet</p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs border-dashed text-slate-600 hover:text-slate-900"
                                onClick={() => handleOpenAddModal(day.id, cfg.type)}
                              >
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                Add {cfg.title}
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <div className="space-y-4">
          <div className="border-b pb-3">
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
              <span>{isEditing ? 'Edit Meal Entry' : 'Add New Meal Entry'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isEditing
                ? 'Update the food items for this meal slot.'
                : 'Enter menu items separated by commas or lines.'}
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hostel
              </label>
              <Select
                value={formData.hostel_id}
                onChange={(e) => setFormData({ ...formData, hostel_id: e.target.value })}
                disabled={isEditing}
                required
              >
                {hostels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.code})
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Day of the Week
                </label>
                <Select
                  value={formData.day_of_week}
                  onChange={(e) => setFormData({ ...formData, day_of_week: Number(e.target.value) })}
                  disabled={isEditing}
                  required
                >
                  {DAYS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Meal Type
                </label>
                <Select
                  value={formData.meal_type}
                  onChange={(e) => setFormData({ ...formData, meal_type: e.target.value })}
                  disabled={isEditing}
                  required
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="snacks">Evening Snacks</option>
                  <option value="dinner">Dinner</option>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Menu Items <span className="text-red-500">*</span>
              </label>
              <Textarea
                rows={4}
                value={formData.menu_items}
                onChange={(e) => setFormData({ ...formData, menu_items: e.target.value })}
                placeholder="e.g. Dal, Rice, Roti, Mix Veg, Salad"
                required
                maxLength={500}
                className="text-sm resize-none"
              />
              <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
                <span>Separate multiple items with commas</span>
                <span>{formData.menu_items.length}/500</span>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Entry'}
              </Button>
            </div>
          </form>
        </div>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-red-600">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Menu Entry</h3>
              <p className="text-xs text-slate-500">This action cannot be undone.</p>
            </div>
          </div>

          <p className="text-sm text-slate-600">
            Are you sure you want to remove the{' '}
            <span className="font-semibold text-slate-900">{itemToDelete?.mealTitle}</span> menu for{' '}
            <span className="font-semibold text-slate-900">{itemToDelete?.dayName}</span>?
          </p>

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete Entry'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
