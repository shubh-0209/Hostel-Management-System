import React, { useState, useEffect } from 'react';
import { studentService } from '../../api/studentService';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PageHeader } from '../../components/shared/PageHeader';
import { 
  UserCircle, 
  Save, 
  RotateCcw, 
  Lock, 
  Building2, 
  Bed, 
  Mail, 
  Phone, 
  GraduationCap, 
  IdCard, 
  AlertCircle,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function StudentProfile() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [initialData, setInitialData] = useState(null);
  const [formData, setFormData] = useState({
    phone: '',
    parent_email: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setError(null);
      const res = await studentService.getProfile();
      const data = res.data;
      setInitialData(data);
      setFormData({
        phone: data.phone || '',
        parent_email: data.parent_email || ''
      });
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Failed to load profile";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  const validateForm = () => {
    const errors = {};
    const phoneRegex = /^[0-9+\- ]{10,15}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.phone || !formData.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!phoneRegex.test(formData.phone.trim())) {
      errors.phone = "Enter a valid phone number (10-15 digits)";
    }

    if (!formData.parent_email || !formData.parent_email.trim()) {
      errors.parent_email = "Parent email is required";
    } else if (!emailRegex.test(formData.parent_email.trim())) {
      errors.parent_email = "Enter a valid email address";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSaving(true);
      await studentService.updateProfile({
        phone: formData.phone.trim(),
        parent_email: formData.parent_email.trim()
      });
      showToast('Profile updated successfully', 'success');
      setInitialData(prev => ({
        ...prev,
        phone: formData.phone.trim(),
        parent_email: formData.parent_email.trim()
      }));
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to update profile';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (initialData) {
      setFormData({
        phone: initialData.phone || '',
        parent_email: initialData.parent_email || ''
      });
      setFormErrors({});
    }
  };

  const hasChanges = initialData && (
    formData.phone !== (initialData.phone || '') ||
    formData.parent_email !== (initialData.parent_email || '')
  );

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-pulse">
        <div className="h-20 bg-slate-200 rounded-xl w-full"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-200 rounded-xl"></div>
          <div className="h-96 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error && !initialData) {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <PageHeader 
          title="Student Profile" 
          description="View your institutional record and update emergency contact details."
        />
        <div className="bg-white rounded-xl border border-red-200 p-8 text-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Failed to load profile</h3>
          <p className="text-sm text-slate-500 mb-6">{error}</p>
          <Button onClick={loadProfile}>Try Again</Button>
        </div>
      </div>
    );
  }

  const alloc = initialData?.allocation;

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Student Profile" 
        description="Official student institutional record and manageable contact details."
      />

      {/* Top Identity Banner */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative">
        <div className="flex items-center space-x-5">
          <div className="bg-primary/10 p-4 rounded-full text-primary shrink-0 border border-primary/20">
            <UserCircle className="w-12 h-12" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{initialData?.name || 'Student'}</h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                Student
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-1 flex items-center space-x-2">
              <span className="font-mono">{initialData?.jntu_number}</span>
              <span>•</span>
              <span>{initialData?.department || 'Computer Science & Engineering'}</span>
            </p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 flex items-center space-x-2">
          <Lock className="w-4 h-4 text-slate-400 shrink-0" />
          <span>Core identity & academic details are verified by registrar.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Details Form (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Personal & Academic Details</h3>
                <p className="text-xs text-slate-500">Manageable contact info & official institutional records.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              {/* Locked Academic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Full Name */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    <label>Full Name</label>
                    <span className="text-slate-400 flex items-center"><Lock className="w-3 h-3 mr-1" /> Locked</span>
                  </div>
                  <Input 
                    value={initialData?.name || ''} 
                    disabled 
                    className="bg-slate-50 text-slate-700 cursor-not-allowed border-slate-200 font-medium" 
                  />
                </div>

                {/* Roll Number */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    <label>JNTU / Roll Number</label>
                    <span className="text-slate-400 flex items-center"><Lock className="w-3 h-3 mr-1" /> Locked</span>
                  </div>
                  <Input 
                    value={initialData?.jntu_number || ''} 
                    disabled 
                    className="bg-slate-50 text-slate-700 cursor-not-allowed border-slate-200 font-mono" 
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    <label>Institutional Email</label>
                    <span className="text-slate-400 flex items-center"><Lock className="w-3 h-3 mr-1" /> Locked</span>
                  </div>
                  <Input 
                    value={initialData?.email || ''} 
                    disabled 
                    className="bg-slate-50 text-slate-700 cursor-not-allowed border-slate-200" 
                  />
                </div>

                {/* Department */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    <label>Department</label>
                    <span className="text-slate-400 flex items-center"><Lock className="w-3 h-3 mr-1" /> Locked</span>
                  </div>
                  <Input 
                    value={initialData?.department || 'Computer Science & Engineering'} 
                    disabled 
                    className="bg-slate-50 text-slate-700 cursor-not-allowed border-slate-200" 
                  />
                </div>

                {/* Academic Year */}
                <div className="space-y-1.5 sm:col-span-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    <label>Academic Year</label>
                    <span className="text-slate-400 flex items-center"><Lock className="w-3 h-3 mr-1" /> Locked</span>
                  </div>
                  <Input 
                    value={`Year ${initialData?.current_year || 1} (${['1st', '2nd', '3rd', '4th'][(initialData?.current_year || 1) - 1]} Year Undergraduate)`} 
                    disabled 
                    className="bg-slate-50 text-slate-700 cursor-not-allowed border-slate-200" 
                  />
                </div>
              </div>

              {/* Editable Contact Fields */}
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-primary" />
                  Contact & Emergency Information
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Primary Phone Number <span className="text-red-500">*</span>
                    </label>
                    <Input 
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, phone: e.target.value }));
                        if (formErrors.phone) setFormErrors(prev => ({ ...prev, phone: null }));
                      }}
                      placeholder="e.g. 9876543210"
                      className={formErrors.phone ? 'border-red-300 focus:border-red-500' : ''}
                    />
                    {formErrors.phone ? (
                      <p className="text-xs text-red-600">{formErrors.phone}</p>
                    ) : (
                      <p className="text-[11px] text-slate-400">Used for hostel & emergency communications.</p>
                    )}
                  </div>

                  {/* Parent Email */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Parent / Guardian Email <span className="text-red-500">*</span>
                    </label>
                    <Input 
                      name="parent_email"
                      type="email"
                      value={formData.parent_email}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, parent_email: e.target.value }));
                        if (formErrors.parent_email) setFormErrors(prev => ({ ...prev, parent_email: null }));
                      }}
                      placeholder="e.g. parent@example.com"
                      className={formErrors.parent_email ? 'border-red-300 focus:border-red-500' : ''}
                    />
                    {formErrors.parent_email ? (
                      <p className="text-xs text-red-600">{formErrors.parent_email}</p>
                    ) : (
                      <p className="text-[11px] text-slate-400">Receives verified movement & leave notifications.</p>
                    )}
                  </div>

                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleReset}
                  disabled={saving || !hasChanges}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Cancel / Reset
                </Button>

                <Button 
                  type="submit" 
                  disabled={saving || !hasChanges}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving Changes...' : 'Save Profile'}
                </Button>
              </div>

            </form>
          </div>
        </div>

        {/* Right Column: Accommodation Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-3">
                <Building2 className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-slate-900">Current Accommodation</h3>
              </div>
              <span className="text-xs text-slate-400 flex items-center"><Lock className="w-3 h-3 mr-1" /> Locked</span>
            </div>

            <div className="p-6 space-y-4">
              {alloc ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Status</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Allocated
                    </span>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Hostel</span>
                      <span className="font-semibold text-slate-900">{alloc.hostel_name}</span>
                    </div>

                    <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Floor</span>
                      <span className="font-semibold text-slate-900">Floor {alloc.floor_number ?? 'N/A'}</span>
                    </div>

                    <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Room</span>
                      <span className="font-semibold text-slate-900">Room {alloc.room_number} ({alloc.room_type})</span>
                    </div>

                    <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Bed</span>
                      <span className="font-bold text-primary">Bed {alloc.bed_number}</span>
                    </div>

                    {alloc.allocated_at && (
                      <div className="flex justify-between text-sm pt-1">
                        <span className="text-slate-500">Allocated Date</span>
                        <span className="text-slate-700 text-xs">
                          {new Date(alloc.allocated_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <Button 
                      variant="outline" 
                      className="w-full text-xs"
                      onClick={() => navigate('/student/allocation')}
                    >
                      Manage Bed Allocation
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                    <Bed className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-1">No Active Allocation</h4>
                  <p className="text-xs text-slate-500 mb-4">You have not been allocated a bed for this academic year.</p>
                  <Button 
                    className="w-full text-xs"
                    onClick={() => navigate('/student/hostels')}
                  >
                    Browse Hostels
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
