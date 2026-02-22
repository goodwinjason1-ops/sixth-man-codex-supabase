import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFilteredData } from '../hooks/useFilteredData';
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
  Clock,
  Loader2,
  Target,
  ChevronRight,
  CheckCircle
} from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import FirstTimeHint from '../components/tutorial/FirstTimeHint';
import TutorialPromptCard from '../components/tutorial/TutorialPromptCard';
import { getParentSummaries } from '../services/youthProgramService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import SessionSummaryCard from '../components/youth/SessionSummaryCard';

const ParentDashboard = () => {
  const navigate = useNavigate();
  const { refreshUserProfile } = useAuth();
  const { players, teams, evaluations, schedule, userProfile, userChildrenIds, loading } = useFilteredData();
  const [refreshing, setRefreshing] = useState(false);

  // If linkedPlayerIds is empty but user is a parent, try refreshing from Firestore
  // in case the profile is stale (e.g. acceptInvitation updated it after initial fetch)
  useEffect(() => {
    if (userProfile?.role === 'parent' && userChildrenIds.length === 0 && !refreshing) {
      setRefreshing(true);
      refreshUserProfile().finally(() => setRefreshing(false));
    }
  }, [userProfile?.role]); // eslint-disable-line react-hooks/exhaustive-deps

  // players is already filtered to parent's children by useFilteredData
  const linkedPlayers = players || [];

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

  // IDP placeholder — real IDP data would come from Firestore if available
  const childIDP = null;

  // Session summaries from youth programs
  const [sessionSummaries, setSessionSummaries] = useState([]);
  const [showAllSessions, setShowAllSessions] = useState(false);

  useEffect(() => {
    if (!userProfile?.email) return;
    const loadSummaries = async () => {
      try {
        // Find enrollments by parent email
        const enrollQ = query(
          collection(db, 'youth_enrollments'),
          where('parentEmail', '==', userProfile.email)
        );
        const enrollSnap = await getDocs(enrollQ);
        const programIds = [...new Set(enrollSnap.docs.map(d => d.data().programId).filter(Boolean))];
        if (programIds.length === 0) return;

        const result = await getParentSummaries(programIds);
        if (result.success) setSessionSummaries(result.data);
      } catch (err) {
        console.error('Error loading session summaries:', err);
      }
    };
    loadSummaries();
  }, [userProfile?.email]);

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

  // Show loading spinner while data is being fetched
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F9F5]">
        <div className="bg-white border-b border-[#D4E4D4]/30">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <Breadcrumb
              path={[
                { label: 'Home', url: '/welcome' },
                { label: 'Parent Dashboard' }
              ]}
              className="mb-3"
            />
            <h1 className="text-2xl font-bold text-gray-800">Parent Dashboard</h1>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-[#00A651] animate-spin mb-4" />
          <p className="text-gray-500">Loading your child&apos;s information...</p>
        </div>
      </div>
    );
  }

  // Empty state (show loading if still refreshing)
  if (userChildrenIds.length === 0) {
    return (
      <div className="min-h-screen bg-[#F5F9F5]">
        <div className="bg-white border-b border-[#D4E4D4]/30">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <Breadcrumb
              path={[
                { label: 'Home', url: '/welcome' },
                { label: 'Parent Dashboard' }
              ]}
              className="mb-3"
            />
            <h1 className="text-2xl font-bold text-gray-800">Parent Dashboard</h1>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-12">
          {refreshing ? (
            <div className="text-center py-8">
              <Loader2 className="w-10 h-10 text-[#00A651] animate-spin mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Loading your children&apos;s data...</p>
            </div>
          ) : (
            <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl p-8 text-center max-w-md mx-auto">
              <AlertCircle className="w-16 h-16 text-[#6B7C6B] mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">No Linked Children</h2>
              <p className="text-[#6B7C6B] text-sm">
                Your account is not yet linked to any players. Please contact your club administrator for assistance.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F9F5]">
      {/* Header */}
      <div className="bg-white border-b border-[#D4E4D4]/30">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Breadcrumb
            path={[
              { label: 'Home', url: '/welcome' },
              { label: 'Parent Dashboard' }
            ]}
            className="mb-3"
          />
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome, {userProfile?.displayName || 'Parent'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Track your child&apos;s progress</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Tutorial prompt for parents */}
        <TutorialPromptCard tutorialId="parent" />

        {/* Child Selector (if multiple) */}
        {linkedPlayers.length > 1 && (
          <div className="relative">
            <select
              value={selectedChildIdx}
              onChange={(e) => setSelectedChildIdx(Number(e.target.value))}
              className="w-full px-4 py-3 bg-white border border-[#D4E4D4] rounded-xl text-gray-800 appearance-none focus:border-[#00A651] focus:outline-none"
            >
              {linkedPlayers.map((child, idx) => (
                <option key={child.id} value={idx}>{child.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#00A651] pointer-events-none" />
          </div>
        )}

        {/* Child Info Card */}
        {selectedChild && (
          <div className="bg-gradient-to-br from-[#005028] to-[#00A651] rounded-2xl p-6 border border-[#00A651]/20">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#F5F9F5] border-2 border-[#00A651] rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-[#00A651]" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-800">{selectedChild.name}</h2>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  {selectedChild.playerNumber && (
                    <span className="px-2 py-0.5 bg-[#005028]/20 text-[#00A651] rounded-lg font-medium">
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
          <div className="bg-white border border-[#D4E4D4] rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-5 h-5 text-[#00A651]" />
              <h3 className="text-gray-800 font-semibold">Team Info</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-100 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Team Name</p>
                <p className="text-gray-800 font-medium">{childTeam.name}</p>
              </div>
              <div className="bg-gray-100 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Age Group</p>
                <p className="text-gray-800 font-medium">{childTeam.ageGroup || selectedChild?.ageGroup || '-'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-[#D4E4D4] rounded-xl p-4 text-center">
            <Activity className="w-5 h-5 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">{childEvaluations.length}</p>
            <p className="text-gray-500 text-xs">Assessments</p>
          </div>
          <div className="bg-white border border-[#D4E4D4] rounded-xl p-4 text-center">
            <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">
              {childEvaluations.length > 0 && childEvaluations[0].level ? childEvaluations[0].level : '-'}
            </p>
            <p className="text-gray-500 text-xs">Latest Level</p>
          </div>
          <div className="bg-white border border-[#D4E4D4] rounded-xl p-4 text-center">
            <Award className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">
              {selectedChild?.team || '-'}
            </p>
            <p className="text-gray-500 text-xs">Team</p>
          </div>
        </div>

        {/* Upcoming Schedule */}
        <div className="bg-white border border-[#D4E4D4] rounded-xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5 text-[#00A651]" />
            <h3 className="text-gray-800 font-semibold">Upcoming Schedule</h3>
          </div>

          {upcomingSchedule.length > 0 ? (
            <div className="space-y-3">
              {upcomingSchedule.map((event, i) => {
                const eventDate = event.date?.toDate ? event.date.toDate() : new Date(event.date);
                return (
                  <div key={event.id || i} className="bg-gray-100 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-800 font-medium text-sm">
                        {event.opponent ? `vs ${event.opponent}` : event.title || 'Event'}
                      </span>
                      <span className="text-[#00A651] text-xs font-medium">
                        {eventDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
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
            <p className="text-[#6B7C6B] text-sm text-center py-4">No upcoming events</p>
          )}
        </div>

        {/* Skills Progress Summary */}
        <FirstTimeHint hintKey="parent_skills_progress">
        <div className="bg-white border border-[#D4E4D4] rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-[#00A651]" />
              <h3 className="text-gray-800 font-semibold">Skills Progress</h3>
            </div>
            <button
              onClick={() => navigate('/skills-passport')}
              className="text-sm text-[#00A651] hover:text-gray-800"
            >
              View All &rarr;
            </button>
          </div>

          {childEvaluations.length > 0 ? (
            <div className="space-y-3">
              {childEvaluations.slice(0, 3).map((evalItem, i) => (
                <div key={evalItem.id || i} className="bg-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-800 text-sm">{evalItem.skillName || evalItem.category || 'Assessment'}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      evalItem.level >= 4 ? 'bg-green-500/20 text-green-400' :
                      evalItem.level >= 2 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {evalItem.level ? `Level ${evalItem.level}` : 'Pending'}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">
                    {evalItem.date ? new Date(evalItem.date).toLocaleDateString() :
                     evalItem.createdAt ? new Date(evalItem.createdAt).toLocaleDateString() : ''}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#6B7C6B] text-sm text-center py-4">No assessments yet</p>
          )}
        </div>
        </FirstTimeHint>

        {/* Recent Youth Sessions */}
        {sessionSummaries.length > 0 && (
          <div className="bg-white border border-[#D4E4D4] rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-lg">{'\uD83C\uDFC0'}</span>
                <h3 className="text-gray-800 font-semibold">Recent Sessions</h3>
              </div>
              {sessionSummaries.length > 5 && (
                <button
                  onClick={() => setShowAllSessions(!showAllSessions)}
                  className="text-sm text-[#00A651] hover:text-gray-800"
                >
                  {showAllSessions ? 'Show Less' : 'View All'} &rarr;
                </button>
              )}
            </div>
            <div className="space-y-3">
              {(showAllSessions ? sessionSummaries : sessionSummaries.slice(0, 5)).map(summary => (
                <SessionSummaryCard
                  key={summary.id}
                  summary={summary}
                  showProgramName={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Development Plan (if shared by coach) */}
        {childIDP && (
          <div
            onClick={() => navigate(`/players/${selectedChild.id}/development-plan`)}
            className="bg-white border border-[#D4E4D4] rounded-xl p-4 cursor-pointer hover:border-[#00A651] transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#005028] to-[#00A651] rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-gray-800 font-semibold">Development Plan</h3>
                  <p className="text-[#6B7C6B] text-xs capitalize">{childIDP.status} &middot; {childIDP.season}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#00A651] group-hover:translate-x-1 transition-all" />
            </div>

            {/* Goal summary */}
            <div className="space-y-2">
              {childIDP.goals.slice(0, 3).map(goal => {
                const isAchieved = goal.status === 'achieved';
                const isInProgress = goal.status === 'in_progress';
                return (
                  <div key={goal.id} className="flex items-center justify-between bg-[#F5F9F5] rounded-lg px-3 py-2">
                    <span className="text-sm text-gray-800 truncate flex-1 mr-2">{goal.specificTarget}</span>
                    <span className={`flex items-center gap-1 text-xs font-medium whitespace-nowrap ${
                      isAchieved ? 'text-[#00A651]' : isInProgress ? 'text-blue-600' : 'text-[#6B7C6B]'
                    }`}>
                      {isAchieved && <CheckCircle className="w-3.5 h-3.5" />}
                      {isInProgress && <Clock className="w-3.5 h-3.5" />}
                      {isAchieved ? 'Achieved' : isInProgress ? 'In Progress' : 'Not Started'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Parent comments count */}
            {childIDP.parentComments && childIDP.parentComments.length > 0 && (
              <p className="text-xs text-[#6B7C6B] mt-3">
                {childIDP.parentComments.length} parent comment{childIDP.parentComments.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => navigate('/notifications')}
            className="flex flex-col items-center gap-2 p-4 bg-white hover:bg-gray-100 border border-[#D4E4D4]/30 rounded-xl transition-colors"
          >
            <div className="w-10 h-10 bg-[#005028]/20 rounded-lg flex items-center justify-center">
              <Bell className="text-[#00A651]" size={20} />
            </div>
            <span className="text-gray-800 font-medium text-xs text-center">Notifications</span>
          </button>
          <button
            onClick={() => navigate('/parent/team')}
            className="flex flex-col items-center gap-2 p-4 bg-white hover:bg-gray-100 border border-[#D4E4D4]/30 rounded-xl transition-colors"
          >
            <div className="w-10 h-10 bg-[#005028]/20 rounded-lg flex items-center justify-center">
              <Users className="text-[#00A651]" size={20} />
            </div>
            <span className="text-gray-800 font-medium text-xs text-center">Team Info</span>
          </button>
          <button
            onClick={() => navigate('/parent/schedule')}
            className="flex flex-col items-center gap-2 p-4 bg-white hover:bg-gray-100 border border-[#D4E4D4]/30 rounded-xl transition-colors"
          >
            <div className="w-10 h-10 bg-[#005028]/20 rounded-lg flex items-center justify-center">
              <Calendar className="text-[#00A651]" size={20} />
            </div>
            <span className="text-gray-800 font-medium text-xs text-center">Schedule</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
