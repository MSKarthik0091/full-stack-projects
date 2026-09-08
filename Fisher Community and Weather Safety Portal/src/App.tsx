import React, { useEffect, useState } from 'react';
import { LocationItem, FishSpecies, User, NotificationItem, CatchListing, MarketPrice, SafetyAlert } from './types';
import { api, getCurrentUserHeader, setCurrentUserHeader } from './services/api';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { NotificationsDrawer } from './components/NotificationsDrawer';
import { LandingPage } from './pages/LandingPage';
import { LocationOverviewPage } from './pages/LocationOverviewPage';
import { WeatherSeaPage } from './pages/WeatherSeaPage';
import { PriceDashboardPage } from './pages/PriceDashboardPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { FisherDashboard } from './pages/FisherDashboard';
import { BuyerDashboard } from './pages/BuyerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AuthPage } from './pages/AuthPage';

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationItem | null>(null);
  const [speciesList, setSpeciesList] = useState<FishSpecies[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Navigation state
  const [activeTab, setActiveTab] = useState<string>('landing');

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);

  // Home preview data
  const [featuredListings, setFeaturedListings] = useState<CatchListing[]>([]);
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<SafetyAlert[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const initData = async () => {
    try {
      const [locRes, specRes, meRes, listingsRes] = await Promise.all([
        api.getLocations(),
        api.getSpecies(),
        api.getMe(),
        api.getListings()
      ]);

      setLocations(locRes.locations);
      if (locRes.locations.length > 0) {
        if (!selectedLocation || !locRes.locations.some(l => l._id === selectedLocation._id)) {
          setSelectedLocation(locRes.locations[0]);
        }
      } else {
        setSelectedLocation(null);
      }
      setSpeciesList(specRes.species);
      setCurrentUser(meRes.user);
      setFeaturedListings(listingsRes.listings);

      if (meRes.user) {
        const notifRes = await api.getNotifications();
        setNotifications(notifRes.notifications);

        if (meRes.user.assignedLocationId && locRes.locations.length > 0) {
          const userLoc = locRes.locations.find(l => l._id === meRes.user.assignedLocationId);
          if (userLoc) setSelectedLocation(userLoc);
        }
      }
    } catch (err) {
      console.error('Failed to initialize portal data:', err);
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    initData();
  }, []);

  const handleSelectLocation = (loc: LocationItem) => {
    setSelectedLocation(loc);
    setLocations(prev => {
      if (!prev.some(l => l._id === loc._id)) {
        return [...prev, loc];
      }
      return prev;
    });
  };

  const handleSwitchUser = async (userId: string | null) => {
    if (!userId) {
      setCurrentUserHeader('');
      setCurrentUser(null);
      setNotifications([]);
      setActiveTab('landing');
      return;
    }

    setCurrentUserHeader(userId);
    try {
      const meRes = await api.getMe();
      setCurrentUser(meRes.user);
      const notifRes = await api.getNotifications();
      setNotifications(notifRes.notifications);

      if (meRes.user?.assignedLocationId && locations.length > 0) {
        const userLoc = locations.find(l => l._id === meRes.user.assignedLocationId);
        if (userLoc) setSelectedLocation(userLoc);
      }

      if (meRes.user?.role === 'fisher') {
        setActiveTab('fisher-dashboard');
      } else if (meRes.user?.role === 'buyer') {
        setActiveTab('buyer-dashboard');
      } else if (meRes.user?.role === 'admin') {
        setActiveTab('admin-dashboard');
      }
    } catch (err) {
      console.error('Failed to switch user:', err);
    }
  };

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setActiveTab('auth');
  };

  const handleMarkNotifRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  if (loadingInitial || !selectedLocation) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 font-sans transition-colors">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Loading Fisher Market & Safety Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white dark:selection:bg-teal-500 dark:selection:text-white transition-colors">
      {/* Navigation Header */}
      <Navbar
        currentLocation={selectedLocation}
        locations={locations}
        onSelectLocation={handleSelectLocation}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        onOpenAuth={handleOpenAuth}
        notifications={notifications}
        onOpenNotifications={() => setNotifDrawerOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'landing' && (
          <LandingPage
            locations={locations}
            selectedLocation={selectedLocation}
            onSelectLocation={handleSelectLocation}
            onNavigateTab={setActiveTab}
            featuredListings={featuredListings}
            marketPrices={marketPrices}
            activeAlerts={activeAlerts}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {activeTab === 'location-overview' && (
          <LocationOverviewPage
            location={selectedLocation}
            locations={locations}
            onSelectLocation={handleSelectLocation}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'weather' && (
          <WeatherSeaPage
            location={selectedLocation}
            locations={locations}
            onSelectLocation={handleSelectLocation}
          />
        )}

        {activeTab === 'prices' && (
          <PriceDashboardPage
            locations={locations}
            speciesList={speciesList}
            selectedLocation={selectedLocation}
          />
        )}

        {activeTab === 'marketplace' && (
          <MarketplacePage
            locations={locations}
            speciesList={speciesList}
            currentUser={currentUser}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {activeTab === 'fisher-dashboard' && currentUser?.role === 'fisher' && (
          <FisherDashboard
            currentUser={currentUser}
            locations={locations}
            speciesList={speciesList}
          />
        )}

        {activeTab === 'buyer-dashboard' && currentUser?.role === 'buyer' && (
          <BuyerDashboard
            currentUser={currentUser}
            locations={locations}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'admin-dashboard' && currentUser?.role === 'admin' && (
          <AdminDashboard
            locations={locations}
            speciesList={speciesList}
            onRefreshAll={initData}
          />
        )}

        {activeTab === 'auth' && (
          <AuthPage
            locations={locations}
            initialMode={authMode}
            onSuccess={(user) => {
              setCurrentUser(user);
              if (user.role === 'fisher') setActiveTab('fisher-dashboard');
              else if (user.role === 'buyer') setActiveTab('buyer-dashboard');
              else if (user.role === 'admin') setActiveTab('admin-dashboard');
              else setActiveTab('location-overview');
            }}
            onNavigateTab={setActiveTab}
            onSwitchUser={handleSwitchUser}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 text-slate-600 dark:text-slate-400 text-xs transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200">Fisher Community Market Access & Weather Safety Portal</span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Phase 1 Information Access & Market Connection Platform</p>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 text-right">
            <span>External Data Sources: Open-Meteo Marine API & Tomorrow.io</span>
            <p className="mt-0.5">Weather & marine information is for guidance only.</p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
        locations={locations}
        onSuccess={(user) => {
          setCurrentUser(user);
          if (user.role === 'fisher') setActiveTab('fisher-dashboard');
          else if (user.role === 'buyer') setActiveTab('buyer-dashboard');
        }}
      />

      {/* Notifications Drawer */}
      <NotificationsDrawer
        isOpen={notifDrawerOpen}
        onClose={() => setNotifDrawerOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkNotifRead}
      />
    </div>
  );
}

