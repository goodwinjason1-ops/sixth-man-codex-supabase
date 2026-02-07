import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  Home,
  Users,
  BarChart3,
  Settings,
  LogOut,
  WifiOff,
  Wifi,
  Bell,
  User
} from 'lucide-react';

const Layout = ({ children }) => {
  const { userProfile, signOut } = useAuth();
  const { isOnline, pendingSync, notifications } = useData();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const unreadNotifications = notifications?.filter(n => !n.read).length || 0;

  const navigationItems = [
    { icon: Home, label: 'Home', path: '/welcome', roles: ['player', 'coach', 'admin', 'parent', 'team_manager', 'committee_member'] },
    { icon: BarChart3, label: 'Dashboard', path: '/dashboard', roles: ['player', 'coach', 'admin', 'team_manager', 'committee_member'] },
    { icon: Users, label: 'Coach Portal', path: '/coach', roles: ['coach'] },
    { icon: Settings, label: 'Admin Portal', path: '/admin', roles: ['admin'] },
    { icon: User, label: 'My Profile', path: '/player', roles: ['player'] },
  ];

  const visibleNavItems = navigationItems.filter(item =>
    item.roles.includes(userProfile?.role)
  );

  return (
    <div className="min-h-screen bg-lakers-900">
      {/* Top Navigation Bar */}
      <nav className="bg-lakers-800 border-b border-lakers-700 sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left Section */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-lakers-700 text-white"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-lakers-700 border border-lakers-600 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-white">L</span>
                </div>
                <div className="hidden md:block">
                  <h1 className="font-bold text-white">Emerald Lakers</h1>
                  <p className="text-xs text-lakers-300">Basketball Club</p>
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              {/* Online/Offline Status */}
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-[#065f46] border border-[#22c55e] rounded-full">
                    <div className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />
                    <span className="text-[#4ade80] text-xs font-medium">Online</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-900/50 border border-red-500 rounded-full">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-red-400 text-xs font-medium">Offline</span>
                    </div>
                    {pendingSync > 0 && (
                      <span className="bg-yellow-900/50 border border-yellow-600 text-yellow-400 text-xs px-2 py-1 rounded-full font-semibold">
                        {pendingSync} pending
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Notifications */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg hover:bg-lakers-700"
              >
                <Bell className="w-5 h-5 text-white" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-lakers-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </button>

              {/* User Menu */}
              <div className="flex items-center gap-2 pl-3 border-l border-lakers-700">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-white">{userProfile?.displayName}</p>
                  <p className="text-xs text-lakers-300 capitalize">{(userProfile?.role || '').replace('_', ' ')}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-lg hover:bg-lakers-700 text-lakers-300 hover:text-white"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar for Mobile */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)}>
          <div className="bg-lakers-800 border-r border-lakers-700 w-64 h-full p-4" onClick={(e) => e.stopPropagation()}>
            <nav className="space-y-2">
              {visibleNavItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-lakers-700 text-lakers-200 hover:text-white transition-colors"
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="fixed top-16 right-4 w-80 max-h-96 bg-lakers-800 border border-lakers-700 rounded-lg shadow-2xl overflow-hidden z-50">
          <div className="p-4 border-b border-lakers-700">
            <h3 className="font-bold text-white">Notifications</h3>
          </div>
          <div className="overflow-y-auto max-h-80">
            {notifications && notifications.length > 0 ? (
              notifications.slice(0, 10).map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 border-b border-lakers-700 hover:bg-lakers-700 ${!notif.read ? 'bg-lakers-700/50' : ''}`}
                >
                  <p className="font-semibold text-sm text-white">{notif.title}</p>
                  <p className="text-sm text-lakers-300 mt-1">{notif.message}</p>
                  <p className="text-xs text-lakers-400 mt-2">
                    {new Date(notif.date).toLocaleDateString('en-AU')}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-lakers-400">
                <Bell className="w-12 h-12 mx-auto mb-2 text-lakers-600" />
                <p className="text-sm">No notifications</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  );
};

export default Layout;
