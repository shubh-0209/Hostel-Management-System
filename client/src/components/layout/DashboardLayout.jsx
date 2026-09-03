import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, LogOut, Bell, Search, Settings, Building } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { Input } from '../ui/Input';

export default function DashboardLayout({ navigation, roleTitle }) {
  const { logout, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const NavLinks = () => (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {navigation.map((item) => {
        const isActive = location.pathname.startsWith(item.href) && 
                         (item.href !== `/${profile?.role}/dashboard` || location.pathname === item.href);
        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              isActive
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              'group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-all'
            )}
          >
            <item.icon
              className={cn(
                isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-500',
                'mr-3 h-5 w-5 flex-shrink-0 transition-colors'
              )}
              aria-hidden="true"
            />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Brand Header */}
      <div className="flex h-16 flex-shrink-0 items-center px-6 border-b border-slate-100">
        <Building className="h-7 w-7 text-primary mr-3" />
        <span className="text-xl font-bold tracking-tight text-slate-900">HMS</span>
      </div>
      
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <NavLinks />
      </div>

      {/* User Profile at Bottom */}
      <div className="border-t border-slate-100 p-4">
        <div className="flex items-center w-full rounded-md p-2 hover:bg-slate-50 transition-colors">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
            {profile?.first_name?.[0] || 'U'}
          </div>
          <div className="ml-3 flex-1 overflow-hidden">
            <p className="text-sm font-medium text-slate-900 truncate">
              {profile?.first_name} {profile?.last_name}
            </p>
            <p className="text-xs text-slate-500 capitalize truncate">{profile?.role}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-destructive hover:bg-destructive/10 -mr-2">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white shadow-xl">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <Button variant="ghost" size="icon" className="text-white hover:bg-transparent" onClick={() => setSidebarOpen(false)}>
                <X className="h-6 w-6" />
              </Button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col z-20">
        <div className="flex min-h-0 flex-1 flex-col border-r border-slate-200 bg-white shadow-[1px_0_10px_rgba(0,0,0,0.02)]">
          <SidebarContent />
        </div>
      </div>

      <div className="flex flex-1 flex-col md:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white shadow-sm border-b border-slate-200/60 backdrop-blur-md bg-white/90">
          <button
            type="button"
            className="border-r border-slate-200 px-4 text-slate-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          
          <div className="flex flex-1 justify-between px-4 sm:px-6 md:px-8 items-center">
            {/* Search Bar / Breadcrumbs */}
            <div className="flex flex-1 items-center">
              <div className="w-full max-w-md relative hidden sm:block">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input 
                  type="search" 
                  placeholder="Search students, rooms, or actions..." 
                  className="w-full pl-9 bg-slate-50 border-transparent hover:bg-slate-100 focus:bg-white transition-colors"
                />
              </div>
              <h1 className="text-xl font-semibold text-slate-900 sm:hidden">
                {navigation.find(n => location.pathname.includes(n.href))?.name || 'Dashboard'}
              </h1>
            </div>
            
            {/* Header Right Actions */}
            <div className="ml-4 flex items-center md:ml-6 gap-2">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive border-2 border-white"></span>
              </Button>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 pb-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 py-8 animate-in fade-in duration-500">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
