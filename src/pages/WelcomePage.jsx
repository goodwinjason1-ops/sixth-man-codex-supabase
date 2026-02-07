import React, { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useGameDayDetection, formatGameForDisplay } from '../hooks/useGameDayDetection';
import ConnectionStatus from '../components/ConnectionStatus';
import {
  User,
  Users,
  Dumbbell,
  LayoutDashboard,
  Award,
  Bell,
  LogOut,
  ClipboardCheck,
  ClipboardList,
  Trophy,
  Loader2,
  Shield,
  BarChart3,
  Calendar,
  FileText,
  Settings,
  Zap,
  MapPin,
  Clock,
  ChevronRight
} from 'lucide-react';

const WelcomePage = () => {
  const navigate = useNavigate();
  const { userProfile, signOut, loading: authLoading, isCoach, isAdmin } = useAuth();
  const { loading: dataLoading } = useData();

  // Game Day Detection for coaches
  const { isGameDay, todaysGames, primaryGame, hasMultipleGames, loading: gameDayLoading, dataReady } = useGameDayDetection();
  const [gameDayBannerDismissed, setGameDayBannerDismissed] = useState(false);
  const [hasAutoRedirected, setHasAutoRedirected] = useState(false);

  // Unread notifications count (in real app, this would come from context or Firestore)
  const [unreadCount, setUnreadCount] = useState(3);

  // Game Day auto-redirect
  useEffect(() => {
    if (!dataReady || gameDayLoading) {
      return;
    }

    // Auto-redirect coaches on game day (only once per session)
    const hasSeenGameDayToday = sessionStorage.getItem('gameDayRedirectShown');

    if (isCoach && isGameDay && primaryGame && !hasSeenGameDayToday && !hasAutoRedirected) {
      setHasAutoRedirected(true);
      sessionStorage.setItem('gameDayRedirectShown', 'true');

      // Auto-navigate to Match Day Assessment with game data
      const gameData = formatGameForDisplay(primaryGame);
      navigate('/coach/match-assessment', {
        state: {
          isGameDay: true,
          gameData,
          allTodaysGames: todaysGames.map(formatGameForDisplay)
        }
      });
    }
  }, [dataReady, gameDayLoading, isGameDay, todaysGames, primaryGame, isCoach, navigate, hasAutoRedirected]);

  // Handle Game Day banner click
  const handleGameDayClick = () => {
    const gameData = formatGameForDisplay(primaryGame);
    navigate('/coach/match-assessment', {
      state: {
        isGameDay: true,
        gameData,
        allTodaysGames: todaysGames.map(formatGameForDisplay)
      }
    });
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Dynamic navigation tiles based on user role
  const navigationTiles = useMemo(() => {
    const role = userProfile?.role;

    // Admin-specific tiles (no coach features like Match Day)
    if (role === 'admin') {
      return [
        {
          id: 'tryouts',
          title: 'Tryout Evaluations',
          icon: ClipboardCheck,
          path: '/admin/tryouts',
          description: 'Manage tryout sessions',
          highlight: true
        },
        {
          id: 'dashboard',
          title: 'Admin Dashboard',
          icon: LayoutDashboard,
          path: '/admin',
          description: 'Full admin controls'
        },
        {
          id: 'analytics',
          title: 'Club Analytics',
          icon: BarChart3,
          path: '/admin/analytics',
          description: 'Club-wide statistics'
        },
        {
          id: 'age-groups',
          title: 'Age Groups',
          icon: Users,
          path: '/admin/age-groups',
          description: 'Age group overview'
        },
        {
          id: 'players',
          title: 'Player Database',
          icon: ClipboardList,
          path: '/admin/rosters',
          description: 'Manage all players'
        },
        {
          id: 'schedule',
          title: 'Schedule',
          icon: Calendar,
          path: '/admin/schedule',
          description: 'Games and training'
        },
        {
          id: 'reports',
          title: 'Reports',
          icon: FileText,
          path: '/admin/reports',
          description: 'Generate reports'
        },
        {
          id: 'notifications',
          title: 'Notifications',
          icon: Bell,
          path: '/admin/notifications',
          description: 'Send club messages',
          badge: unreadCount
        },
        {
          id: 'youth-programs',
          title: 'Youth Programs',
          icon: Award,
          path: '/admin/youth-programs',
          description: 'Little Lakers & Lakers Ready'
        },
        {
          id: 'profile',
          title: 'Admin Profile',
          icon: Shield,
          path: '/admin/profile',
          description: 'Your admin account'
        }
      ];
    }

    // Coach-specific tiles (includes Match Day, player overview)
    if (role === 'coach') {
      const coachTiles = [
        {
          id: 'dashboard',
          title: 'Coach Dashboard',
          icon: LayoutDashboard,
          path: '/dashboard',
          description: 'Your coaching hub'
        },
        {
          id: 'match-day',
          title: 'Match Day',
          icon: Trophy,
          path: '/coach/match-assessment',
          description: 'Game day assessments'
        },
        {
          id: 'assess-skills',
          title: 'Assess Skills',
          icon: ClipboardCheck,
          path: '/coach-assessment',
          description: 'Player skill assessments'
        },
        {
          id: 'player-overview',
          title: 'My Players',
          icon: ClipboardList,
          path: '/coach/players',
          description: 'View and assess all players'
        },
        {
          id: 'training-plans',
          title: 'Training Plans',
          icon: Dumbbell,
          path: '/coach/training-plans',
          description: 'Create and manage plans'
        },
        {
          id: 'profile',
          title: 'My Profile',
          icon: User,
          path: '/coach/profile',
          description: 'View your coach profile'
        },
        {
          id: 'notifications',
          title: 'Notifications',
          icon: Bell,
          path: '/notifications',
          description: 'Club notifications',
          badge: unreadCount
        }
      ];
      return coachTiles;
    }

    // Team Manager tiles
    if (role === 'team_manager') {
      return [
        {
          id: 'team',
          title: 'My Team',
          icon: Users,
          path: '/team',
          description: 'Team roster and info'
        },
        {
          id: 'dashboard',
          title: 'Dashboard',
          icon: LayoutDashboard,
          path: '/dashboard',
          description: 'Your dashboard'
        },
        {
          id: 'notifications',
          title: 'Notifications',
          icon: Bell,
          path: '/notifications',
          description: 'Club notifications',
          badge: unreadCount
        }
      ];
    }

    // Committee Member tiles
    if (role === 'committee_member') {
      return [
        {
          id: 'dashboard',
          title: 'Dashboard',
          icon: LayoutDashboard,
          path: '/dashboard',
          description: 'Your dashboard'
        },
        {
          id: 'notifications',
          title: 'Notifications',
          icon: Bell,
          path: '/notifications',
          description: 'Club notifications',
          badge: unreadCount
        }
      ];
    }

    // Parent tiles
    if (role === 'parent') {
      return [
        {
          id: 'notifications',
          title: 'Notifications',
          icon: Bell,
          path: '/notifications',
          description: 'Club notifications',
          badge: unreadCount
        },
        {
          id: 'team',
          title: 'My Team',
          icon: Users,
          path: '/team',
          description: 'Team info'
        }
      ];
    }

    // Player tiles (default)
    return [
      {
        id: 'player',
        title: 'My Player',
        icon: User,
        path: '/player',
        description: 'View your player profile'
      },
      {
        id: 'team',
        title: 'My Team',
        icon: Users,
        path: '/team',
        description: 'Team roster and info'
      },
      {
        id: 'training',
        title: 'My Training Program',
        icon: Dumbbell,
        path: '/training',
        description: 'Training schedules and drills'
      },
      {
        id: 'dashboard',
        title: 'My Dashboard',
        icon: LayoutDashboard,
        path: '/dashboard',
        description: 'Your personalized dashboard'
      },
      {
        id: 'skills-passport',
        title: 'My Skills Passport',
        icon: Award,
        path: '/skills-passport',
        description: 'Track your basketball skills'
      },
      {
        id: 'notifications',
        title: 'Notifications',
        icon: Bell,
        path: '/notifications',
        description: 'Club notifications',
        badge: unreadCount
      }
    ];
  }, [userProfile?.role, unreadCount]);

  const handleTileClick = (path) => {
    navigate(path);
  };

  // Show loading state while waiting for essential data
  if (authLoading || (isCoach && !dataReady)) {
    return (
      <div className="min-h-screen bg-[#0a3d2e] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#1a8a68] border-t-[#22c55e] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white font-medium">Loading...</p>
          <p className="text-[#4ade80] text-sm mt-1">
            {authLoading ? 'Checking authentication...' :
             isCoach && !dataReady ? 'Checking for games today...' : ''}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a3d2e]">
      {/* Header with Logo and Club Name */}
      <header className="pt-8 pb-6 px-4 relative">
        {/* Connection Status */}
        <div className="absolute top-4 left-4">
          <ConnectionStatus />
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 bg-transparent border border-[#1a8a68] rounded-lg text-white text-sm hover:bg-[#1a8a68] hover:border-[#22c55e] transition-all duration-200 active:scale-95"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>

        <div className="flex flex-col items-center justify-center">
          {/* Text Logo */}
          <div className="text-center mb-2">
            <p className="text-white text-lg font-semibold tracking-widest">EMERALD</p>
            <h1 className="text-5xl font-bold text-white tracking-wider leading-tight">LAKERS</h1>
          </div>

          {/* Dragon Mascot Placeholder */}
          <div className="w-20 h-20 bg-[#0d5943] border-2 border-[#1a8a68] rounded-full flex items-center justify-center my-3">
            <span className="text-[#4ade80] text-3xl">🐉</span>
          </div>

          {/* Subtitle */}
          <p className="text-[#4ade80] text-sm tracking-wide">Basketball Club</p>

          {/* Welcome Message */}
          {userProfile?.displayName && (
            <div className="mt-4 text-center">
              <p className="text-white text-lg opacity-90">
                Welcome, {userProfile.displayName}!
              </p>
              {userProfile.role && (
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                  userProfile.role === 'admin'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500'
                    : userProfile.role === 'coach'
                    ? 'bg-[#22c55e]/20 text-[#4ade80] border border-[#22c55e]'
                    : userProfile.role === 'team_manager'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500'
                    : userProfile.role === 'committee_member'
                    ? 'bg-orange-500/20 text-orange-300 border border-orange-500'
                    : userProfile.role === 'parent'
                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500'
                }`}>
                  {{ admin: 'Administrator', coach: 'Coach', player: 'Player',
                     parent: 'Parent', team_manager: 'Team Manager',
                     committee_member: 'Committee Member' }[userProfile.role] || 'Member'}
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Game Day Banner for Coaches */}
      {isCoach && isGameDay && primaryGame && !gameDayBannerDismissed && (
        <div className="px-4 mb-4">
          <div className="max-w-lg mx-auto">
            <div
              onClick={handleGameDayClick}
              className="bg-gradient-to-r from-[#22c55e]/30 to-[#4ade80]/20 border-2 border-[#22c55e] rounded-xl p-4 cursor-pointer hover:border-[#4ade80] transition-all relative overflow-hidden"
            >
              {/* Animated shimmer */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                style={{
                  animation: 'shimmer 2s infinite',
                  backgroundSize: '200% 100%'
                }}
              />
              <style>{`
                @keyframes shimmer {
                  0% { background-position: 200% 0; }
                  100% { background-position: -200% 0; }
                }
              `}</style>

              <div className="relative z-10 flex items-center gap-3">
                <div className="w-14 h-14 bg-[#22c55e] rounded-xl flex items-center justify-center shadow-lg shadow-[#22c55e]/30 flex-shrink-0">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[#4ade80] text-xs font-bold uppercase tracking-wider">🏀 Game Day!</span>
                  </div>
                  <h3 className="text-white font-bold text-base truncate">
                    {primaryGame.teamName} vs {primaryGame.opponent}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-[#4ade80] mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {primaryGame.time}
                    </span>
                    {primaryGame.venue && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3" />
                        {primaryGame.venue}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-[#4ade80] flex-shrink-0" />
              </div>

              {hasMultipleGames && (
                <div className="relative z-10 mt-2 pt-2 border-t border-[#22c55e]/30">
                  <p className="text-xs text-[#4ade80]/80">
                    +{todaysGames.length - 1} more game{todaysGames.length > 2 ? 's' : ''} today
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Grid */}
      <main className="px-4 pb-8">
        <div className="max-w-lg mx-auto">
          <div className="grid grid-cols-2 gap-4">
            {navigationTiles.map((tile) => {
              const IconComponent = tile.icon;

              // Highlighted tile (e.g. Tryout Evaluations - time-critical)
              if (tile.highlight) {
                return (
                  <button
                    key={tile.id}
                    onClick={() => handleTileClick(tile.path)}
                    className="col-span-2 bg-gradient-to-r from-violet-600/30 to-purple-600/30 border-2 border-violet-500 rounded-2xl p-5 flex items-center gap-4 transition-all duration-300 hover:from-violet-600/40 hover:to-purple-600/40 hover:border-violet-400 hover:scale-[1.02] hover:shadow-lg hover:shadow-violet-500/30 active:scale-[0.98] relative overflow-hidden"
                  >
                    <div className="w-14 h-14 bg-violet-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/30">
                      <IconComponent className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-left flex-1">
                      <span className="text-white font-bold text-base">{tile.title}</span>
                      <p className="text-violet-300 text-xs mt-0.5">{tile.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-violet-300 flex-shrink-0" />
                  </button>
                );
              }

              return (
                <button
                  key={tile.id}
                  onClick={() => handleTileClick(tile.path)}
                  className="bg-[#0d5943] border-2 border-[#1a8a68] rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:bg-[#0f6b52] hover:border-[#22c55e] hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/30 active:scale-95 relative"
                >
                  {/* Notification Badge */}
                  {tile.badge > 0 && (
                    <div className="absolute top-3 right-3 min-w-[20px] h-5 bg-red-500 rounded-full flex items-center justify-center px-1.5">
                      <span className="text-white text-xs font-bold">{tile.badge > 9 ? '9+' : tile.badge}</span>
                    </div>
                  )}
                  <div className="w-14 h-14 bg-[#0a3d2e] border border-[#1a8a68] rounded-xl flex items-center justify-center">
                    <IconComponent className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-white font-medium text-sm text-center leading-tight">
                    {tile.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 py-4 text-center">
        <p className="text-lakers-400 text-xs">Sixth Man Basketball</p>
      </footer>
    </div>
  );
};

export default WelcomePage;
