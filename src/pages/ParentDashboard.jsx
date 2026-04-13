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
  ChevronUp,
  CheckCircle,
  Trophy,
  Star,
  MessageSquare,
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
  const { players, teams, evaluations, schedule, games, matchAssessments, userProfile, userChildrenIds, loading } = useFilteredData();
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
  const [expandedMatchId, setExpandedMatchId] = useState(null);
  const [expandedMetrics, setExpandedMetrics] = useState({});
  const toggleMetric = (key) => setExpandedMetrics(prev => ({ ...prev, [key]: !prev[key] }));
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

  // Helper to safely parse Firestore dates
  const parseFirestoreDate = (d) => {
    if (!d) return null;
    if (d.toDate) return d.toDate();
    if (d.seconds) return new Date(d.seconds * 1000);
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  // Get recent games for selected child's team
  const childGames = useMemo(() => {
    if (!selectedChild) return [];
    const childTeamId = selectedChild.teamId;
    return (games || [])
      .filter(g => g.teamId === childTeamId)
      .sort((a, b) => {
        const da = parseFirestoreDate(a.date);
        const db2 = parseFirestoreDate(b.date);
        return (db2?.getTime() || 0) - (da?.getTime() || 0);
      })
      .slice(0, 5);
  }, [selectedChild, games]);

  // Get match assessments for selected child's team with child's individual data
  const childMatchAssessments = useMemo(() => {
    if (!selectedChild) return [];
    const childTeamId = selectedChild.teamId;
    const seenIds = new Set();
    const seenFingerprints = new Set();
    return (matchAssessments || [])
      .filter(a => {
        if (a.teamId !== childTeamId) return false;
        // Deduplicate by document id
        if (a.id && seenIds.has(a.id)) return false;
        if (a.id) seenIds.add(a.id);
        // Deduplicate by teamId+date+opponent fingerprint
        const d = parseFirestoreDate(a.date);
        const dateStr = d ? d.toISOString().slice(0, 10) : '';
        const fp = `${a.teamId}|${dateStr}|${(a.opponent || '').toLowerCase()}`;
        if (seenFingerprints.has(fp)) return false;
        seenFingerprints.add(fp);
        return true;
      })
      .sort((a, b) => {
        const da = parseFirestoreDate(a.date);
        const db2 = parseFirestoreDate(b.date);
        return (db2?.getTime() || 0) - (da?.getTime() || 0);
      })
      .slice(0, 5);
  }, [selectedChild, matchAssessments]);

  // Season MVP Standings — aggregate all MVP votes for child's team
  const mvpStandings = useMemo(() => {
    if (!selectedChild) return [];
    const childTeamId = selectedChild.teamId;
    const allTeamAssessments = (matchAssessments || []).filter(a => a.teamId === childTeamId);
    const voteTotals = {};
    allTeamAssessments.forEach(a => {
      const votes = a.mvpVoting?.votes;
      if (!votes) return;
      [3, 2, 1].forEach(pts => {
        const pid = votes[pts];
        if (!pid) return;
        if (!voteTotals[pid]) {
          voteTotals[pid] = {
            name: a.playerAssessments?.[pid]?.playerName || 'Player',
            total: 0,
            games: 0,
          };
        }
        voteTotals[pid].total += pts;
        voteTotals[pid].games += 1;
      });
    });
    return Object.entries(voteTotals)
      .map(([pid, data]) => ({ playerId: pid, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [selectedChild, matchAssessments]);

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

        {/* Match Results & Assessments — accordion layout matching coach view (public notes only) */}
        {childMatchAssessments.length > 0 && (() => {
          const METRIC_LABELS = {
            teamWork: 'Team Work', defense: 'Defense', ballMovement: 'Ball Movement',
            offense: 'Offense', shotSelection: 'Shot Selection', sportsmanship: 'Sportsmanship'
          };
          const METRIC_IDS = Object.keys(METRIC_LABELS);
          const ratingColor = (v) => {
            if (v <= 1) return 'bg-red-500 text-white';
            if (v === 2) return 'bg-orange-500 text-white';
            if (v === 3) return 'bg-yellow-500 text-white';
            if (v === 4) return 'bg-[#005028] text-white';
            return 'bg-[#86efac] text-gray-800';
          };
          const ResultBadge = ({ result }) => {
            const cfg = { win: { l: 'W', c: 'bg-green-600 text-white' }, loss: { l: 'L', c: 'bg-red-600 text-white' }, draw: { l: 'D', c: 'bg-gray-500 text-white' } };
            const r = cfg[result] || cfg.draw;
            return <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${r.c}`}>{r.l}</span>;
          };

          return (
            <div className="bg-white border border-[#D4E4D4] rounded-xl p-4">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="w-5 h-5 text-[#00A651]" />
                <h3 className="text-gray-800 font-semibold">Match Results</h3>
              </div>
              <div className="space-y-3">
                {childMatchAssessments.map((assessment, i) => {
                  const assessDate = parseFirestoreDate(assessment.date);
                  const childData = assessment.playerAssessments?.[selectedChild.id];
                  const childMetrics = childData?.metrics || {};
                  const childMetricNotes = childData?.metricNotes || {};
                  const isExpanded = expandedMatchId === (assessment.id || i);

                  return (
                    <div key={assessment.id || i} className="bg-white border border-[#D4E4D4] rounded-xl overflow-hidden">
                      {/* Card Header */}
                      <button
                        onClick={() => setExpandedMatchId(isExpanded ? null : (assessment.id || i))}
                        className="w-full px-4 py-4 flex items-center gap-3 hover:bg-[#F5F9F5] transition-colors text-left"
                      >
                        <div className="flex-shrink-0"><ResultBadge result={assessment.result} /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-800 font-semibold text-sm truncate">
                            {assessment.teamName || 'Team'} vs {assessment.opponent || 'Unknown'}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-[#6B7C6B] mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {assessDate ? assessDate.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : ''}
                            </span>
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-[#6B7C6B] flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-[#6B7C6B] flex-shrink-0" />}
                      </button>

                      {isExpanded && (
                        <div className="border-t border-[#D4E4D4] px-4 pb-4 pt-3 space-y-5">
                          {/* 1. Team Performance — accordion metric rows (public notes only) */}
                          {assessment.teamMetrics && Object.keys(assessment.teamMetrics).length > 0 && (
                            <div>
                              <h4 className="text-gray-800 font-semibold text-sm mb-2 flex items-center gap-2">
                                <Shield className="w-4 h-4 text-[#00A651]" />
                                Team Performance
                              </h4>
                              <div className="space-y-1">
                                {METRIC_IDS.map((mId) => {
                                  const val = assessment.teamMetrics[mId];
                                  if (!val) return null;
                                  const teamNote = assessment.teamMetricNotes?.[mId];
                                  const hasPublicNote = teamNote?.note && !teamNote.private;
                                  const metricKey = `team-${assessment.id}-${mId}`;
                                  const isOpen = expandedMetrics[metricKey];
                                  return (
                                    <div key={mId}>
                                      <button
                                        onClick={() => hasPublicNote && toggleMetric(metricKey)}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left ${hasPublicNote ? 'hover:bg-[#F5F9F5] cursor-pointer' : 'cursor-default'} transition-colors`}
                                      >
                                        <span className="text-sm text-gray-800">{METRIC_LABELS[mId]}</span>
                                        <div className="flex items-center gap-2">
                                          {hasPublicNote && <MessageSquare className="w-3 h-3 text-[#6B7C6B]" />}
                                          <span className={`inline-block w-7 h-7 rounded text-xs font-bold leading-7 text-center ${ratingColor(val)}`}>{val}</span>
                                          {hasPublicNote && (isOpen ? <ChevronUp className="w-3.5 h-3.5 text-[#6B7C6B]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#6B7C6B]" />)}
                                        </div>
                                      </button>
                                      {isOpen && hasPublicNote && (
                                        <div className="mx-3 mb-2 px-3 py-2 rounded-lg text-sm whitespace-pre-wrap bg-[#F5F9F5] border border-[#D4E4D4]">
                                          {teamNote.note}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* 2. Team Performance Notes (public only) */}
                          {assessment.teamPerformanceNotes?.note && !assessment.teamPerformanceNotes.private && (
                            <div className="rounded-lg p-3 bg-[#F5F9F5] border border-[#D4E4D4]">
                              <p className="text-[10px] text-[#6B7C6B] font-medium uppercase tracking-wide mb-1">Team Performance Notes</p>
                              <p className="text-gray-800 text-sm whitespace-pre-wrap">{assessment.teamPerformanceNotes.note}</p>
                            </div>
                          )}

                          {/* 3. General Match Notes (public only) */}
                          {(() => {
                            const gn = assessment.generalMatchNotes || {};
                            const gnText = gn.note || assessment.generalNotes || '';
                            if (!gnText || gn.private) return null;
                            return (
                              <div className="rounded-lg p-3 bg-[#F5F9F5] border border-[#D4E4D4]">
                                <p className="text-[10px] text-[#6B7C6B] font-medium uppercase tracking-wide mb-1">General Notes</p>
                                <p className="text-gray-800 text-sm whitespace-pre-wrap">{gnText}</p>
                              </div>
                            );
                          })()}

                          {/* 4. Child's Individual Metrics — accordion rows */}
                          {childData && Object.keys(childMetrics).length > 0 && (
                            <div className="bg-white border border-[#D4E4D4] rounded-xl overflow-hidden">
                              <div className="px-3 py-2 bg-[#F5F9F5] border-b border-[#D4E4D4] flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-[#00A651]" />
                                  <span className="text-sm font-semibold text-gray-800">
                                    {childData.playerNumber ? `#${childData.playerNumber} ` : ''}{selectedChild.name}
                                  </span>
                                </div>
                                <span className="text-xs font-bold text-[#005028]">
                                  Avg: {(() => {
                                    const vals = METRIC_IDS.map(m => childMetrics[m]).filter(Boolean);
                                    return vals.length > 0 ? (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1) : '-';
                                  })()}
                                </span>
                              </div>
                              <div className="divide-y divide-[#D4E4D4]/50">
                                {METRIC_IDS.map((mId) => {
                                  const val = childMetrics[mId];
                                  if (!val) return null;
                                  const mNote = childMetricNotes[mId];
                                  const hasPublicNote = mNote?.note && !mNote.private;
                                  const mKey = `child-${assessment.id}-${mId}`;
                                  const isOpen = expandedMetrics[mKey];
                                  return (
                                    <div key={mId}>
                                      <button
                                        onClick={() => hasPublicNote && toggleMetric(mKey)}
                                        className={`w-full flex items-center justify-between px-3 py-2 text-left ${hasPublicNote ? 'hover:bg-[#F5F9F5] cursor-pointer' : 'cursor-default'} transition-colors`}
                                      >
                                        <span className="text-xs text-gray-700">{METRIC_LABELS[mId]}</span>
                                        <div className="flex items-center gap-2">
                                          {hasPublicNote && <MessageSquare className="w-3 h-3 text-[#6B7C6B]" />}
                                          <span className={`inline-block w-6 h-6 rounded text-xs font-bold leading-6 text-center ${ratingColor(val)}`}>{val}</span>
                                          {hasPublicNote && (isOpen ? <ChevronUp className="w-3 h-3 text-[#6B7C6B]" /> : <ChevronDown className="w-3 h-3 text-[#6B7C6B]" />)}
                                        </div>
                                      </button>
                                      {isOpen && hasPublicNote && (
                                        <div className="mx-3 mb-2 px-3 py-2 rounded text-xs whitespace-pre-wrap bg-[#F5F9F5] border border-[#D4E4D4]">
                                          {mNote.note}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Child public notes */}
                              {(childData.publicNotes || (childData.notesPrivate === false && childData.notes)) && (
                                <div className="px-3 py-2 border-t border-[#D4E4D4]">
                                  <p className="text-gray-800 text-xs whitespace-pre-wrap">
                                    {childData.publicNotes || childData.notes}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* 5. MVP Votes — simple list for parents */}
                          {assessment.mvpVoting?.votes && (() => {
                            // Build sorted list: player name + vote count
                            const voteEntries = [3, 2, 1]
                              .map(pts => ({ playerId: assessment.mvpVoting.votes[pts], votes: pts }))
                              .filter(e => e.playerId);
                            if (voteEntries.length === 0) return null;
                            return (
                              <div>
                                <h4 className="text-gray-800 font-semibold text-sm mb-2 flex items-center gap-2">
                                  <Trophy className="w-4 h-4 text-[#FFD700]" />
                                  MVP Votes
                                </h4>
                                <div className="space-y-1">
                                  {voteEntries.map(({ playerId, votes }) => {
                                    const pName = assessment.playerAssessments?.[playerId]?.playerName || 'Player';
                                    const isChild = playerId === selectedChild.id;
                                    return (
                                      <div key={playerId} className={`px-3 py-2 rounded-lg ${isChild ? 'bg-[#FFD700]/10 border border-[#FFD700]/30' : 'bg-[#F5F9F5]'}`}>
                                        <div className="flex items-center justify-between">
                                          <span className={`text-sm ${isChild ? 'font-bold text-gray-800' : 'text-gray-700'}`}>{pName}</span>
                                          <span className="text-xs font-medium text-[#6B7C6B]">{votes} vote{votes !== 1 ? 's' : ''}</span>
                                        </div>
                                        {assessment.mvpVoting.notes?.[votes] && (
                                          <p className="text-[#6B7C6B] text-xs mt-1 italic whitespace-pre-wrap">
                                            &ldquo;{assessment.mvpVoting.notes[votes]}&rdquo;
                                          </p>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Season MVP Standings */}
        {mvpStandings.length > 0 && (
          <div className="bg-white border border-[#D4E4D4] rounded-xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="w-5 h-5 text-[#FFD700]" />
              <h3 className="text-gray-800 font-semibold">
                Season MVP Standings{childTeam ? ` — ${childTeam.name}` : ''}
              </h3>
            </div>
            <div className="space-y-1">
              {mvpStandings.map((entry, idx) => {
                const isChild = entry.playerId === selectedChild?.id;
                return (
                  <div key={entry.playerId} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isChild ? 'bg-[#FFD700]/10 border border-[#FFD700]/30' : idx % 2 === 0 ? 'bg-[#F5F9F5]' : ''}`}>
                    <span className="w-6 text-center text-xs font-bold text-[#6B7C6B]">{idx + 1}</span>
                    <span className={`flex-1 text-sm truncate ${isChild ? 'font-bold text-gray-800' : 'text-gray-700'}`}>{entry.name}</span>
                    <span className="text-xs font-medium text-[#005028]">{entry.total} pts</span>
                    <span className="text-[10px] text-[#6B7C6B]">{entry.games} game{entry.games !== 1 ? 's' : ''}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Skills Progress Summary */}
        <FirstTimeHint hintKey="parent_skills_progress">
        <div className="bg-white border border-[#D4E4D4] rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-[#00A651]" />
              <h3 className="text-gray-800 font-semibold">Skills Progress</h3>
            </div>
            <button
              onClick={() => navigate(`/skills-passport/${selectedChild?.id || ''}`)}
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
                    {(() => {
                      const d = parseFirestoreDate(evalItem.date) || parseFirestoreDate(evalItem.createdAt);
                      return d ? d.toLocaleDateString() : '';
                    })()}
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
