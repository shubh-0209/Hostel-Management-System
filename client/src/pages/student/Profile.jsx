import React, { useState, useEffect } from 'react';
import { studentService } from '../../api/studentService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PageHeader } from '../../components/shared/PageHeader';
import { UserCircle, Save } from 'lucide-react';

export default function StudentProfile() {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [profile, setProfile] = useState({
    name: '',
    email: user?.email || '',
    jntu_number: '',
    academic_year: '',
    department: '',
    phone: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiMissing, setApiMissing] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const res = await studentService.getProfile();
        setProfile(p => ({ ...p, ...res.data }));
      } catch (err) {
        showToast(err.message || "Failed to load profile", "error");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await studentService.updateProfile(profile);
      showToast('Profile updated successfully');
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-pulse">
        <div className="h-24 bg-slate-200 rounded-xl w-full"></div>
        <div className="h-96 bg-slate-200 rounded-xl w-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
      <PageHeader 
        title="My Profile" 
        description="Manage your personal information and academic details."
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center space-x-4 bg-slate-50/50">
          <div className="bg-slate-200 p-4 rounded-full text-slate-400">
            <UserCircle className="w-12 h-12" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{profile.name || 'Student Name'}</h2>
            <p className="text-slate-500">{profile.email}</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Full Name</label>
              <Input 
                name="name" 
                value={profile.name} 
                onChange={handleChange} 
                placeholder="John Doe" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email Address</label>
              <Input 
                name="email" 
                value={profile.email} 
                disabled 
                className="bg-slate-50 text-slate-500" 
              />
              <p className="text-xs text-slate-500">Email cannot be changed.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">JNTU Number (Roll No)</label>
              <Input 
                name="jntu_number" 
                value={profile.jntu_number} 
                onChange={handleChange} 
                placeholder="21XXXXXXX" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Phone Number</label>
              <Input 
                name="phone" 
                value={profile.phone} 
                onChange={handleChange} 
                placeholder="+91 XXXXX XXXXX" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Department</label>
              <Input 
                name="department" 
                value={profile.department} 
                onChange={handleChange} 
                placeholder="Computer Science" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Academic Year</label>
              <Input 
                name="academic_year" 
                type="number"
                value={profile.academic_year} 
                onChange={handleChange} 
                placeholder="1, 2, 3 or 4" 
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <Button type="submit" disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
