import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { subscribeToAuditLogs, ACTION_TYPES } from '../services/auditService';
import {
  User,
  Shield,
  Users,
  UserCheck,
  Settings,
  Database,
  Activity,
  Clock,
  Calendar,
  TrendingUp,
  FileText,
  Bell,
  ChevronRight,
  BarChart3,
  Server,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Link2,
  ClipboardList,
  Award,
  Target
} from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';

// Fallback activity log shown when no real activity data exists
const fallbackActivity = [
  { id: 'fallback-1', type: 'sync', action: 'No recent activity recorded yet', date: new Date().toISOString(), user: 'System' }
];

const AdminProfilePage = () => {
  const navigate = useNavigate();
  const { userProfile, currentUser } = useAuth();
  const { players, evaluations, teams, notifications, isOnline } = useData();
  const [coachCount, setCoachCount] = useState(0);

  // Fetch real coach count from users collection
  useEffect(() => {
    const fetchCoachCount = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'coach'));
        const snapshot = await getDocs(q);
        setCoachCount(snapshot.size);
      } catch (error) {
        console.error('Error fetching coach count:', error);
      }
    };
    fetchCoachCount();
  }, []);

  // Calculate club statistics from real data
  const clubStats = useMemo(() => {
    const totalPlayers = players?.length || 0;
    const uniqueTeams = [...new Set(players?.map(p => p.team))].filter(Boolean);
    const totalTeams = teams?.length || uniqueTeams.length;
    const totalEvaluations = Object.keys(evaluations || {}).length;

    // Calculate active this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const activeThisWeek = Object.values(evaluations || {}).filter(e =>
      new Date(e.date || e.createdAt) > weekAgo
    ).length;

    return {
      totalPlayers,
      totalTeams,
      totalCoaches: coachCount,
      totalEvaluations,
      activeThisWeek
    };
  }, [players, evaluations, teams, coachCount]);

  // Compute system status from real application state
  const systemStatus = useMemo(() => {
    const pendingNotifs = notifications?.filter(n =>
      !n.readBy?.includes(currentUser?.uid) && n.status === 'sent'
    )?.length || 0;
    return {
      database: { status: isOnline ? 'healthy' : 'disconnected', lastSync: isOnline ? 'Live' : 'Offline' },
      playerHQ: { status: 'disconnected', lastSync: 'Not configured' },
      notifications: { status: pendingNotifs > 0 ? 'active' : 'idle', pending: pendingNotifs },
      storage: { used: 0, total: 0, unit: 'GB' }
    };
  }, [notifications, isOnline]);

  // Subscribe to real audit_logs for activity feed
  const [recentActivity, setRecentActivity] = useState(fallbackActivity);
  useEffect(() => {
    const unsub = subscribeToAuditLogs({ limitCount: 8 }, (logs) => {
      if (logs.length === 0) {
        setRecentActivity(fallbackActivity);
        return;
      }
      const mapped = logs.map(log => {
        const actionConfig = ACTION_TYPES[log.action] || {};
        const typeMap = {
          user: 'player',
          team: 'player',
          schedule: 'schedule',
          assessment: 'benchmark',
          settings: 'sync'
        };
        return {
          id: log.id,
          type: typeMap[actionConfig.category] || 'sync',
          action: log.description || actionConfig.label || log.action,
          date: log.createdAt instanceof Date ? log.createdAt.toISOString() : new Date().toISOString(),
          user: log.userName || 'System'
        };
      });
      setRecentActivity(mapped);
    });
    return () => unsub();
  }, []);

  // Quick actions for admin
  const quickActions = [
    { id: 'rosters', label: 'Manage Rosters', icon: ClipboardList, path: '/admin/rosters', color: 'from-blue-500 to-blue-600' },
    { id: 'schedule', label: 'Edit Schedule', icon: Calendar, path: '/admin/schedule', color: 'from-purple-500 to-purple-600' },
    { id: 'notifications', label: 'Send Notification', icon: Bell, path: '/admin/notifications', color: 'from-green-500 to-green-600' },
    { id: 'reports', label: 'Generate Reports', icon: FileText, path: '/admin/reports', color: 'from-orange-500 to-orange-600' },
    { id: 'benchmarks', label: 'Edit Benchmarks', icon: Target, path: '/admin/benchmarks', color: 'from-pink-500 to-pink-600' },
    { id: 'analytics', label: 'View Analytics', icon: BarChart3, path: '/admin/analytics', color: 'from-cyan-500 to-cyan-600' }
  ];

  // Get activity icon
  const getActivityIcon = (type) => {
    const icons = {
      player: <Users className="w-4 h-4 text-blue-400" />,
      notification: <Bell className="w-4 h-4 text-green-400" />,
      report: <FileText className="w-4 h-4 text-orange-400" />,
      schedule: <Calendar className="w-4 h-4 text-purple-400" />,
      benchmark: <Target className="w-4 h-4 text-pink-400" />,
      sync: <RefreshCw className="w-4 h-4 text-cyan-400" />,
      coach: <UserCheck className="w-4 h-4 text-yellow-400" />
    };
    return icons[type] || <Activity className="w-4 h-4 text-[#00A651]" />;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    // Handle Firestore Timestamp objects
    const raw = dateString?.toDate ? dateString.toDate()
      : dateString?.seconds ? new Date(dateString.seconds * 1000)
      : new Date(dateString);
    if (isNaN(raw.getTime())) return 'No date';
    const now = new Date();
    const diff = now - raw;

    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    } else if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    } else {
      return raw.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'active':
        return 'text-[#00A651]';
      case 'warning':
        return 'text-yellow-400';
      case 'error':
      case 'disconnected':
        return 'text-red-400';
      default:
        return 'text-gray-500';
    }
  };

  const memberSince = (() => {
    if (!userProfile?.createdAt) return 'January 2024';
    const raw = userProfile.createdAt?.toDate ? userProfile.createdAt.toDate()
      : userProfile.createdAt?.seconds ? new Date(userProfile.createdAt.seconds * 1000)
      : new Date(userProfile.createdAt);
    return isNaN(raw.getTime()) ? 'January 2024' : raw.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
  })();

  return (
    <div className="min-h-screen bg-[#F5F9F5]">
      {/* Header */}
      <div className="bg-white border-b border-[#D4E4D4]">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <Breadcrumb
            path={[
              { label: 'Home', url: '/welcome' },
              { label: 'Admin Profile' }
            ]}
            className="mb-4"
          />

          {/* Profile Header */}
          <div className="flex items-center gap-4">
            {/* Photo Placeholder */}
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center border-4 border-purple-400/30">
              {userProfile?.photoURL ? (
                <img
                  src={userProfile.photoURL}
                  alt={userProfile.displayName}
                  className="w-full h-full rounded-full object-cover"
                  loading="lazy"
                />
              ) : (
                <Shield className="w-10 h-10 text-gray-800" />
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800">
                {userProfile?.displayName || 'Administrator'}
              </h1>
              <p className="text-purple-300 text-sm mt-1">
                Club Administrator • Member since {memberSince}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-1 bg-purple-500/20 border border-purple-500 rounded-full text-purple-300 text-xs font-medium">
                  Full Access
                </span>
                <span className="px-2 py-1 bg-[#005028]/20 border border-[#00A651] rounded-full text-[#00A651] text-xs font-medium">
                  Emerald Lakers
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Club Management Overview */}
        <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-[#00A651]" />
            </div>
            <div>
              <h2 className="text-gray-800 font-semibold">Club Overview</h2>
              <p className="text-[#6B7C6B] text-xs">Current club statistics</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-[#F5F9F5] border border-[#D4E4D4] rounded-xl p-4 text-center">
              <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-800">{clubStats.totalPlayers}</p>
              <p className="text-[#6B7C6B] text-xs">Players</p>
            </div>
            <div className="bg-[#F5F9F5] border border-[#D4E4D4] rounded-xl p-4 text-center">
              <Shield className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-800">{clubStats.totalTeams}</p>
              <p className="text-[#6B7C6B] text-xs">Teams</p>
            </div>
            <div className="bg-[#F5F9F5] border border-[#D4E4D4] rounded-xl p-4 text-center">
              <UserCheck className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-800">{clubStats.totalCoaches}</p>
              <p className="text-[#6B7C6B] text-xs">Coaches</p>
            </div>
            <div className="bg-[#F5F9F5] border border-[#D4E4D4] rounded-xl p-4 text-center">
              <Target className="w-6 h-6 text-orange-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-800">{clubStats.totalEvaluations}</p>
              <p className="text-[#6B7C6B] text-xs">Assessments</p>
            </div>
            <div className="bg-[#F5F9F5] border border-[#D4E4D4] rounded-xl p-4 text-center">
              <Activity className="w-6 h-6 text-[#00A651] mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-800">{clubStats.activeThisWeek}</p>
              <p className="text-[#6B7C6B] text-xs">Active This Week</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-[#00A651]" />
            </div>
            <div>
              <h2 className="text-gray-800 font-semibold">Quick Actions</h2>
              <p className="text-[#6B7C6B] text-xs">Common admin tasks</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {quickActions.map(action => (
              <button
                key={action.id}
                onClick={() => navigate(action.path)}
                className="group flex items-center gap-3 p-4 bg-[#F5F9F5] border border-[#D4E4D4] rounded-xl hover:border-[#00A651] hover:bg-gray-50 transition-all hover:scale-[1.02]"
              >
                <div className={`w-10 h-10 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center shadow-lg`}>
                  <action.icon className="w-5 h-5 text-gray-800" />
                </div>
                <span className="text-gray-800 text-sm font-medium group-hover:text-[#00A651] transition-colors">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg flex items-center justify-center">
              <Server className="w-5 h-5 text-[#00A651]" />
            </div>
            <div>
              <h2 className="text-gray-800 font-semibold">System Status</h2>
              <p className="text-[#6B7C6B] text-xs">Service health overview</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Database Status */}
            <div className="bg-[#F5F9F5] border border-[#D4E4D4] rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-[#00A651]" />
                  <div>
                    <p className="text-gray-800 text-sm font-medium">Database</p>
                    <p className="text-[#6B7C6B] text-xs">Last sync: {systemStatus.database.lastSync}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className={`w-4 h-4 ${getStatusColor(systemStatus.database.status)}`} />
                  <span className={`text-xs capitalize ${getStatusColor(systemStatus.database.status)}`}>
                    {systemStatus.database.status}
                  </span>
                </div>
              </div>
            </div>

            {/* PlayerHQ Integration */}
            <div className="bg-[#F5F9F5] border border-[#D4E4D4] rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Link2 className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-gray-800 text-sm font-medium">PlayerHQ</p>
                    <p className="text-[#6B7C6B] text-xs">Last sync: {systemStatus.playerHQ.lastSync}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className={`w-4 h-4 ${getStatusColor(systemStatus.playerHQ.status)}`} />
                  <span className={`text-xs capitalize ${getStatusColor(systemStatus.playerHQ.status)}`}>
                    {systemStatus.playerHQ.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-[#F5F9F5] border border-[#D4E4D4] rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-yellow-400" />
                  <div>
                    <p className="text-gray-800 text-sm font-medium">Notifications</p>
                    <p className="text-[#6B7C6B] text-xs">{systemStatus.notifications.pending} pending</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className={`w-4 h-4 ${getStatusColor(systemStatus.notifications.status)}`} />
                  <span className={`text-xs capitalize ${getStatusColor(systemStatus.notifications.status)}`}>
                    {systemStatus.notifications.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Storage */}
            <div className="bg-[#F5F9F5] border border-[#D4E4D4] rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-gray-800 text-sm font-medium">Data</p>
                    <p className="text-[#6B7C6B] text-xs">
                      {players?.length || 0} players, {teams?.length || 0} teams
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className={`w-4 h-4 ${getStatusColor('healthy')}`} />
                  <span className={`text-xs ${getStatusColor('healthy')}`}>OK</span>
                </div>
              </div>
            </div>
          </div>

          {/* System Management Link */}
          <button
            onClick={() => navigate('/admin/system')}
            className="w-full mt-4 py-2 text-center text-[#00A651] text-sm hover:text-gray-800 transition-colors flex items-center justify-center gap-2"
          >
            View Full System Status
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Recent Admin Activity */}
        <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#00A651]" />
            </div>
            <div>
              <h2 className="text-gray-800 font-semibold">Recent Activity</h2>
              <p className="text-[#6B7C6B] text-xs">Admin actions log</p>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="space-y-0">
            {recentActivity.map((activity, index) => (
              <div
                key={activity.id}
                className="flex gap-3 pb-4 relative"
              >
                {/* Timeline line */}
                {index < recentActivity.length - 1 && (
                  <div className="absolute left-[15px] top-8 bottom-0 w-px bg-[#D4E4D4]" />
                )}

                {/* Icon */}
                <div className="w-8 h-8 bg-[#F5F9F5] border border-[#D4E4D4] rounded-full flex items-center justify-center flex-shrink-0 z-10">
                  {getActivityIcon(activity.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 text-sm">{activity.action}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[#6B7C6B] text-xs">{formatDate(activity.date)}</span>
                    <span className="text-[#6B7C6B] text-xs">•</span>
                    <span className="text-[#00A651] text-xs">{activity.user}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* View All Link */}
          <button
            onClick={() => navigate('/admin/activity')}
            className="w-full mt-2 py-2 text-center text-[#00A651] text-sm hover:text-gray-800 transition-colors"
          >
            View All Activity
          </button>
        </div>

        {/* Account Settings */}
        <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-[#00A651]" />
            </div>
            <div>
              <h2 className="text-gray-800 font-semibold">Account Details</h2>
              <p className="text-[#6B7C6B] text-xs">Your administrator account</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-[#F5F9F5] border border-[#D4E4D4] rounded-xl">
              <div>
                <p className="text-gray-500 text-xs">Email</p>
                <p className="text-gray-800 text-sm">{currentUser?.email || 'admin@emeraldlakers.com'}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#F5F9F5] border border-[#D4E4D4] rounded-xl">
              <div>
                <p className="text-gray-500 text-xs">Role</p>
                <p className="text-gray-800 text-sm">Administrator</p>
              </div>
              <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                Full Access
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#F5F9F5] border border-[#D4E4D4] rounded-xl">
              <div>
                <p className="text-gray-500 text-xs">Club</p>
                <p className="text-gray-800 text-sm">Emerald Lakers Basketball Club</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#F5F9F5] border border-[#D4E4D4] rounded-xl">
              <div>
                <p className="text-gray-500 text-xs">Last Login</p>
                <p className="text-gray-800 text-sm">Today at {new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center border-t border-[#D4E4D4]">
        <p className="text-[#6B7C6B] text-xs">Emerald Lakers Administrator</p>
      </footer>
    </div>
  );
};

export default AdminProfilePage;
