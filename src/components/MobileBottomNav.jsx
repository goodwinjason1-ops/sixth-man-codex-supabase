import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Home,
  BarChart3,
  Users,
  Activity,
  Bell,
  ClipboardList,
  Gamepad2,
  Dumbbell,
  Lightbulb,
  Calendar,
} from 'lucide-react';

const roleNavItems = {
  admin: [
    { icon: Home, label: 'Home', path: '/welcome' },
    { icon: BarChart3, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Rosters', path: '/admin/rosters' },
    { icon: Activity, label: 'Analytics', path: '/admin/analytics' },
    { icon: Bell, label: 'Alerts', path: '/notifications' },
  ],
  president: [
    { icon: Home, label: 'Home', path: '/welcome' },
    { icon: BarChart3, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Rosters', path: '/admin/rosters' },
    { icon: Activity, label: 'Analytics', path: '/admin/analytics' },
    { icon: Bell, label: 'Alerts', path: '/notifications' },
  ],
  vice_president: [
    { icon: Home, label: 'Home', path: '/welcome' },
    { icon: BarChart3, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Rosters', path: '/admin/rosters' },
    { icon: Activity, label: 'Analytics', path: '/admin/analytics' },
    { icon: Bell, label: 'Alerts', path: '/notifications' },
  ],
  girls_coordinator: [
    { icon: Home, label: 'Home', path: '/welcome' },
    { icon: BarChart3, label: 'Dashboard', path: '/dashboard' },
    { icon: ClipboardList, label: 'Tryouts', path: '/admin/tryouts' },
    { icon: Bell, label: 'Alerts', path: '/notifications' },
  ],
  boys_coordinator: [
    { icon: Home, label: 'Home', path: '/welcome' },
    { icon: BarChart3, label: 'Dashboard', path: '/dashboard' },
    { icon: ClipboardList, label: 'Tryouts', path: '/admin/tryouts' },
    { icon: Bell, label: 'Alerts', path: '/notifications' },
  ],
  youth_head_coach: [
    { icon: Home, label: 'Home', path: '/welcome' },
    { icon: BarChart3, label: 'Dashboard', path: '/dashboard' },
    { icon: ClipboardList, label: 'Tryouts', path: '/admin/tryouts' },
    { icon: Bell, label: 'Alerts', path: '/notifications' },
  ],
  youth_coach: [
    { icon: Home, label: 'Home', path: '/welcome' },
    { icon: BarChart3, label: 'Dashboard', path: '/dashboard' },
    { icon: Bell, label: 'Alerts', path: '/notifications' },
  ],
  coach: [
    { icon: Home, label: 'Home', path: '/welcome' },
    { icon: BarChart3, label: 'Dashboard', path: '/dashboard' },
    { icon: ClipboardList, label: 'Assess', path: '/coach-assessment' },
    { icon: Gamepad2, label: 'Match Day', path: '/coach/match-assessment' },
    { icon: Dumbbell, label: 'Plans', path: '/coach/training-plans' },
  ],
  team_manager: [
    { icon: Home, label: 'Home', path: '/welcome' },
    { icon: Calendar, label: 'Schedule', path: '/dashboard' },
    { icon: Users, label: 'Players', path: '/team' },
    { icon: Bell, label: 'Alerts', path: '/notifications' },
  ],
  parent: [
    { icon: Home, label: 'Home', path: '/welcome' },
    { icon: BarChart3, label: 'Dashboard', path: '/dashboard' },
    { icon: Lightbulb, label: 'Skills', path: '/skills-passport' },
    { icon: Bell, label: 'Alerts', path: '/notifications' },
  ],
  default: [
    { icon: Home, label: 'Home', path: '/welcome' },
    { icon: BarChart3, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Team', path: '/team' },
    { icon: Lightbulb, label: 'Skills', path: '/skills-passport' },
    { icon: Bell, label: 'Alerts', path: '/notifications' },
  ],
};

const MobileBottomNav = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Don't render if not authenticated
  if (!currentUser) return null;

  // Don't render on login or tryout assessor pages (has custom bottom bar)
  if (
    location.pathname === '/login' ||
    location.pathname === '/assessor' ||
    location.pathname.startsWith('/tryout/') ||
    location.pathname.startsWith('/signup/')
  ) {
    return null;
  }

  // Hide nav for assessors (they have their own restricted interface)
  if (userProfile?.role === 'tryout_assessor') {
    return null;
  }

  const role = userProfile?.role || 'default';
  const items = roleNavItems[role] || roleNavItems.default;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#D4E4D4] shadow-lg lg:hidden safe-area-pb">
      <div className="flex items-center justify-around px-1">
        {items.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/welcome' &&
              item.path !== '/dashboard' &&
              location.pathname.startsWith(item.path));

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] py-2 px-1 flex-1 transition-colors ${
                isActive ? 'text-[#005028] font-bold' : 'text-gray-400'
              }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-medium leading-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
