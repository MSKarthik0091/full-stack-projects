import { useState, useEffect } from 'react';
import { User, AppNotification } from '../types.ts';
import { api } from '../api.ts';
import { 
  TreePine, 
  Search, 
  Bell, 
  ShieldAlert, 
  User as UserIcon, 
  MapPin, 
  Compass, 
  CheckCheck, 
  ExternalLink,
  Menu,
  X,
  LogOut
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  onNavigateHome: () => void;
  onNavigatePlatformAdmin: () => void;
  onOpenProfile: () => void;
  onOpenRequestCommunity: () => void;
  onLogout?: () => void;
  currentView: 'home' | 'community' | 'platformAdmin';
  activeCommunityName?: string;
  onSelectCommunityById?: (id: string) => void;
}

export function Navbar({
  currentUser,
  onNavigateHome,
  onNavigatePlatformAdmin,
  onOpenProfile,
  onOpenRequestCommunity,
  onLogout,
  currentView,
  activeCommunityName,
  onSelectCommunityById
}: NavbarProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (currentUser) {
      loadNotifications();
      const interval = setInterval(() => {
        if (isMounted) loadNotifications();
      }, 12000);
      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    }
  }, [currentUser?._id]);

  const loadNotifications = async () => {
    if (!currentUser) return;
    try {
      const data = await api.getNotifications();
      if (data && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
        setUnreadCount(typeof data.unreadCount === 'number' ? data.unreadCount : 0);
      }
    } catch (e) {
      // Silently handle any initial connect/network delay
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleNotifClick = async (notif: AppNotification) => {
    try {
      if (!notif.isRead) {
        await api.markNotificationRead(notif._id);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
      }
      if (notif.type === 'role_offer' || notif.referenceType === 'role_offer' || notif.type === 'admin_invitation' || notif.referenceType === 'invitation') {
        setShowNotifs(false);
        onOpenProfile();
      } else if (notif.referenceType === 'community' && notif.referenceId && onSelectCommunityById) {
        onSelectCommunityById(notif.referenceId);
        setShowNotifs(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header id="main-navbar" className="bg-[#183120] text-[#FAF8F3] sticky top-0 z-40 shadow-md border-b border-[#2A7B5F]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <button
              id="brand-logo-btn"
              onClick={onNavigateHome}
              className="flex items-center gap-2.5 group text-left focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2A7B5F] via-[#C85A32] to-[#183120] p-0.5 border border-[#E8A227]/60 shadow-inner group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-[#183120] rounded-[10px] flex items-center justify-center">
                  <TreePine className="w-5 h-5 text-[#E8A227] group-hover:text-white transition-colors" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-lg tracking-tight text-white font-sans">
                    Hometown Hub
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#C85A32] text-white">
                    Hyperlocal
                  </span>
                </div>
                <p className="text-[11px] text-[#FAF8F3]/70 -mt-0.5 hidden sm:block font-medium">
                  Verified Local Communities & Belonging
                </p>
              </div>
            </button>

            {/* Breadcrumb if inside a community */}
            {activeCommunityName && currentView === 'community' && (
              <div className="hidden md:flex items-center gap-2 text-xs text-[#FAF8F3]/90 border-l border-[#2A7B5F]/50 pl-4">
                <MapPin className="w-3.5 h-3.5 text-[#E8A227]" />
                <span className="font-bold text-white px-2 py-0.5 rounded bg-[#2A7B5F]/40 border border-[#E8A227]/30">{activeCommunityName}</span>
              </div>
            )}
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden lg:flex items-center gap-2">
            <button
              id="nav-explore-btn"
              onClick={onNavigateHome}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                currentView === 'home'
                  ? 'bg-[#2A7B5F] text-white shadow-sm font-bold border border-[#E8A227]/40'
                  : 'text-[#FAF8F3]/80 hover:bg-[#2A7B5F]/40 hover:text-white'
              }`}
            >
              <Compass className="w-4 h-4 text-[#E8A227]" />
              <span>Explore Localities</span>
            </button>

            <button
              id="nav-request-community-btn"
              onClick={onOpenRequestCommunity}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-bold bg-[#C85A32] hover:bg-[#b34c28] text-white shadow-sm transition border border-[#E8A227]/30"
            >
              <span>+ Propose Locality</span>
            </button>

            {currentUser?.platformRole === 'platformAdmin' && (
              <button
                id="nav-platform-admin-btn"
                onClick={onNavigatePlatformAdmin}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-bold transition border border-[#E8A227] ${
                  currentView === 'platformAdmin'
                    ? 'bg-[#E8A227] text-[#183120] shadow-sm'
                    : 'bg-[#E8A227]/20 text-[#E8A227] hover:bg-[#E8A227]/30'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Platform Admin Hub</span>
              </button>
            )}
          </nav>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-3">
            
            {/* Notification Bell */}
            <div className="relative">
              <button
                id="notifications-bell-btn"
                onClick={() => setShowNotifs(!showNotifs)}
                className="p-2.5 rounded-full hover:bg-[#2A7B5F]/50 text-[#FAF8F3] transition relative"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-[#FAF8F3]" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#E8A227] text-[#183120] text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse border border-[#183120]">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {showNotifs && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
                  <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#FAF8F3] text-[#1D2A24] rounded-xl shadow-2xl border border-[#2A7B5F]/30 z-50 overflow-hidden animate-in fade-in zoom-in-95">
                    <div className="p-3 bg-[#183120] text-[#FAF8F3] flex items-center justify-between border-b border-[#2A7B5F]/40">
                      <div className="flex items-center gap-2 font-semibold text-sm">
                        <Bell className="w-4 h-4 text-[#E8A227]" />
                        <span>Notifications ({unreadCount} unread)</span>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] text-[#E8A227] hover:underline flex items-center gap-1 font-semibold"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Mark all read</span>
                        </button>
                      )}
                    </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-[#2D6A4F]/10">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-[#1F2D24]/60">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n._id}
                          onClick={() => handleNotifClick(n)}
                          className={`p-3 text-xs transition cursor-pointer flex gap-3 ${
                            n.isRead ? 'bg-[#FAF8F3] hover:bg-[#EAF4EC]/50' : 'bg-[#EAF4EC] hover:bg-[#EAF4EC]/90 font-medium'
                          }`}
                        >
                          <div className="pt-0.5">
                            <span className={`w-2 h-2 rounded-full block ${n.isRead ? 'bg-transparent' : 'bg-[#E9A019]'}`} />
                          </div>
                          <div className="space-y-1 flex-1">
                            <p className="font-semibold text-[#183120]">{n.title}</p>
                            <p className="text-[#1F2D24]/80 text-[11px] leading-relaxed">{n.message}</p>
                            <span className="text-[10px] text-[#1F2D24]/50 block">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
            </div>

            {/* Profile Avatar Button */}
            {currentUser && (
              <button
                id="user-profile-menu-btn"
                onClick={onOpenProfile}
                className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-[#2D6A4F]/40 hover:bg-[#2D6A4F] text-[#FAF8F3] border border-[#2D6A4F] transition"
              >
                {currentUser.profilePhoto ? (
                  <img
                    src={currentUser.profilePhoto}
                    alt={currentUser.firstName}
                    className="w-7 h-7 rounded-full object-cover border border-white/40"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#2D6A4F] flex items-center justify-center text-xs font-bold">
                    {currentUser.firstName[0]}
                  </div>
                )}
                <span className="text-xs font-medium hidden sm:inline text-white">
                  {currentUser.firstName}
                </span>
              </button>
            )}

            {/* Logout / Switch Account Button */}
            {onLogout && (
              <button
                id="navbar-logout-btn"
                onClick={onLogout}
                title="Log out and switch account"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2D6A4F]/30 hover:bg-red-900/60 text-[#FAF8F3]/90 hover:text-white border border-[#2D6A4F]/50 transition text-xs font-medium cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Log Out</span>
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg lg:hidden hover:bg-[#2D6A4F]/40 text-[#FAF8F3]"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-[#2D6A4F]/40 space-y-2">
            <button
              onClick={() => { onNavigateHome(); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-[#2D6A4F] text-white flex items-center gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>Explore Localities</span>
            </button>
            <button
              onClick={() => { onOpenRequestCommunity(); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-[#2D6A4F] text-white"
            >
              + Propose Locality
            </button>
            {currentUser?.platformRole === 'platformAdmin' && (
              <button
                onClick={() => { onNavigatePlatformAdmin(); setMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-md text-sm bg-[#E9A019] text-[#183120] font-bold"
              >
                Platform Admin Hub
              </button>
            )}
            {onLogout && (
              <button
                onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-md text-sm bg-red-900/40 hover:bg-red-800 text-white font-medium flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out / Switch Persona</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
