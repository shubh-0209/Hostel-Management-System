import React, { useState, useEffect, useMemo } from 'react';
import { messMenuApi } from '../../api/messMenuApi';
import { hostelApi } from '../../api/hostelApi';
import { PageHeader } from '../../components/shared/PageHeader';
import { EmptyState } from '../../components/shared/EmptyState';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { 
  UtensilsCrossed, 
  Calendar, 
  Clock, 
  Sparkles, 
  Coffee, 
  Soup, 
  Moon, 
  SunMedium, 
  Building2, 
  RefreshCw,
  AlertCircle
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
    badgeVariant: 'warning',
    emoji: '🍳',
  },
  {
    type: 'lunch',
    title: 'Lunch',
    timing: '12:30 PM – 2:30 PM',
    icon: Soup,
    accent: 'border-emerald-200 bg-emerald-50/50 text-emerald-900',
    badgeVariant: 'success',
    emoji: '🍛',
  },
  {
    type: 'snacks',
    title: 'Evening Snacks',
    timing: '5:00 PM – 6:00 PM',
    icon: Coffee,
    accent: 'border-orange-200 bg-orange-50/50 text-orange-900',
    badgeVariant: 'warning',
    emoji: '☕',
  },
  {
    type: 'dinner',
    title: 'Dinner',
    timing: '7:30 PM – 9:30 PM',
    icon: Moon,
    accent: 'border-indigo-200 bg-indigo-50/50 text-indigo-900',
    badgeVariant: 'info',
    emoji: '🍽️',
  },
];

export default function StudentMessMenu() {
  // Map JavaScript getDay() (0 = Sun, 1 = Mon ... 6 = Sat) to 1 = Mon ... 7 = Sun
  const todayDayOfWeek = useMemo(() => {
    const jsDay = new Date().getDay();
    return jsDay === 0 ? 7 : jsDay;
  }, []);

  const [selectedDay, setSelectedDay] = useState(todayDayOfWeek);
  const [hostel, setHostel] = useState(null);
  const [allHostels, setAllHostels] = useState([]);
  const [selectedHostelId, setSelectedHostelId] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('today'); // 'today' | 'weekly'

  // Today's formatted date string
  const formattedToday = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  }, []);

  // Fetch hostels list for selector
  useEffect(() => {
    async function loadHostels() {
      try {
        const res = await hostelApi.getAll();
        setAllHostels(res.data || []);
      } catch (err) {
        console.error('Failed to load hostel options:', err);
      }
    }
    loadHostels();
  }, []);

  // Fetch mess menu
  useEffect(() => {
    fetchMenu(selectedHostelId);
  }, [selectedHostelId]);

  async function fetchMenu(hostelId) {
    try {
      setLoading(true);
      setError(null);
      const params = hostelId ? { hostel_id: hostelId } : {};
      const res = await messMenuApi.getMenu(params);

      const data = res.data || {};
      setHostel(data.hostel || null);
      if (data.hostel?.id && !selectedHostelId) {
        setSelectedHostelId(data.hostel.id);
      }
      setMenuItems(data.menu || []);
    } catch (err) {
      console.error('Error fetching mess menu:', err);
      setError(err.message || 'Unable to connect to the mess menu service. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Lookup map: `${day_of_week}_${meal_type}` -> entry
  const menuMap = useMemo(() => {
    const map = {};
    for (const item of menuItems) {
      map[`${item.day_of_week}_${item.meal_type.toLowerCase()}`] = item;
    }
    return map;
  }, [menuItems]);

  const todayMeals = useMemo(() => {
    return MEALS_CONFIG.map((cfg) => {
      const entry = menuMap[`${todayDayOfWeek}_${cfg.type}`];
      return {
        ...cfg,
        menuItems: entry?.menu_items || null,
        updatedAt: entry?.updated_at || null,
      };
    });
  }, [menuMap, todayDayOfWeek]);

  const selectedDayMeals = useMemo(() => {
    return MEALS_CONFIG.map((cfg) => {
      const entry = menuMap[`${selectedDay}_${cfg.type}`];
      return {
        ...cfg,
        menuItems: entry?.menu_items || null,
        updatedAt: entry?.updated_at || null,
      };
    });
  }, [menuMap, selectedDay]);

  const selectedDayName = useMemo(() => {
    return DAYS.find((d) => d.id === selectedDay)?.name || '';
  }, [selectedDay]);

  const isTodaySelected = selectedDay === todayDayOfWeek;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-pulse">
        <div className="h-20 bg-slate-200 rounded-xl w-full"></div>
        <div className="h-12 bg-slate-200 rounded-xl w-72"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <PageHeader
          title="Mess Menu"
          description="View your hostel's daily and weekly meal schedule"
        />
        <div className="p-6 rounded-xl border border-red-200 bg-red-50 text-red-900 flex flex-col items-center justify-center text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-red-500" />
          <div>
            <h3 className="font-semibold text-lg">Unable to load mess menu</h3>
            <p className="text-sm text-red-700 mt-1 max-w-md">{error}</p>
          </div>
          <Button
            variant="outline"
            className="border-red-300 text-red-900 hover:bg-red-100"
            onClick={() => fetchMenu(selectedHostelId)}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <PageHeader
        title="Mess Menu"
        description={
          hostel ? (
            <span className="flex flex-wrap items-center gap-2 mt-1">
              <span className="font-medium text-slate-800">{hostel.name} ({hostel.code})</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600">{formattedToday}</span>
            </span>
          ) : (
            'Hostel Mess Schedule'
          )
        }
        action={
          allHostels.length > 1 ? (
            <div className="flex items-center space-x-2">
              <Building2 className="h-4 w-4 text-slate-500 hidden sm:inline" />
              <Select
                value={selectedHostelId}
                onChange={(e) => setSelectedHostelId(e.target.value)}
                className="w-48 sm:w-56"
              >
                {allHostels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.code})
                  </option>
                ))}
              </Select>
            </div>
          ) : null
        }
      />

      {/* View Switcher Tabs (Today vs Weekly) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="inline-flex p-1 rounded-lg bg-slate-100 border border-slate-200 self-start">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'today'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Today's Menu</span>
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'weekly'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="h-4 w-4 text-indigo-500" />
            <span>Weekly Schedule</span>
          </button>
        </div>

        {activeTab === 'today' && (
          <div className="flex items-center space-x-2 text-sm text-slate-500">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live today schedule ({DAYS.find((d) => d.id === todayDayOfWeek)?.name})</span>
          </div>
        )}
      </div>

      {menuItems.length === 0 ? (
        <EmptyState
          title="No Mess Menu Published"
          description={`No mess menu has been published for ${hostel?.name || 'this hostel'} yet. Please check back later or contact your hostel warden.`}
          icon={UtensilsCrossed}
          action={
            <Button variant="outline" onClick={() => fetchMenu(selectedHostelId)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          }
        />
      ) : activeTab === 'today' ? (
        /* TODAY'S MENU VIEW */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                <span>Today's Meals</span>
                <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                  {DAYS.find((d) => d.id === todayDayOfWeek)?.name}
                </Badge>
              </h3>
              <p className="text-sm text-slate-500 mt-0.5">{formattedToday}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {todayMeals.map((meal) => {
              const MealIcon = meal.icon;
              return (
                <Card
                  key={meal.type}
                  className="flex flex-col overflow-hidden border-slate-200 transition-all duration-200 hover:shadow-md hover:border-slate-300"
                >
                  <CardHeader className={`border-b ${meal.accent}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl" role="img" aria-label={meal.title}>
                          {meal.emoji}
                        </span>
                        <div>
                          <CardTitle className="text-base font-bold text-slate-900">
                            {meal.title}
                          </CardTitle>
                          <div className="flex items-center text-xs text-slate-500 mt-0.5">
                            <Clock className="h-3 w-3 mr-1" />
                            {meal.timing}
                          </div>
                        </div>
                      </div>
                      <MealIcon className="h-5 w-5 text-slate-400" />
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 p-5 flex flex-col justify-between bg-white">
                    {meal.menuItems ? (
                      <div className="space-y-3">
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Menu Items
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {meal.menuItems.split(/[,;\n]+/).map((item, idx) => {
                            const trimmed = item.trim();
                            if (!trimmed) return null;
                            return (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200/60"
                              >
                                {trimmed}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 text-center text-slate-400 text-sm italic">
                        {meal.title} menu hasn't been added yet.
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        /* WEEKLY MENU VIEW */
        <div className="space-y-6">
          {/* Day selection tabs */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Select Day of Week
            </label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => {
                const isSelected = day.id === selectedDay;
                const isToday = day.id === todayDayOfWeek;
                return (
                  <button
                    key={day.id}
                    onClick={() => setSelectedDay(day.id)}
                    className={`relative px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border flex items-center space-x-2 ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-slate-900/10'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <span>{day.name}</span>
                    {isToday && (
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                        }`}
                      >
                        Today
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Meals for Selected Day */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <span>{selectedDayName} Menu</span>
                {isTodaySelected && (
                  <Badge variant="default" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                    Today
                  </Badge>
                )}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {selectedDayMeals.map((meal) => {
                const MealIcon = meal.icon;
                return (
                  <Card
                    key={meal.type}
                    className="flex flex-col overflow-hidden border-slate-200 transition-all duration-200 hover:shadow-md hover:border-slate-300"
                  >
                    <CardHeader className={`border-b ${meal.accent}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl" role="img" aria-label={meal.title}>
                            {meal.emoji}
                          </span>
                          <div>
                            <CardTitle className="text-base font-bold text-slate-900">
                              {meal.title}
                            </CardTitle>
                            <div className="flex items-center text-xs text-slate-500 mt-0.5">
                              <Clock className="h-3 w-3 mr-1" />
                              {meal.timing}
                            </div>
                          </div>
                        </div>
                        <MealIcon className="h-5 w-5 text-slate-400" />
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-5 flex flex-col justify-between bg-white">
                      {meal.menuItems ? (
                        <div className="space-y-3">
                          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Menu Items
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {meal.menuItems.split(/[,;\n]+/).map((item, idx) => {
                              const trimmed = item.trim();
                              if (!trimmed) return null;
                              return (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200/60"
                                >
                                  {trimmed}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="py-6 text-center text-slate-400 text-sm italic">
                          {meal.title} menu hasn't been added yet.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
