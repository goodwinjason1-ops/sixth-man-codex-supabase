import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
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
  ClipboardCheck
} from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { players, evaluations, teams } = useData();

  // Calculate club-wide statistics
  const clubStats = useMemo(() => {
    const totalPlayers = players?.length || 0;
    const totalTeams = teams?.length || [...new Set(players.map(p => p.team))].filter(Boolean).length;
    const totalEvaluations = Object.keys(evaluations || {}).length;

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
      id: 'tryouts',
      title: 'Tryout Evaluations',
      description: 'Run tryout sessions and evaluate players',
      icon: ClipboardCheck,
      path: '/admin/tryouts',
      color: 'from-violet-500 to-violet-600'
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
      id: 'sample-data',
      title: 'Sample Data Tools',
      description: 'Create and manage test data',
      icon: Database,
      path: '/admin/sample-data',
      color: 'from-emerald-500 to-emerald-600'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a3d2e]">
      {/* Header */}
      <div className="bg-[#0d5943] border-b border-[#1a8a68]/30">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Breadcrumb
            path={[
              { label: 'Home', url: '/welcome' },
              { label: 'Admin Dashboard' }
            ]}
            className="mb-3"
          />
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-sm text-white/60 mt-1">Emerald Lakers Club Management</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Club Analytics Overview Card */}
        <div className="bg-gradient-to-br from-[#0d5943] to-[#1a8a68] rounded-2xl p-6 mb-6 border border-[#22c55e]/20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Club Overview</h2>
              <p className="text-white/60 text-sm">Real-time club statistics</p>
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
            <OverviewStat
              icon={Percent}
              label="Assessment Rate"
              value={`${clubStats.assessmentRate}%`}
              color="text-pink-400"
            />
            <OverviewStat
              icon={Award}
              label="Avg Skill Level"
              value={clubStats.clubAvgLevel}
              subtext="out of 5"
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
        <div className="bg-[#0d5943] rounded-xl border border-[#1a8a68]/30 p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Calendar size={18} className="text-[#4ade80]" />
              Scoring Roster
            </h3>
            <button
              onClick={() => navigate('/admin/notifications')}
              className="text-sm text-[#4ade80] hover:text-white flex items-center gap-1"
            >
              Manage <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-xs text-white/60">Unassigned</p>
            </div>
            <div className="bg-yellow-500/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-yellow-400">0</p>
              <p className="text-xs text-white/60">Pending</p>
            </div>
            <div className="bg-blue-500/10 rounded-lg p-3 text-center cursor-pointer hover:bg-blue-500/20" onClick={() => navigate('/admin/notifications')}>
              <p className="text-2xl font-bold text-blue-400 flex items-center justify-center gap-1">
                0
                <ArrowRightLeft size={14} />
              </p>
              <p className="text-xs text-white/60">Swap Requests</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/admin/notifications')}
            className="w-full mt-4 py-2 bg-[#22c55e]/20 text-[#4ade80] rounded-lg text-sm font-medium hover:bg-[#22c55e]/30 transition-colors flex items-center justify-center gap-2"
          >
            <Bell size={14} />
            Send Scoring Notifications
          </button>
        </div>

        {/* Navigation Tiles */}
        <h2 className="text-lg font-bold text-white mb-4">Management Tools</h2>
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
          <h2 className="text-lg font-bold text-white mb-4">Recent Activity</h2>
          <div className="bg-[#0d5943] rounded-xl border border-[#1a8a68]/30 p-6">
            <div className="space-y-4">
              <ActivityItem
                type="assessment"
                message="12 new skill assessments completed"
                time="Today"
              />
              <ActivityItem
                type="player"
                message="3 new players added to U14 Boys"
                time="Yesterday"
              />
              <ActivityItem
                type="game"
                message="U12 Girls vs Hills Hawks scheduled"
                time="2 days ago"
              />
              <ActivityItem
                type="report"
                message="Monthly progress report generated"
                time="1 week ago"
              />
            </div>
            <button
              onClick={() => navigate('/admin/analytics')}
              className="w-full mt-4 py-2 text-center text-white/60 hover:text-white text-sm font-medium transition-colors"
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
  <div className="bg-white/5 rounded-xl p-4">
    <div className="flex items-center gap-2 mb-2">
      <Icon className={color} size={18} />
      <span className="text-white/60 text-xs">{label}</span>
    </div>
    <p className="text-2xl font-bold text-white">{value}</p>
    {subtext && <p className="text-xs text-white/40 mt-1">{subtext}</p>}
  </div>
);

// Quick Action Button
const QuickAction = ({ icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-3 p-4 bg-[#0d5943] hover:bg-[#1a8a68] border border-[#1a8a68]/30 rounded-xl transition-colors"
  >
    <div className="w-10 h-10 bg-[#22c55e]/20 rounded-lg flex items-center justify-center">
      <Icon className="text-[#4ade80]" size={20} />
    </div>
    <span className="text-white font-medium text-sm">{label}</span>
  </button>
);

// Navigation Tile Component
const NavigationTile = ({ title, description, icon: Icon, color, onClick }) => (
  <button
    onClick={onClick}
    className="group flex items-start gap-4 p-5 bg-[#0d5943] hover:bg-[#0d5943]/80 border border-[#1a8a68]/30 hover:border-[#22c55e]/50 rounded-xl transition-all text-left"
  >
    <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
      <Icon className="text-white" size={24} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white group-hover:text-[#4ade80] transition-colors">{title}</h3>
        <ChevronRight className="text-white/30 group-hover:text-[#4ade80] transition-colors" size={18} />
      </div>
      <p className="text-sm text-white/60 mt-1">{description}</p>
    </div>
  </button>
);

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
      <div className="w-10 h-10 bg-[#22c55e]/10 rounded-full flex items-center justify-center flex-shrink-0">
        <Icon className="text-[#4ade80]" size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm">{message}</p>
        <p className="text-white/40 text-xs">{time}</p>
      </div>
    </div>
  );
};

export default AdminDashboard;
