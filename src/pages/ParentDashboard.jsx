import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import {
  Users,
  User,
  Calendar,
  Award,
  Bell,
  ChevronDown,
  AlertCircle,
  TrendingUp,
  Shield,
  Activity,
  MapPin,
  Clock
} from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';

const ParentDashboard = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { players, teams, evaluations, schedule } = useData();

  const linkedPlayerIds = userProfile?.linkedPlayerIds || [];

  // Get linked children's data
  const linkedPlayers = useMemo(() => {
    if (!linkedPlayerIds.length || !players?.length) return [];
    return players.filter(p => linkedPlayerIds.includes(p.id));
  }, [linkedPlayerIds, players]);

  const [selectedChildIdx, setSelectedChildIdx] = useState(0);
  const selectedChild = linkedPlayers[selectedChildIdx] || null;

  // Get team info for selected child
  const childTeam = useMemo(() => {
    if (!selectedChild) return null;
    return teams?.find(t => t.id === selectedChild.teamId) || null;
  }, [selectedChild, teams]);

  // Get recent evaluations for selected child
  const childEvaluations = useMemo(() => {
    if (!selectedChild || !evaluations) return [];
    const evals = Object.values(evaluations).filter(e => e.playerId === selectedChild.id);
    return evals.sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0)).slice(0, 5);
  }, [selectedChild, evaluations]);

  // Get upcoming schedule for selected child's team
  const upcomingSchedule = useMemo(() => {
    if (!selectedChild || !schedule?.length) return [];
    const now = new Date();
    const childTeamId = selectedChild.teamId;
    const childTeamName = (childTeam?.name || selectedChild.team || '').toLowerCase();

    return schedule
      .filter(event => {
        const eventDate = event.date?.toDate ? event.date.toDate() : new Date(event.date);
        if (eventDate < now) return false;
        // Match by teamId or team name
        if (event.teamId === childTeamId) return true;
        if (event.teamName?.toLowerCase() === childTeamName) return true;
        return false;
      })
      .sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return dateA - dateB;
      })
      .slice(0, 3);
  }, [selectedChild, schedule, childTeam]);

  // Empty state
  if (linkedPlayerIds.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a3d2e]">
        <div className="bg-[#0d5943] border-b border-[#1a8a68]/30">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <Breadcrumb
              path={[
                { label: 'Home', url: '/welcome' },
                { label: 'Parent Dashboard' }
              ]}
              className="mb-3"
            />
            <h1 className="text-2xl font-bold text-white">Parent Dashboard</h1>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="bg-[#0d5943] border-2 border-[#1a8a68] rounded-2xl p-8 text-center max-w-md mx-auto">
            <AlertCircle className="w-16 h-16 text-[#1a8a68] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No Linked Children</h2>
            <p className="text-[#1a8a68] text-sm">
              Your account is not yet linked to any players. Please contact your club administrator for assistance.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a3d2e]">
      {/* Header */}
      <div className="bg-[#0d5943] border-b border-[#1a8a68]/30">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Breadcrumb
            path={[
              { label: 'Home', url: '/welcome' },
              { label: 'Parent Dashboard' }
            ]}
            className="mb-3"
          />
          <h1 className="text-2xl font-bold text-white">
            Welcome, {userProfile?.displayName || 'Parent'}
          </h1>
          <p className="text-sm text-white/60 mt-1">Track your child&apos;s progress</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Child Selector (if multiple) */}
        {linkedPlayers.length > 1 && (
          <div className="relative">
            <select
              value={selectedChildIdx}
              onChange={(e) => setSelectedChildIdx(Number(e.target.value))}
              className="w-full px-4 py-3 bg-[#0d5943] border border-[#1a8a68] rounded-xl text-white appearance-none focus:border-[#22c55e] focus:outline-none"
            >
              {linkedPlayers.map((child, idx) => (
                <option key={child.id} value={idx}>{child.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4ade80] pointer-events-none" />
          </div>
        )}

        {/* Child Info Card */}
        {selectedChild && (
          <div className="bg-gradient-to-br from-[#0d5943] to-[#1a8a68] rounded-2xl p-6 border border-[#22c55e]/20">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#0a3d2e] border-2 border-[#22c55e] rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-[#4ade80]" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">{selectedChild.name}</h2>
                <div className="flex items-center gap-3 mt-1 text-sm text-white/60">
                  {selectedChild.playerNumber && (
                    <span className="px-2 py-0.5 bg-[#22c55e]/20 text-[#4ade80] rounded-lg font-medium">
                      #{selectedChild.playerNumber}
                    </span>
                  )}
                  {selectedChild.ageGroup && <span>{selectedChild.ageGroup}</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Team Info */}
        {childTeam && (
          <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-5 h-5 text-[#4ade80]" />
              <h3 className="text-white font-semibold">Team Info</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-white/60 text-xs">Team Name</p>
                <p className="text-white font-medium">{childTeam.name}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-white/60 text-xs">Age Group</p>
                <p className="text-white font-medium">{childTeam.ageGroup || selectedChild?.ageGroup || '-'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4 text-center">
            <Activity className="w-5 h-5 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{childEvaluations.length}</p>
            <p className="text-white/60 text-xs">Assessments</p>
          </div>
          <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4 text-center">
            <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">
              {childEvaluations.length > 0 && childEvaluations[0].level ? childEvaluations[0].level : '-'}
            </p>
            <p className="text-white/60 text-xs">Latest Level</p>
          </div>
          <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4 text-center">
            <Award className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">
              {selectedChild?.team || '-'}
            </p>
            <p className="text-white/60 text-xs">Team</p>
          </div>
        </div>

        {/* Upcoming Schedule */}
        <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5 text-[#4ade80]" />
            <h3 className="text-white font-semibold">Upcoming Schedule</h3>
          </div>

          {upcomingSchedule.length > 0 ? (
            <div className="space-y-3">
              {upcomingSchedule.map((event, i) => {
                const eventDate = event.date?.toDate ? event.date.toDate() : new Date(event.date);
                return (
                  <div key={event.id || i} className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium text-sm">
                        {event.opponent ? `vs ${event.opponent}` : event.title || 'Event'}
                      </span>
                      <span className="text-[#4ade80] text-xs font-medium">
                        {eventDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-white/50">
                      {event.time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {event.time}
                        </span>
                      )}
                      {event.venue && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.venue}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[#1a8a68] text-sm text-center py-4">No upcoming events</p>
          )}
        </div>

        {/* Skills Progress Summary */}
        <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-[#4ade80]" />
              <h3 className="text-white font-semibold">Skills Progress</h3>
            </div>
            <button
              onClick={() => navigate('/skills-passport')}
              className="text-sm text-[#4ade80] hover:text-white"
            >
              View All &rarr;
            </button>
          </div>

          {childEvaluations.length > 0 ? (
            <div className="space-y-3">
              {childEvaluations.slice(0, 3).map((evalItem, i) => (
                <div key={evalItem.id || i} className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm">{evalItem.skillName || evalItem.category || 'Assessment'}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      evalItem.level >= 4 ? 'bg-green-500/20 text-green-400' :
                      evalItem.level >= 2 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-white/10 text-white/60'
                    }`}>
                      {evalItem.level ? `Level ${evalItem.level}` : 'Pending'}
                    </span>
                  </div>
                  <p className="text-white/40 text-xs mt-1">
                    {evalItem.date ? new Date(evalItem.date).toLocaleDateString() :
                     evalItem.createdAt ? new Date(evalItem.createdAt).toLocaleDateString() : ''}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#1a8a68] text-sm text-center py-4">No assessments yet</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/notifications')}
            className="flex items-center gap-3 p-4 bg-[#0d5943] hover:bg-[#1a8a68] border border-[#1a8a68]/30 rounded-xl transition-colors"
          >
            <div className="w-10 h-10 bg-[#22c55e]/20 rounded-lg flex items-center justify-center">
              <Bell className="text-[#4ade80]" size={20} />
            </div>
            <span className="text-white font-medium text-sm">Notifications</span>
          </button>
          <button
            onClick={() => navigate('/team')}
            className="flex items-center gap-3 p-4 bg-[#0d5943] hover:bg-[#1a8a68] border border-[#1a8a68]/30 rounded-xl transition-colors"
          >
            <div className="w-10 h-10 bg-[#22c55e]/20 rounded-lg flex items-center justify-center">
              <Users className="text-[#4ade80]" size={20} />
            </div>
            <span className="text-white font-medium text-sm">Team Info</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
