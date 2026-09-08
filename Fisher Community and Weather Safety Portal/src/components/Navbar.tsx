import React, { useState, useRef, useEffect } from 'react';
import { Anchor, ShieldAlert, Waves, TrendingUp, ShoppingBag, UserCheck, Bell, MapPin, LogIn, LogOut, ChevronDown, Activity, Search, Globe, Loader2, X } from 'lucide-react';
import { LocationItem, User, NotificationItem } from '../types';
import { api, setCurrentUserHeader } from '../services/api';
import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  currentLocation: LocationItem;
  locations: LocationItem[];
  onSelectLocation: (loc: LocationItem) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  onSwitchUser: (userId: string | null) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  notifications: NotificationItem[];
  onOpenNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentLocation,
  locations,
  onSelectLocation,
  activeTab,
  setActiveTab,
  currentUser,
  onSwitchUser,
  onOpenAuth,
  notifications,
  onOpenNotifications
}) => {
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const [isLocationMenuOpen, setIsLocationMenuOpen] = useState(false);
  const [locSearchQuery, setLocSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState<LocationItem[]>([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
  const locationDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
        setIsLocationMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search for global locations when user types in search box
  useEffect(() => {
    if (!locSearchQuery || locSearchQuery.trim().length < 2) {
      setGlobalSearchResults([]);
      setIsSearchingGlobal(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingGlobal(true);
      try {
        const res = await api.getLocations(locSearchQuery);
        setGlobalSearchResults(res.locations || []);
      } catch (err) {
        console.error('Failed to search worldwide locations:', err);
      } finally {
        setIsSearchingGlobal(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [locSearchQuery]);

  return (
    <header id="main-header" className="bg-white dark:bg-slate-900 border-b border-maritime-beige dark:border-slate-800 text-maritime-midnight dark:text-slate-100 sticky top-0 z-40 shadow-sm dark:shadow-xl transition-colors">
      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Logo & Portal Name */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('landing')}>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-maritime-midnight via-maritime-atlantic to-maritime-teal flex items-center justify-center shadow-md shadow-maritime-teal/20">
            <Anchor className="w-6 h-6 text-maritime-ivory" />
          </div>
          <div>
            <div className="font-bold text-base sm:text-lg tracking-tight text-maritime-midnight dark:text-white flex items-center space-x-2">
              <span>FISHER PORTAL</span>
              <span className="text-[10px] uppercase font-mono bg-maritime-seaglass/20 dark:bg-blue-500/20 text-maritime-teal dark:text-blue-300 px-1.5 py-0.5 rounded border border-maritime-seaglass/40 dark:border-blue-500/30 font-bold">Maritime</span>
            </div>
            <p className="text-xs text-maritime-seaglass dark:text-slate-400 hidden sm:block">Market Access & Weather Safety Portal</p>
          </div>
        </div>

        {/* Global Location Selector Dropdown */}
        <div className="relative min-w-[170px] sm:min-w-[220px]" ref={locationDropdownRef}>
          <button
            type="button"
            id="location-dropdown-toggle-btn"
            onClick={() => setIsLocationMenuOpen(!isLocationMenuOpen)}
            className="w-full flex items-center space-x-2 bg-maritime-ivory hover:bg-maritime-beige/50 dark:bg-slate-800/90 dark:hover:bg-slate-800 text-maritime-midnight dark:text-slate-200 px-3 py-1.5 rounded-lg border border-maritime-beige dark:border-slate-700 cursor-pointer text-xs sm:text-sm transition-colors text-left"
          >
            <MapPin className="w-4 h-4 text-maritime-teal dark:text-teal-400 flex-shrink-0" />
            <div className="truncate flex-1">
              <span className="font-bold block truncate text-maritime-midnight dark:text-slate-100">{currentLocation.name}</span>
              <span className="text-[10px] text-maritime-atlantic/70 dark:text-slate-400 block truncate">{currentLocation.country} • [{currentLocation.coordinates.coordinates[1].toFixed(2)}°, {currentLocation.coordinates.coordinates[0].toFixed(2)}°]</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-maritime-seaglass flex-shrink-0 transition-transform duration-200 ${isLocationMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          {isLocationMenuOpen && (
            <div
              id="location-dropdown-menu"
              className="absolute left-0 sm:-left-12 right-0 sm:-right-12 top-full mt-1 bg-white dark:bg-slate-900 border border-maritime-beige dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 min-w-[280px] sm:min-w-[340px]"
            >
              {/* Search Bar Input */}
              <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 sticky top-0 z-10">
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={locSearchQuery}
                    onChange={e => setLocSearchQuery(e.target.value)}
                    placeholder="Search ANY city, port, or region in the world..."
                    className="w-full pl-8 pr-7 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-teal-500"
                    autoFocus
                  />
                  {locSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setLocSearchQuery('')}
                      className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto py-1">
                {/* Global Live Geocoded Search Results */}
                {locSearchQuery.trim().length >= 2 ? (
                  <div>
                    <div className="px-3 py-1.5 text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider bg-teal-50/50 dark:bg-teal-950/40 flex items-center justify-between">
                      <span className="flex items-center space-x-1">
                        <Globe className="w-3 h-3" />
                        <span>Worldwide Locations</span>
                      </span>
                      {isSearchingGlobal && <Loader2 className="w-3 h-3 animate-spin text-teal-500" />}
                    </div>

                    {globalSearchResults.length > 0 ? (
                      globalSearchResults.map(loc => (
                        <button
                          key={loc._id}
                          type="button"
                          onClick={() => {
                            onSelectLocation(loc);
                            setIsLocationMenuOpen(false);
                            setLocSearchQuery('');
                          }}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition-colors ${loc._id === currentLocation._id ? 'bg-teal-50 dark:bg-blue-900/30 text-teal-700 dark:text-blue-300 font-bold border-l-2 border-teal-600' : 'text-slate-800 dark:text-slate-200'}`}
                        >
                          <div className="truncate pr-2">
                            <div className="font-semibold truncate">{loc.name}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                              {loc.city ? `${loc.city}, ` : ''}{loc.stateProvince ? `${loc.stateProvince}, ` : ''}{loc.country} • [{loc.coordinates.coordinates[1].toFixed(2)}°, {loc.coordinates.coordinates[0].toFixed(2)}°]
                            </div>
                          </div>
                          <span className="text-[9px] bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 px-1.5 py-0.5 rounded font-mono font-bold flex-shrink-0">
                            {loc.currency}
                          </span>
                        </button>
                      ))
                    ) : (
                      !isSearchingGlobal && (
                        <div className="p-4 text-center text-xs text-slate-400">
                          No matching global locations found for "{locSearchQuery}". Try spelling like "Kanniyakumari", "Cochin", "Tokyo", etc.
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  /* Standard Active Managed Locations List */
                  <div>
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-100/50 dark:bg-slate-900/50">
                      Managed Locations ({locations.length})
                    </div>
                    {locations.map(loc => (
                      <button
                        key={loc._id}
                        type="button"
                        onClick={() => {
                          onSelectLocation(loc);
                          setIsLocationMenuOpen(false);
                          setLocSearchQuery('');
                        }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition-colors ${loc._id === currentLocation._id ? 'bg-teal-50 dark:bg-blue-900/40 text-teal-700 dark:text-blue-300 font-bold border-l-2 border-teal-600' : 'text-slate-800 dark:text-slate-200'}`}
                      >
                        <div className="truncate pr-2">
                          <div className="font-medium truncate">{loc.name}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">{loc.country} ({loc.currency})</div>
                        </div>
                        {loc.isCoastal && (
                          <span className="text-[9px] bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 px-1.5 py-0.5 rounded font-semibold flex-shrink-0">
                            Coastal
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center space-x-1">
          <button
            id="nav-tab-overview"
            onClick={() => setActiveTab('location-overview')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center space-x-1.5 transition ${activeTab === 'location-overview' ? 'bg-maritime-teal text-white shadow-sm' : 'text-maritime-midnight dark:text-slate-300 hover:bg-maritime-ivory dark:hover:bg-slate-800'}`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>
          <button
            id="nav-tab-weather"
            onClick={() => setActiveTab('weather')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center space-x-1.5 transition ${activeTab === 'weather' ? 'bg-maritime-atlantic text-white shadow-sm' : 'text-maritime-midnight dark:text-slate-300 hover:bg-maritime-ivory dark:hover:bg-slate-800'}`}
          >
            <Waves className="w-3.5 h-3.5 text-maritime-seaglass dark:text-cyan-400" />
            <span>Weather & Sea</span>
          </button>
          <button
            id="nav-tab-prices"
            onClick={() => setActiveTab('prices')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center space-x-1.5 transition ${activeTab === 'prices' ? 'bg-maritime-brass text-white shadow-sm' : 'text-maritime-midnight dark:text-slate-300 hover:bg-maritime-ivory dark:hover:bg-slate-800'}`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-maritime-brass dark:text-emerald-400" />
            <span>Price Dashboard</span>
          </button>
          <button
            id="nav-tab-marketplace"
            onClick={() => setActiveTab('marketplace')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center space-x-1.5 transition ${activeTab === 'marketplace' ? 'bg-maritime-copper text-white shadow-sm' : 'text-maritime-midnight dark:text-slate-300 hover:bg-maritime-ivory dark:hover:bg-slate-800'}`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-maritime-copper dark:text-amber-400" />
            <span>Catch Marketplace</span>
          </button>
          <button
            id="nav-tab-auth"
            onClick={() => onOpenAuth('login')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center space-x-1.5 transition ${activeTab === 'auth' ? 'bg-maritime-midnight text-white shadow-sm' : 'text-maritime-midnight dark:text-slate-300 hover:bg-maritime-ivory dark:hover:bg-slate-800'}`}
          >
            <LogIn className="w-3.5 h-3.5 text-maritime-teal dark:text-blue-400" />
            <span>Login / Register</span>
          </button>
          {currentUser?.role === 'fisher' && (
            <button
              id="nav-tab-fisher-dash"
              onClick={() => setActiveTab('fisher-dashboard')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center space-x-1.5 transition ${activeTab === 'fisher-dashboard' ? 'bg-maritime-forest text-white shadow-sm' : 'text-maritime-forest dark:text-emerald-400 hover:bg-maritime-ivory dark:hover:bg-slate-800'}`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Fisher Dashboard</span>
            </button>
          )}
          {currentUser?.role === 'buyer' && (
            <button
              id="nav-tab-buyer-dash"
              onClick={() => setActiveTab('buyer-dashboard')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center space-x-1.5 transition ${activeTab === 'buyer-dashboard' ? 'bg-maritime-copper text-white shadow-sm' : 'text-maritime-copper dark:text-indigo-400 hover:bg-maritime-ivory dark:hover:bg-slate-800'}`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Buyer Dashboard</span>
            </button>
          )}
          {currentUser?.role === 'admin' && (
            <button
              id="nav-tab-admin-dash"
              onClick={() => setActiveTab('admin-dashboard')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center space-x-1.5 transition ${activeTab === 'admin-dashboard' ? 'bg-maritime-oxblood text-white shadow-sm' : 'text-maritime-oxblood dark:text-purple-400 hover:bg-maritime-ivory dark:hover:bg-slate-800'}`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin Panel</span>
            </button>
          )}
        </nav>

        {/* User Account Controls & Theme Toggle */}
        <div className="flex items-center space-x-2">
          {/* Theme Toggle Component */}
          <ThemeToggle />

          {currentUser ? (
            <div className="flex items-center space-x-2">
              <button
                id="btn-notifications-toggle"
                onClick={onOpenNotifications}
                className="relative p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                title="Notifications Inbox"
              >
                <Bell className="w-4 h-4 text-slate-700 dark:text-slate-200" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center justify-end space-x-1">
                  <span>{currentUser.fullName}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-mono font-semibold ${
                    currentUser.accountStatus === 'approved' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800' :
                    currentUser.accountStatus === 'pending' ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-800' :
                    'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-400 border border-red-300 dark:border-red-800'
                  }`}>
                    {currentUser.accountStatus}
                  </span>
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{currentUser.role} Account</span>
              </div>
              <button
                id="btn-header-logout"
                onClick={() => { setCurrentUserHeader(''); onSwitchUser(null); }}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5">
              <button
                id="btn-header-login"
                onClick={() => onOpenAuth('login')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
              >
                Log In
              </button>
              <button
                id="btn-header-register"
                onClick={() => onOpenAuth('register')}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition flex items-center space-x-1"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Register</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Tab Navigation Strip */}
      <div className="lg:hidden flex overflow-x-auto bg-slate-100 dark:bg-slate-950 px-2 py-1.5 border-t border-slate-200 dark:border-slate-800 space-x-1 text-xs">
        <button
          onClick={() => setActiveTab('location-overview')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'location-overview' ? 'bg-blue-600 text-white' : 'text-slate-700 dark:text-slate-300'}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('weather')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'weather' ? 'bg-blue-600 text-white' : 'text-slate-700 dark:text-slate-300'}`}
        >
          Weather & Sea
        </button>
        <button
          onClick={() => setActiveTab('prices')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'prices' ? 'bg-blue-600 text-white' : 'text-slate-700 dark:text-slate-300'}`}
        >
          Price Dashboard
        </button>
        <button
          onClick={() => setActiveTab('marketplace')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'marketplace' ? 'bg-blue-600 text-white' : 'text-slate-700 dark:text-slate-300'}`}
        >
          Catch Marketplace
        </button>
        <button
          onClick={() => onOpenAuth('login')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'auth' ? 'bg-blue-600 text-white' : 'text-slate-700 dark:text-slate-300'}`}
        >
          Login / Register
        </button>
        {currentUser?.role === 'fisher' && (
          <button
            onClick={() => setActiveTab('fisher-dashboard')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'fisher-dashboard' ? 'bg-emerald-600 text-white' : 'text-emerald-700 dark:text-emerald-400'}`}
          >
            Fisher Dashboard
          </button>
        )}
        {currentUser?.role === 'buyer' && (
          <button
            onClick={() => setActiveTab('buyer-dashboard')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'buyer-dashboard' ? 'bg-indigo-600 text-white' : 'text-indigo-700 dark:text-indigo-400'}`}
          >
            Buyer Dashboard
          </button>
        )}
        {currentUser?.role === 'admin' && (
          <button
            onClick={() => setActiveTab('admin-dashboard')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'admin-dashboard' ? 'bg-purple-600 text-white' : 'text-purple-700 dark:text-purple-400'}`}
          >
            Admin Panel
          </button>
        )}
      </div>
    </header>
  );
};
