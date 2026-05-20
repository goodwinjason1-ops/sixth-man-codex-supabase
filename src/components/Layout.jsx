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
  User,
  HelpCircle,
  ClipboardList
} from 'lucide-react';
import FirstTimeHint from './tutorial/FirstTimeHint';
import { HEADER_LOGO_SRC } from '../lib/publicAssets';

const Layout = ({ children }) => {
  const { userProfile, currentUser, signOut } = useAuth();
  const { isOnline, pendingSync, notifications } = useData();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const unreadNotifications = notifications?.filter(n =>
    !n.readBy?.includes(currentUser?.uid) &&
    !n.deletedBy?.includes(currentUser?.uid) &&
    n.status === 'sent'
  ).length || 0;

  const navigationItems = [
    { icon: Home, label: 'Home', path: '/welcome', roles: ['player', 'coach', 'admin', 'president', 'vice_president', 'girls_coordinator', 'boys_coordinator', 'youth_head_coach', 'youth_coach', 'parent', 'team_manager'] },
    { icon: BarChart3, label: 'Dashboard', path: '/dashboard', roles: ['player', 'coach', 'admin', 'president', 'vice_president', 'girls_coordinator', 'boys_coordinator', 'youth_head_coach', 'youth_coach', 'team_manager'] },
    { icon: Users, label: 'Coach Portal', path: '/coach', roles: ['coach'] },
    { icon: ClipboardList, label: 'Playboard', path: '/coach/playboard', roles: ['coach', 'admin', 'president', 'vice_president', 'coach_coordinator'] },
    { icon: Settings, label: 'Admin Portal', path: '/admin', roles: ['admin', 'president', 'vice_president'] },
    { icon: User, label: 'My Profile', path: '/player', roles: ['player'] },
  ];

  const visibleNavItems = navigationItems.filter(item =>
    item.roles.includes(userProfile?.role)
  );

  return (
    <div className="min-h-screen bg-[#F5F9F5]">
      {/* Top Navigation Bar — stays dark */}
      <nav className="bg-[#005028] border-b border-[#003018] sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left Section */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-white/10 text-white"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <div className="flex items-center gap-2">
                <img
                  src={HEADER_LOGO_SRC}
                  alt="Emerald Lakers"
                  className="max-h-[40px] w-auto object-contain"
                />
                <div className="hidden md:block">
                  <h1 className="font-bold text-white">Emerald Lakers</h1>
                  <p className="text-xs text-green-300">Basketball Club</p>
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              {/* Online/Offline Status */}
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-green-400/30 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-green-300 text-xs font-medium">Online</span>
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

              {/* Help */}
              <FirstTimeHint hintKey="help-icon">
                <button
                  onClick={() => navigate('/help')}
                  className="p-2 rounded-lg hover:bg-white/10 text-green-300 hover:text-white"
                  title="Help Center"
                >
                  <HelpCircle className="w-5 h-5" />
                </button>
              </FirstTimeHint>

              {/* Notifications */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg hover:bg-white/10"
              >
                <Bell className="w-5 h-5 text-white" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </button>

              {/* User Menu */}
              <div className="flex items-center gap-2 pl-3 border-l border-white/20">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-white">{userProfile?.displayName}</p>
                  <p className="text-xs text-green-300 capitalize">{(userProfile?.role || '').replace('_', ' ')}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-lg hover:bg-white/10 text-green-300 hover:text-white"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar for Mobile — stays dark */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)}>
          <div className="bg-[#005028] border-r border-[#003018] w-64 h-full p-4" onClick={(e) => e.stopPropagation()}>
            <nav className="space-y-2">
              {visibleNavItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 text-green-200 hover:text-white transition-colors"
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Notifications Dropdown — light theme */}
      {showNotifications && (
        <div className="fixed top-16 right-4 w-80 max-h-96 bg-white border border-[#D4E4D4] rounded-lg shadow-xl overflow-hidden z-50">
          <div className="p-4 border-b border-[#D4E4D4]">
            <h3 className="font-bold text-gray-800">Notifications</h3>
          </div>
          <div className="overflow-y-auto max-h-80">
            {notifications && notifications.length > 0 ? (
              notifications.slice(0, 10).map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${!notif.read ? 'bg-[#F5F9F5]' : ''}`}
                >
                  <p className="font-semibold text-sm text-gray-800">{notif.title}</p>
                  <p className="text-sm text-gray-500 mt-1">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(notif.date).toLocaleDateString('en-AU')}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-400">
                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No notifications</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="pb-20 lg:pb-0">
        {children}
      </main>
    </div>
  );
};

export default Layout;
