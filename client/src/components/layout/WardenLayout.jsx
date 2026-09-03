import React from 'react';
import DashboardLayout from './DashboardLayout';
import { 
  LayoutDashboard, 
  Users,
  Building2, 
  DoorOpen,
  BedDouble, 
  CalendarClock, 
  BellRing,
  BarChart3,
  History,
  Settings
} from 'lucide-react';

const wardenNavigation = [
  { name: 'Dashboard', href: '/warden/dashboard', icon: LayoutDashboard },
  { name: 'Students', href: '/warden/students', icon: Users },
  { name: 'Hostels', href: '/warden/hostels', icon: Building2 },
  { name: 'Rooms', href: '/warden/rooms', icon: DoorOpen },
  { name: 'Allocations', href: '/warden/occupancy', icon: BedDouble },
  { name: 'Outings', href: '/warden/outings', icon: CalendarClock },
  { name: 'Notifications', href: '/warden/notifications', icon: BellRing },
  { name: 'Reports', href: '/warden/reports', icon: BarChart3 },
  { name: 'Audit Logs', href: '/warden/audit', icon: History },
  { name: 'Settings', href: '/warden/settings', icon: Settings },
];

export default function WardenLayout() {
  return (
    <DashboardLayout 
      navigation={wardenNavigation} 
      roleTitle="Warden Portal" 
    />
  );
}
