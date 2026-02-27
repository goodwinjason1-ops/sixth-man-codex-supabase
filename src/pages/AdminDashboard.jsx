import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useData } from '../contexts/DataContext';
import { fetchRecentActivity, ACTION_TYPES } from '../services/auditService';
import {
  Users,
  Shield,
  TrendingUp,
  Calendar,
  BarChart3,
  GraduationCap,
  BookOpen,
  Star,
  ClipboardList,
  Link2,
  Search,
  Settings,
  FileText,
  ChevronRight,
  ArrowUpRight,
  Award,
  Target,
  Activity,
  Percent,
  Bell,
  Dumbbell,
  Trophy,
  ArrowRightLeft,
  AlertCircle,
  Database,
  ClipboardCheck,
  UserPlus,
  ShieldCheck
} from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import HelpTooltip from '../components/tutorial/HelpTooltip';
import TutorialPromptCard from '../components/tutorial/TutorialPromptCard';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { players, evaluations, teams, games } = useData();
  const [recentActivity, setRecentActivity] = useState([]);
  const [scoringCounts, setScoringCounts] = useState({ unassigned: 0, pending: 0, swapRequests: 0 });

  // Calculate club-wide statistics
  const clubStats = useMemo(() => {
    const totalPlayers = players?.length || 0;
    const totalTeams = teams?.length || [...new Set(players.map(p => p.team))].filter(Boolean).length;
    const totalEvaluations = new Set(Object.values(evaluations || {}).map(e => e.id)).size;

    // Calculate players assessed in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentlyAssessed = new Set();
    Object.values(evaluations || {}).forEach(e => {
      if (new Date(e.date || e.createdAt) > thirtyDaysAgo) {
        recentlyAssessed.add(e.playerId);
      }
    });

    const assessmentRate = totalPlayers > 0
      ? Math.round((recentlyAssessed.size / totalPlayers) * 100)
      : 0;

    // Calculate average skill level
    const playerLevels = {};
    Object.values(evaluations || {}).forEach(e => {
      if (!playerLevels[e.playerId]) {
        playerLevels[e.playerId] = [];
      }
      if (e.level) {
        playerLevels[e.playerId].push(e.level);
      }
    });

    const avgLevels = Object.values(playerLevels).map(levels =>
      levels.reduce((a, b) => a + b, 0) / levels.length
    );
    const clubAvgLevel = avgLevels.length > 0
      ? (avgLevels.reduce((a, b) => a + b, 0) / avgLevels.length).toFixed(1)
      : 0;

    return {
      totalPlayers,
      totalTeams,
      totalEvaluations,
      assessmentRate,
      recentlyAssessed: recentlyAssessed.size,
      clubAvgLevel
    };
  }, [players, evaluations, teams]);

  // Fetch recent activity
  useEffect(() => {
    fetchRecentActivity(4).then(setRecentActivity);
  }, []);

  // Subscribe to scoring roster data
  useEffect(() => {
    // Subscribe to scoring_assignments
    const assignQ = query(collection(db, 'scoring_assignments'));
    const unsubAssign = onSnapshot(assignQ, (snap) => {
      const assignments = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const pendingCount = assignments.filter(a => a.status === 'pending').length;

      // Count unassigned = upcoming games (from games collection) with no assignment
      const now = new Date();
      const assignedGameIds = new Set(assignments.map(a => a.gameId));
      const upcomingGames = (games || []).filter(ev => {
        const evType = (ev.type || '').toLowerCase();
        if (evType && evType !== 'game') return false;
        const d = ev.date?.toDate ? ev.date.toDate() : new Date(ev.date);
        return d && !isNaN(d.getTime()) && d >= now;
      });
      const unassignedCount = upcomingGames.filter(g => !assignedGameIds.has(g.id)).length;

      setScoringCounts(prev => ({ ...prev, pending: pendingCount, unassigned: unassignedCount }));
    }, (err) => console.error('scoring_assignments error:', err));

    // Subscribe to pending swap_requests
    const swapQ = query(collection(db, 'swap_requests'), where('status', '==', 'pending'));
    const unsubSwap = onSnapshot(swapQ, (snap) => {
      setScoringCounts(prev => ({ ...prev, swapRequests: snap.size }));
    }, (err) => console.error('swap_requests error:', err));

    return () => { unsubAssign(); unsubSwap(); };
  }, [games]);

  // Navigation tiles configuration
  const navigationTiles = [
    {
      id: 'analytics',
      title: 'Club Analytics',
      description: 'Club-wide performance metrics and trends',
      icon: BarChart3,
      path: '/admin/analytics',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'age-groups',
      title: 'Age Group Reports',
      description: 'Performance breakdown by age group',
      icon: Users,
      path: '/admin/age-groups',
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'coaching',
      title: 'Coaching Effectiveness',
      description: 'Coach performance and training analysis',
      icon: GraduationCap,
      path: '/admin/coaching',
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'curriculum',
      title: 'Curriculum Analysis',
      description: 'Skills progression and development gaps',
      icon: BookOpen,
      path: '/admin/curriculum',
      color: 'from-orange-500 to-orange-600'
    },
    {
      id: 'training-plans',
      title: 'Training Plans Library',
      description: 'Review and approve coach training plans',
      icon: Dumbbell,
      path: '/admin/training-plans',
      color: 'from-lime-500 to-lime-600'
    },
    {
      id: 'rep-prospects',
      title: 'Rep Team Prospects',
      description: 'Identify standout players for rep teams',
      icon: Star,
      path: '/admin/rep-prospects',
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      id: 'youth-programs',
      title: 'Youth Programs',
      description: 'Little Lakers (4-5) & Lakers Ready (6-7)',
      icon: Star,
      path: '/admin/youth-programs',
      color: 'from-yellow-400 to-orange-500'
    },
    {
      id: 'tryouts',
      title: 'Tryout Evaluations',
      description: 'Run tryout sessions and evaluate players',
      icon: ClipboardCheck,
      path: '/admin/tryouts',
      color: 'from-violet-500 to-violet-600'
    },
    {
      id: 'parent-invitations',
      title: 'Parent Invitations',
      description: 'Invite parents and manage access codes',
      icon: UserPlus,
      path: '/admin/parent-invitations',
      color: 'from-sky-500 to-sky-600'
    },
    {
      id: 'user-management',
      title: 'User Management',
      description: 'Create, edit, and manage user accounts',
      icon: UserPlus,
      path: '/admin/users',
      color: 'from-indigo-500 to-purple-600'
    },
    {
      id: 'team-management',
      title: 'Team Management',
      description: 'Create teams, assign coaches and manage rosters',
      icon: Shield,
      path: '/admin/teams',
      color: 'from-teal-500 to-cyan-600'
    },
    {
      id: 'rosters',
      title: 'Roster Management',
      description: 'Manage players, teams, and assignments',
      icon: ClipboardList,
      path: '/admin/rosters',
      color: 'from-teal-500 to-teal-600'
    },
    {
      id: 'schedule',
      title: 'Schedule Management',
      description: 'Games, training sessions, and events',
      icon: Calendar,
      path: '/admin/schedule',
      color: 'from-pink-500 to-pink-600'
    },
    {
      id: 'game-results',
      title: 'Game Results',
      description: 'View scores and team performance',
      icon: Trophy,
      path: '/admin/game-results',
      color: 'from-amber-500 to-amber-600'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Send announcements and reminders',
      icon: Bell,
      path: '/admin/notifications',
      color: 'from-amber-500 to-amber-600'
    },
    {
      id: 'playerhq',
      title: 'PlayerHQ Integration',
      description: 'Basketball Victoria data sync',
      icon: Link2,
      path: '/admin/playerhq',
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      id: 'data-explorer',
      title: 'Data Explorer',
      description: 'Advanced data queries and analysis',
      icon: Search,
      path: '/admin/data-explorer',
      color: 'from-cyan-500 to-cyan-600'
    },
    {
      id: 'activity-log',
      title: 'Activity Log',
      description: 'Audit trail of all user actions',
      icon: Activity,
      path: '/admin/activity',
      color: 'from-slate-500 to-slate-600'
    },
    {
      id: 'assessment-metrics',
      title: 'Assessment Metrics',
      description: 'Configure match assessment criteria by age group',
      icon: Target,
      path: '/admin/assessment-metrics',
      color: 'from-cyan-500 to-teal-600'
    },
    {
      id: 'system',
      title: 'System Management',
      description: 'Benchmarks, settings, and configuration',
      icon: Settings,
      path: '/admin/system',
      color: 'from-gray-500 to-gray-600'
    },
    {
      id: 'reports',
      title: 'Reports & Export',
      description: 'Generate and export club reports',
      icon: FileText,
      path: '/admin/reports',
      color: 'from-red-500 to-red-600'
    },
    {
      id: 'data-cleanup',
      title: 'Data Cleanup',
      description: 'Fix duplicates and broken user documents',
      icon: AlertCircle,
      path: '/admin/data-cleanup',
      color: 'from-rose-500 to-rose-600'
    },
    {
      id: 'coach-compliance',
      title: 'Coach Compliance',
      description: 'Accreditation tracking & expiry alerts',
      icon: ShieldCheck,
      path: '/admin/coach-compliance',
      color: 'from-emerald-500 to-green-600'
    },
    {
      id: 'sample-data',
      title: 'Sample Data Tools',
      description: 'Create and manage test data',
      icon: Database,
      path: '/admin/sample-data',
      color: 'from-emerald-500 to-emerald-600'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F5F9F5]">
      {/* Header */}
      <div className="bg-white border-b border-[#D4E4D4]/30">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Breadcrumb
            path={[
              { label: 'Home', url: '/welcome' },
              { label: 'Admin Dashboard' }
            ]}
            className="mb-3"
          />
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Emerald Lakers Club Management</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tutorial prompt for first-time admins */}
        <TutorialPromptCard tutorialId="admin" />

        {/* Club Analytics Overview Card */}
        <div className="bg-gradient-to-br from-[#005028] to-[#003018] rounded-2xl p-6 mb-6 border border-[#00A651]/20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <HelpTooltip text="Live statistics pulled from all club data. Updates automatically as new data comes in.">
                <h2 className="text-xl font-bold text-white">Club Overview</h2>
              </HelpTooltip>
              <p className="text-green-300 text-sm">Real-time club statistics</p>
            </div>
            <button
              onClick={() => navigate('/admin/analytics')}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-colors"
            >
              View Details
              <ArrowUpRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <OverviewStat
              icon={Users}
              label="Total Players"
              value={clubStats.totalPlayers}
              color="text-blue-400"
            />
            <OverviewStat
              icon={Shield}
              label="Teams"
              value={clubStats.totalTeams}
              color="text-purple-400"
            />
            <OverviewStat
              icon={Target}
              label="Assessments"
              value={clubStats.totalEvaluations}
              color="text-green-400"
            />
            <OverviewStat
              icon={Activity}
              label="Recently Assessed"
              value={clubStats.recentlyAssessed}
              subtext="last 30 days"
              color="text-yellow-400"
            />
            <HelpTooltip text="Percentage of players who have been assessed in the last 30 days. Aim for 80%+ coverage.">
              <OverviewStat
                icon={Percent}
                label="Assessment Rate"
                value={`${clubStats.assessmentRate}%`}
                color="text-pink-400"
              />
            </HelpTooltip>
            <OverviewStat
              icon={Award}
              label="Avg Skill Level"
              value={clubStats.clubAvgLevel}
              subtext="out of 4"
              color="text-orange-400"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <QuickAction
            icon={Users}
            label="Add Player"
            onClick={() => navigate('/admin/rosters')}
          />
          <QuickAction
            icon={Calendar}
            label="Add Game"
            onClick={() => navigate('/admin/schedule')}
          />
          <QuickAction
            icon={FileText}
            label="Generate Report"
            onClick={() => navigate('/admin/reports')}
          />
          <QuickAction
            icon={Settings}
            label="Edit Benchmarks"
            onClick={() => navigate('/admin/benchmarks')}
          />
        </div>

        {/* Scoring Roster Quick View */}
        <div className="bg-white rounded-xl border border-[#D4E4D4]/30 p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Calendar size={18} className="text-[#00A651]" />
              Scoring Roster
            </h3>
            <button
              onClick={() => navigate('/admin/notifications')}
              className="text-sm text-[#00A651] hover:text-gray-800 flex items-center gap-1"
            >
              Manage <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-100 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-800">{scoringCounts.unassigned}</p>
              <p className="text-xs text-gray-500">Unassigned</p>
            </div>
            <div className="bg-yellow-500/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-yellow-600">{scoringCounts.pending}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
            <div className="bg-blue-500/10 rounded-lg p-3 text-center cursor-pointer hover:bg-blue-500/20" onClick={() => navigate('/admin/notifications')}>
              <p className="text-2xl font-bold text-blue-600 flex items-center justify-center gap-1">
                {scoringCounts.swapRequests}
                <ArrowRightLeft size={14} />
              </p>
              <p className="text-xs text-gray-500">Swap Requests</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/admin/notifications')}
            className="w-full mt-4 py-2 bg-[#005028]/20 text-[#00A651] rounded-lg text-sm font-medium hover:bg-[#00A651]/30 transition-colors flex items-center justify-center gap-2"
          >
            <Bell size={14} />
            Send Scoring Notifications
          </button>
        </div>

        {/* Navigation Tiles */}
        <h2 className="text-lg font-bold text-gray-800 mb-4">Management Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {navigationTiles.map(tile => (
            <NavigationTile
              key={tile.id}
              title={tile.title}
              description={tile.description}
              icon={tile.icon}
              color={tile.color}
              onClick={() => navigate(tile.path)}
            />
          ))}
        </div>

        {/* Recent Activity Section */}
        <div className="mt-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h2>
          <div className="bg-white rounded-xl border border-[#D4E4D4]/30 p-6">
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map(log => {
                  const actionDef = ACTION_TYPES[log.action];
                  const type = actionDef?.category || 'default';
                  const timeStr = log.createdAt
                    ? formatActivityTime(log.createdAt)
                    : '';
                  return (
                    <ActivityItem
                      key={log.id}
                      type={type}
                      message={log.description}
                      time={timeStr}
                    />
                  );
                })
              ) : (
                <>
                  <ActivityItem type="default" message="No recent activity recorded" time="" />
                </>
              )}
            </div>
            <button
              onClick={() => navigate('/admin/activity')}
              className="w-full mt-4 py-2 text-center text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors"
            >
              View All Activity →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Overview Stat Component
const OverviewStat = ({ icon: Icon, label, value, subtext, color }) => (
  <div className="bg-white/10 rounded-xl p-4">
    <div className="flex items-center gap-2 mb-2">
      <Icon className={color} size={18} />
      <span className="text-green-200 text-xs">{label}</span>
    </div>
    <p className="text-2xl font-bold text-white">{value}</p>
    {subtext && <p className="text-xs text-green-300 mt-1">{subtext}</p>}
  </div>
);

// Quick Action Button
const QuickAction = ({ icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-3 p-4 bg-white hover:bg-gray-100 border border-[#D4E4D4]/30 rounded-xl transition-colors"
  >
    <div className="w-10 h-10 bg-[#005028]/20 rounded-lg flex items-center justify-center">
      <Icon className="text-[#00A651]" size={20} />
    </div>
    <span className="text-gray-800 font-medium text-sm">{label}</span>
  </button>
);

// Navigation Tile Component
const NavigationTile = ({ title, description, icon: Icon, color, onClick }) => (
  <button
    onClick={onClick}
    className="group flex items-start gap-4 p-5 bg-white hover:bg-gray-50/80 border border-[#D4E4D4]/30 hover:border-[#00A651]/50 hover:ring-2 hover:ring-[#FFD700]/20 rounded-xl transition-all text-left"
  >
    <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
      <Icon className="text-white" size={24} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800 group-hover:text-[#00A651] transition-colors">{title}</h3>
        <ChevronRight className="text-gray-800/30 group-hover:text-[#00A651] transition-colors" size={18} />
      </div>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </div>
  </button>
);

// Format activity time as relative string
const formatActivityTime = (date) => {
  if (!date) return '';
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
};

// Activity Item Component
const ActivityItem = ({ type, message, time }) => {
  const getIcon = () => {
    switch (type) {
      case 'assessment': return Target;
      case 'player': return Users;
      case 'game': return Calendar;
      case 'report': return FileText;
      default: return Activity;
    }
  };

  const Icon = getIcon();

  return (
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-[#005028]/10 rounded-full flex items-center justify-center flex-shrink-0">
        <Icon className="text-[#00A651]" size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-gray-800 text-sm">{message}</p>
        <p className="text-gray-400 text-xs">{time}</p>
      </div>
    </div>
  );
};

export default AdminDashboard;
