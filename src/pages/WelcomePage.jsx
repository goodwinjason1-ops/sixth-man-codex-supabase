import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { collection, getDocs, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useGameDayDetection, formatGameForDisplay } from '../hooks/useGameDayDetection';
import { getAssessorSessions } from '../services/tryoutService';
import { getScoutAssignedGames } from '../services/scoutService';
import ConnectionStatus from '../components/ConnectionStatus';
import { ADMIN_ROLES, ROLE_LABELS, ROLE_BADGE_STYLES } from '../constants/roles';
import { LOGIN_DRAGON_SRC, LOGIN_LOGO_SRC } from '../lib/publicAssets';
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
  ChevronRight,
  HelpCircle,
  ShieldCheck,
  BookOpen,
  Eye,
  Phone,
  MessageSquare,
  Send
} from 'lucide-react';

const WelcomePage = () => {
  const navigate = useNavigate();
  const { userProfile, currentUser, signOut, refreshUserProfile, loading: authLoading, isCoach, isAdmin } = useAuth();
  const { notifications, loading: dataLoading } = useData();

  // Game Day Detection for coaches
  const { isGameDay, todaysGames, primaryGame, hasMultipleGames, loading: gameDayLoading, dataReady } = useGameDayDetection();
  const [gameDayBannerDismissed, setGameDayBannerDismissed] = useState(false);
  const [hasAutoRedirected, setHasAutoRedirected] = useState(false);

  // Check if user is assigned as a tryout assessor or game scout (any role)
  const [assignedTryoutCount, setAssignedTryoutCount] = useState(0);
  const [assignedScoutCount, setAssignedScoutCount] = useState(0);
  useEffect(() => {
    if (!currentUser || !userProfile) return;
    const email = userProfile?.email || currentUser?.email;

    // Check tryout assignments (skip for dedicated tryout_assessor role — they auto-redirect)
    if (userProfile.role !== 'tryout_assessor') {
      getAssessorSessions(currentUser.uid, email).then(result => {
        if (result.success) {
          setAssignedTryoutCount(result.data.filter(s => s.status === 'active').length);
        }
      });
    }

    // Check scout assignments
    getScoutAssignedGames(currentUser.uid, email).then(result => {
      if (result.success) {
        setAssignedScoutCount(result.data.length);
      }
    });
  }, [currentUser, userProfile]);

  // Unread notifications count — computed from real Firestore data
  const unreadCount = useMemo(() => {
    if (!notifications || !currentUser) return 0;
    return notifications.filter(n =>
      !n.readBy?.includes(currentUser.uid) &&
      !n.deletedBy?.includes(currentUser.uid) &&
      n.status === 'sent'
    ).length;
  }, [notifications, currentUser]);

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

      // Auto-navigate to Match Day Assessment with game data1
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

  // Redirect tryout assessors to their restricted dashboard
  useEffect(() => {
    if (userProfile?.role === 'tryout_assessor') {
      navigate('/assessor', { replace: true });
    }
  }, [userProfile?.role, navigate]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Pending approval — registration form or waiting screen
  if (userProfile?.role === 'pending') {
    if (userProfile?.needsRegistration) {
      return (
        <CompleteRegistrationForm
          userProfile={userProfile}
          currentUser={currentUser}
          onComplete={async (data) => {
            try {
              await updateDoc(doc(db, 'users', currentUser.uid), {
                displayName: data.displayName,
                requestedRole: data.requestedRole,
                requestedTeam: data.requestedTeam,
                phone: data.phone || '',
                registrationNote: data.registrationNote || '',
                needsRegistration: false,
              });
              // Send updated notification for admins with full registration details
              try {
                const roleName = data.requestedRole ? (ROLE_LABELS[data.requestedRole] || data.requestedRole) : 'unspecified';
                await addDoc(collection(db, 'notifications'), {
                  title: 'New User Registration Complete',
                  message: `${data.displayName} completed registration — requested role: ${roleName}${data.requestedTeam && data.requestedTeam !== 'Not sure' ? `, team: ${data.requestedTeam}` : ''}.`,
                  type: 'pending_user',
                  targetRoles: ['admin', 'president', 'vice_president'],
                  status: 'sent',
                  readBy: [],
                  deletedBy: [],
                  metadata: { pendingUid: currentUser.uid, email: currentUser.email, requestedRole: data.requestedRole },
                  createdAt: serverTimestamp(),
                  date: new Date().toISOString()
                });
              } catch (_) {
                // Don't block registration if notification fails
              }
              await refreshUserProfile();
            } catch (err) {
              console.error('Registration update failed:', err);
            }
          }}
          onSignOut={handleLogout}
        />
      );
    }

    return (
      <div className="min-h-screen bg-[#F5F9F5] flex flex-col items-center justify-center px-4">
        <img src={LOGIN_LOGO_SRC} alt="Emerald Lakers" className="max-h-[80px] w-auto object-contain mb-6" />
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center border border-[#D4E4D4] shadow-lg">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Account Pending Approval</h2>
          <p className="text-sm text-[#6B7C6B] mb-6">
            Your account has been created and is awaiting approval from a club administrator.
            You'll receive access once your role has been assigned.
          </p>
          <div className="bg-[#F5F9F5] rounded-xl p-4 border border-[#D4E4D4] mb-6">
            <p className="text-xs text-[#6B7C6B] mb-1">Signed in as</p>
            <p className="text-sm font-medium text-gray-800">{userProfile?.displayName || currentUser?.email}</p>
            <p className="text-xs text-[#6B7C6B]">{currentUser?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-white border border-[#D4E4D4] rounded-xl text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    );
  }

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

  // Dynamic navigation tiles based on user role
  const navigationTiles = useMemo(() => {
    const role = userProfile?.role;

    // Admin-specific tiles (no coach features like Match Day)
    if (ADMIN_ROLES.includes(role)) {
      return [
        {
          id: 'assessments-hub',
          title: 'Assessments & Selection',
          icon: ClipboardCheck,
          path: '/admin/assessments-hub',
          description: 'Match, training & team selection',
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
          id: 'analytics-hub',
          title: 'Analytics & Reports',
          icon: BarChart3,
          path: '/admin/analytics-hub',
          description: 'Club analytics & age groups'
        },
        {
          id: 'schedule',
          title: 'Schedule',
          icon: Calendar,
          path: '/admin/schedule',
          description: 'Games and training'
        },
        {
          id: 'players',
          title: 'Player Database',
          icon: ClipboardList,
          path: '/admin/rosters',
          description: 'Manage all players'
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
          id: 'drill-library',
          title: 'Drill Library',
          icon: BookOpen,
          path: '/drills',
          description: 'Browse and create drills'
        },
        {
          id: 'training-plans',
          title: 'Training Plans',
          icon: Dumbbell,
          path: '/coach/training-plans',
          description: 'Create and manage plans'
        },
        {
          id: 'record-training',
          title: 'Record Training',
          icon: ClipboardCheck,
          path: '/coach/training-history',
          description: 'Log attendance & notes'
        },
        {
          id: 'schedule',
          title: 'My Schedule',
          icon: Calendar,
          path: '/coach/schedule',
          description: 'Games and training'
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
          path: '/manager/team',
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
          id: 'scoring',
          title: 'Scoring Roster',
          icon: ClipboardList,
          description: 'Manage scoring duties',
          path: '/manager/scoring'
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

    // Tryout Assessor - redirect handled by useEffect
    if (role === 'tryout_assessor') {
      return [];
    }

    // Girls/Boys Coordinator tiles
    if (role === 'girls_coordinator' || role === 'boys_coordinator') {
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
          title: 'Dashboard',
          icon: LayoutDashboard,
          path: '/dashboard',
          description: 'Admin dashboard'
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

    // Youth Head Coach tiles
    if (role === 'youth_head_coach') {
      return [
        {
          id: 'tryout-results',
          title: 'Tryout Results',
          icon: ClipboardCheck,
          path: '/admin/tryouts',
          description: 'View tryout evaluations'
        },
        {
          id: 'youth-programs',
          title: 'Youth Programs',
          icon: Award,
          path: '/admin/youth-programs',
          description: 'Little Lakers & Lakers Ready'
        },
        {
          id: 'dashboard',
          title: 'Dashboard',
          icon: LayoutDashboard,
          path: '/dashboard',
          description: 'Admin dashboard'
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

    // Youth Coach tiles
    if (role === 'youth_coach') {
      return [
        {
          id: 'youth-programs',
          title: 'Youth Programs',
          icon: Award,
          path: '/admin/youth-programs',
          description: 'Little Lakers & Lakers Ready'
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

    // Parent tiles
    if (role === 'parent') {
      return [
        {
          id: 'dashboard',
          title: 'Parent Dashboard',
          icon: LayoutDashboard,
          path: '/dashboard',
          description: 'Your child\'s progress'
        },
        {
          id: 'schedule',
          title: 'Schedule',
          icon: Calendar,
          path: '/parent/schedule',
          description: 'Games and training'
        },
        {
          id: 'skills',
          title: 'Skills Progress',
          icon: Award,
          path: '/skills-passport',
          description: 'Track development'
        },
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
          title: 'Team Info',
          icon: Users,
          path: '/parent/team',
          description: 'Team roster and info'
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

  // Inject tryout assessment + scouting tiles if user has active assignments
  const tilesWithTryoutAssignment = useMemo(() => {
    const injected = [];
    if (assignedTryoutCount > 0 && userProfile?.role !== 'tryout_assessor') {
      injected.push({
        id: 'tryout-assessment',
        title: 'Tryout Assessment',
        icon: ClipboardCheck,
        path: '/assessor',
        description: `${assignedTryoutCount} active session${assignedTryoutCount > 1 ? 's' : ''}`,
        highlight: true
      });
    }
    if (assignedScoutCount > 0) {
      injected.push({
        id: 'scout-games',
        title: 'Game Scouting',
        icon: Eye,
        path: '/scout-dashboard',
        description: `${assignedScoutCount} game${assignedScoutCount > 1 ? 's' : ''} to scout`,
        highlight: true
      });
    }
    if (injected.length === 0) return navigationTiles;
    return [...injected, ...navigationTiles];
  }, [navigationTiles, assignedTryoutCount, assignedScoutCount, userProfile?.role]);

  const handleTileClick = (path) => {
    navigate(path);
  };

  // Show loading state while waiting for essential data
  if (authLoading || (isCoach && !dataReady)) {
    return (
      <div className="min-h-screen bg-[#F5F9F5] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D4E4D4] border-t-[#00A651] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-800 font-medium">Loading...</p>
          <p className="text-[#00A651] text-sm mt-1">
            {authLoading ? 'Checking authentication...' :
             isCoach && !dataReady ? 'Checking for games today...' : ''}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F9F5]">
      {/* Header with Logo and Club Name */}
      <header className="pt-8 pb-6 px-4 relative">
        {/* Connection Status */}
        <div className="absolute top-4 left-4">
          <ConnectionStatus />
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 bg-transparent border border-[#D4E4D4] rounded-lg text-gray-800 text-sm hover:bg-gray-100 hover:border-[#00A651] transition-all duration-200 active:scale-95"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>

        <div className="flex flex-col items-center justify-center">
          {/* Club Logo */}
          <img
            src={LOGIN_LOGO_SRC}
            alt="Emerald Lakers"
            className="max-h-[80px] w-auto object-contain mb-2 drop-shadow-md"
          />

          {/* Dragon Mascot */}
          <img
            src={LOGIN_DRAGON_SRC}
            alt="Lakers Dragon"
            className="max-h-[60px] w-auto object-contain my-2"
          />

          {/* Subtitle */}
          <p className="text-[#00A651] text-sm tracking-wide">Basketball Club</p>

          {/* Welcome Message */}
          {userProfile?.displayName && (
            <div className="mt-4 text-center">
              <p className="text-gray-800 text-lg opacity-90">
                Welcome, {userProfile.displayName}!
              </p>
              {userProfile.role && (
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                  ROLE_BADGE_STYLES[userProfile.role] || 'bg-blue-500/20 text-blue-300 border border-blue-500'
                }`}>
                  {ROLE_LABELS[userProfile.role] || 'Member'}
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
              className="bg-gradient-to-r from-[#00A651]/30 to-[#00A651]/20 border-2 border-[#00A651] rounded-xl p-4 cursor-pointer hover:border-[#00A651] transition-all relative overflow-hidden"
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
                <div className="w-14 h-14 bg-[#005028] rounded-xl flex items-center justify-center shadow-lg shadow-[#00A651]/30 flex-shrink-0">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[#00A651] text-xs font-bold uppercase tracking-wider">🏀 Game Day!</span>
                  </div>
                  <h3 className="text-gray-800 font-bold text-base truncate">
                    {primaryGame.teamName} vs {primaryGame.opponent}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-[#00A651] mt-1">
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
                <ChevronRight className="w-6 h-6 text-[#00A651] flex-shrink-0" />
              </div>

              {hasMultipleGames && (
                <div className="relative z-10 mt-2 pt-2 border-t border-[#00A651]/30">
                  <p className="text-xs text-[#00A651]/80">
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
            {tilesWithTryoutAssignment.map((tile) => {
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
                      <span className="text-gray-800 font-bold text-base">{tile.title}</span>
                      <p className="text-violet-500 text-xs mt-0.5">{tile.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-violet-500 flex-shrink-0" />
                  </button>
                );
              }

              return (
                <button
                  key={tile.id}
                  onClick={() => handleTileClick(tile.path)}
                  className="bg-white border-2 border-[#D4E4D4] rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:bg-[#E8F0E8] hover:border-[#00A651] hover:scale-105 hover:shadow-lg hover:ring-2 hover:ring-[#FFD700]/30 active:scale-95 relative"
                >
                  {/* Notification Badge */}
                  {tile.badge > 0 && (
                    <div className="absolute top-3 right-3 min-w-[20px] h-5 bg-red-500 rounded-full flex items-center justify-center px-1.5">
                      <span className="text-white text-xs font-bold">{tile.badge > 9 ? '9+' : tile.badge}</span>
                    </div>
                  )}
                  <div className="w-14 h-14 bg-[#F5F9F5] border border-[#D4E4D4] rounded-xl flex items-center justify-center">
                    <IconComponent className="w-7 h-7 text-[#005028]" />
                  </div>
                  <span className="text-gray-800 font-medium text-sm text-center leading-tight">
                    {tile.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* Help Link */}
      <div className="px-4 pb-6">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => navigate('/help')}
            className="w-full flex items-center justify-center gap-2 py-3 text-[#00A651]/60 hover:text-[#00A651] text-sm transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            Help Center
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 py-4 text-center">
        <p className="text-[#6B7C6B] text-xs">Sixth Man Basketball</p>
      </footer>
    </div>
  );
};

// ─── Complete Registration Form (shown to new pending users) ───
const REQUESTED_ROLE_OPTIONS = [
  { value: '', label: 'Select a role...' },
  { value: 'coach', label: 'Coach' },
  { value: 'parent', label: 'Parent' },
  { value: 'team_manager', label: 'Team Manager' },
  { value: 'tryout_assessor', label: 'Volunteer / Assessor' },
];

const FALLBACK_TEAMS = [
  { id: 'fb_u8', name: 'Lakers U8' },
  { id: 'fb_u10', name: 'Lakers U10' },
  { id: 'fb_u12', name: 'Lakers U12' },
  { id: 'fb_u14g', name: 'Lakers U14 Girls' },
  { id: 'fb_u16', name: 'Lakers U16' },
  { id: 'fb_u19', name: 'Lakers U19' },
];

const CompleteRegistrationForm = ({ userProfile, currentUser, onComplete, onSignOut }) => {
  const [displayName, setDisplayName] = useState(userProfile?.displayName || currentUser?.displayName || '');
  const [requestedRole, setRequestedRole] = useState('');
  const [requestedTeam, setRequestedTeam] = useState('');
  const [phone, setPhone] = useState('');
  const [registrationNote, setRegistrationNote] = useState('');
  const [teams, setTeams] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fetch teams for dropdown
  useEffect(() => {
    getDocs(collection(db, 'teams')).then(snap => {
      const t = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      t.sort((a, b) => (a.name || a.teamName || '').localeCompare(b.name || b.teamName || ''));
      setTeams(t.length > 0 ? t : FALLBACK_TEAMS);
    }).catch(() => {
      setTeams(FALLBACK_TEAMS);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) { setError('Please enter your name.'); return; }
    if (!requestedRole) { setError('Please select a preferred role.'); return; }
    setError('');
    setSaving(true);
    await onComplete({
      displayName: displayName.trim(),
      requestedRole,
      requestedTeam: requestedTeam || 'Not sure',
      phone: phone.trim(),
      registrationNote: registrationNote.trim(),
    });
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F9F5] flex flex-col items-center justify-center px-4 py-8">
      <img src={LOGIN_LOGO_SRC} alt="Emerald Lakers" className="max-h-[80px] w-auto object-contain mb-6" />
      <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full border border-[#D4E4D4] shadow-lg">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-[#005028]/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <ClipboardCheck className="w-7 h-7 text-[#005028]" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Complete Your Registration</h2>
          <p className="text-sm text-[#6B7C6B] mt-1">Help us set up your account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Full Name <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 text-sm focus:border-[#00A651] focus:outline-none"
                placeholder="Your full name"
                required
                maxLength={100}
              />
            </div>
          </div>

          {/* Preferred Role */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Preferred Role <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={requestedRole}
                onChange={e => setRequestedRole(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 text-sm focus:border-[#00A651] focus:outline-none appearance-none"
                required
              >
                {REQUESTED_ROLE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Team Name */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Team</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={requestedTeam}
                onChange={e => setRequestedTeam(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 text-sm focus:border-[#00A651] focus:outline-none appearance-none"
              >
                <option value="">Not sure</option>
                {teams.map(t => (
                  <option key={t.id} value={t.name || t.teamName}>{t.name || t.teamName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Phone Number <span className="text-[#6B7C6B] font-normal">(optional)</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 text-sm focus:border-[#00A651] focus:outline-none"
                placeholder="0400 000 000"
                maxLength={20}
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Tell us about your involvement <span className="text-[#6B7C6B] font-normal">(optional)</span>
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <textarea
                value={registrationNote}
                onChange={e => setRegistrationNote(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 text-sm focus:border-[#00A651] focus:outline-none resize-none"
                placeholder="e.g. I'm the new U10 assistant coach"
                rows={2}
                maxLength={300}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving || !displayName.trim() || !requestedRole}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#005028] text-white rounded-xl text-sm font-medium hover:bg-[#00A651] transition-colors disabled:opacity-50"
          >
            {saving ? (
              <><Loader2 size={16} className="animate-spin" /> Submitting...</>
            ) : (
              <><Send size={16} /> Complete Registration</>
            )}
          </button>

          <button
            type="button"
            onClick={onSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-500 text-sm hover:text-gray-700 transition-colors"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
};

export default WelcomePage;
