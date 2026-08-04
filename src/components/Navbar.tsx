import React, { useState, useEffect } from "react";
import {
  Building2,
  Home,
  Wrench,
  Calendar,
  Bell,
  Users,
  LogOut,
  UserCheck,
  Menu,
  X,
  User as UserIcon,
  Key,
  KeyRound
} from "lucide-react";
import { User, NotificationItem } from "../types";

interface NavbarProps {
  user: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  notifications: NotificationItem[];
  onMarkNotificationsRead: () => void;
  onChangePasswordClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onLogout,
  notifications,
  onMarkNotificationsRead,
  onChangePasswordClick
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNavItems = () => {
    if (!user) return [];

    const items = [
      { id: "dashboard", label: "Dashboard", icon: Home },
      { id: "properties", label: "Properties", icon: Building2 },
      { id: "amenities", label: "Amenities & Bookings", icon: Calendar },
      { id: "maintenance", label: "Maintenance", icon: Wrench },
      { id: "notifications", label: "Notifications", icon: Bell }
    ];

    if (user.role === "Admin") {
      items.push({ id: "users", label: "User Approvals", icon: Users });
    }

    return items;
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Top Bar */}
      {(showNotificationsMenu || showProfileMenu) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowNotificationsMenu(false);
            setShowProfileMenu(false);
          }}
        />
      )}
      <header className="sticky top-0 z-40 bg-surface border-b border-main shadow-xs px-4 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-main hover:bg-highlight/30 focus:outline-hidden transition-colors"
            title="Toggle Sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab("dashboard")}>
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold shadow-sm">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-main leading-tight">Astral Hills</h1>
              <p className="text-xs text-primary font-medium">Apartment Community</p>
            </div>
          </div>
        </div>

        {user ? (
          <div className="flex items-center space-x-3">
            {/* Greeting */}
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-main">Welcome, {user.name}!</p>
              <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/10 !text-primary">
                {user.role} {user.status === "Moved Out" ? "(Moved Out)" : ""}
              </span>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotificationsMenu(!showNotificationsMenu);
                  setShowProfileMenu(false);
                }}
                className="relative p-2.5 rounded-full hover:bg-highlight/30 text-main transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-[#D9534F] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Panel */}
              {showNotificationsMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface rounded-2xl shadow-xl border border-main p-4 z-50">
                  <div className="flex items-center justify-between pb-3 border-b border-main">
                    <h3 className="font-bold text-main text-sm flex items-center gap-2">
                      <Bell className="w-4 h-4 text-primary" />
                      Notifications ({notifications.length})
                    </h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={onMarkNotificationsRead}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto my-2 divide-y divide-main/30">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-center py-6 text-gray-500">No notifications yet.</p>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 text-xs transition-colors rounded-lg ${
                            n.read ? "bg-transparent opacity-80" : "bg-base font-medium"
                          }`}
                        >
                          <div className="flex justify-between font-semibold text-muted mb-1">
                            <span>{n.title}</span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className="text-main leading-snug">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab("notifications");
                      setShowNotificationsMenu(false);
                    }}
                    className="w-full text-center py-2 text-xs font-bold text-primary hover:bg-highlight/20 rounded-lg transition-colors border-t border-main/30 mt-1"
                  >
                    View All Notifications
                  </button>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotificationsMenu(false);
                }}
                className="w-10 h-10 rounded-full bg-primary/15 border border-primary flex items-center justify-center !text-primary font-bold hover:bg-primary/25 transition-colors"
                title="Profile Settings"
              >
                <UserIcon className="w-5 h-5 !text-primary" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-surface rounded-2xl shadow-xl border border-main p-2 z-50">
                  <div className="p-3 border-b border-main/40">
                    <p className="font-bold text-sm text-main">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      onChangePasswordClick();
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-main hover:bg-highlight/30 rounded-lg flex items-center gap-2 transition-colors mt-1"
                  >
                    <KeyRound className="w-4 h-4 text-primary" />
                    Change Password
                  </button>
                  <button
                    onClick={() => {
                      onLogout();
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-[#D9534F] hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors mt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </header>

      {/* Collapsible Sidebar Overlay & Drawer */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 w-72 bg-surface border-r border-main z-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col justify-between ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 border-b border-main flex items-center justify-between bg-base">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-main text-base">Astral Hills</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg hover:bg-highlight/40 text-main"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                    isActive
                      ? "bg-primary text-white shadow-md shadow-[#A0522D]/20"
                      : "text-main hover:bg-highlight/30"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-primary"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {user && (
          <div className="p-4 border-t border-main bg-base space-y-2">
            <div className="flex items-center justify-between text-xs text-muted font-medium px-2">
              <span>Logged in as</span>
              <span className="font-bold">{user.role}</span>
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-[#D9534F] text-[#D9534F] hover:bg-red-50 text-sm font-bold transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
