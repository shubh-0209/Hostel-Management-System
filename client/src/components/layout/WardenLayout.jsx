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
  Settings,
  UtensilsCrossed
} from 'lucide-react';

const wardenNavigation = [
  { name: 'Dashboard', href: '/warden/dashboard', icon: LayoutDashboard },
  { name: 'Hostels', href: '/warden/hostels', icon: Building2 },
  { name: 'Mess Menu', href: '/warden/mess-menu', icon: UtensilsCrossed },
  { name: 'Allocations & Reports', href: '/warden/occupancy', icon: BarChart3 },
  { name: 'Outings', href: '/warden/outings', icon: CalendarClock },
  { name: 'Maintenance', href: '/warden/maintenance', icon: Settings },
];

export default function WardenLayout() {
  return (
    <DashboardLayout 
      navigation={wardenNavigation} 
      roleTitle="Warden Portal" 
    />
  );
}
