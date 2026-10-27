import React from 'react';
import DashboardLayout from './DashboardLayout';
import { 
  LayoutDashboard, 
  Building2, 
  Bed, 
  CalendarClock, 
  UserCircle,
  BellRing,
  Wrench,
  UtensilsCrossed
} from 'lucide-react';

const studentNavigation = [
  { name: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
  { name: 'Profile', href: '/student/profile', icon: UserCircle },
  { name: 'Browse Hostels', href: '/student/hostels', icon: Building2 },
  { name: 'My Allocation', href: '/student/allocation', icon: Bed },
  { name: 'Mess Menu', href: '/student/mess-menu', icon: UtensilsCrossed },
  { name: 'Out Pass & Leave', href: '/student/outings', icon: CalendarClock },
  { name: 'Maintenance', href: '/student/maintenance', icon: Wrench },
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
