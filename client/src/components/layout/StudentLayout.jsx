import React from 'react';
import DashboardLayout from './DashboardLayout';
import { 
  LayoutDashboard, 
  Building2, 
  Bed, 
  CalendarClock, 
  UserCircle,
  BellRing
} from 'lucide-react';

const studentNavigation = [
  { name: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
  { name: 'Browse Hostels', href: '/student/hostels', icon: Building2 },
  { name: 'My Allocation', href: '/student/allocation', icon: Bed },
  { name: 'Profile', href: '/student/profile', icon: UserCircle },
  { name: 'My Outings', href: '/student/outings', icon: CalendarClock },
  { name: 'Notifications', href: '/student/notifications', icon: BellRing },
];

export default function StudentLayout() {
  return (
    <DashboardLayout 
      navigation={studentNavigation} 
      roleTitle="Student Portal" 
    />
  );
}
