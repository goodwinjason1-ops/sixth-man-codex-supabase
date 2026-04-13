import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFilteredData } from '../hooks/useFilteredData';
import {
  Calendar, Clock, Users, ChevronRight, ArrowLeft,
  CheckCircle2, XCircle, AlertCircle, Dumbbell, FileText, Search, MessageSquare,
  Pencil, Eye, Lock
} from 'lucide-react';
import PageShell from '../components/PageShell';
import { toJsDate, formatDateShortAU } from '../utils/dateUtils';
import TrainingPlanPreviewModal from '../components/TrainingPlanPreviewModal';

const TrainingHistoryPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile, teams: coachTeams, players, trainingPlans, trainingRecords, games, loading: dataLoading } = useFilteredData();

  const [teamFilter, setTeamFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [planPreview, setPlanPreview] = useState(null);

  // Get team name helper
  const getTeamName = (teamId) => {
    if (!teamId) return 'Unknown Team';
    const team = (coachTeams || []).find(t => t.id === teamId);
    return team ? (team.name || team.teamName || 'Unknown Team') : teamId;
  };

  // Get plan name helper
  const getPlanName = (planId) => {
    if (!planId) return null;
    const plan = (trainingPlans || []).find(p => p.id === planId);
    return plan?.name || null;
  };

  // Sort and filter training records
  const sortedRecords = useMemo(() => {
    const records = [...(trainingRecords || [])];
    records.sort((a, b) => {
      const da = toJsDate(a.date);
      const db2 = toJsDate(b.date);
      return (db2 || 0) - (da || 0);
    });
    return records;
  }, [trainingRecords]);

  // Filter sessions
  const filteredSessions = useMemo(() => {
    let result = [...sortedRecords];
    // Filter by coach's teams
    const coachTeamIds = coachTeams.map(t => t.id);
    if (coachTeamIds.length > 0) {
      result = result.filter(s => coachTeamIds.includes(s.teamId));
    }
    if (teamFilter !== 'all') {
      result = result.filter(s => s.teamId === teamFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        (s.sessionNotes || '').toLowerCase().includes(q) ||
        getTeamName(s.teamId).toLowerCase().includes(q) ||
        (getPlanName(s.trainingPlanId) || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [sortedRecords, teamFilter, searchQuery, coachTeams]);

  // Format a date value safely
  const formatDate = (dateVal) => {
    if (!dateVal) return 'Unknown date';
    const d = toJsDate(dateVal);
    if (d && !isNaN(d.getTime())) return formatDateShortAU(d);
    try {
      const parsed = new Date(dateVal);
      if (!isNaN(parsed.getTime())) return formatDateShortAU(parsed);
    } catch {}
    return 'Unknown date';
  };

  // Count attendance
  const getAttendanceSummary = (session) => {
    if (!session.attendance) return { present: 0, absent: 0, late: 0, total: 0 };
    const entries = Object.values(session.attendance);
    const present = entries.filter(a => a === 'present' || a === true).length;
    const late = entries.filter(a => a === 'late').length;
    const absent = entries.filter(a => a === 'absent' || a === false).length;
    return { present, late, absent, total: entries.length };
  };

  // Determine if a training record is still editable (within 6-day window)
  const isSessionEditable = (session) => {
    const sessionDate = toJsDate(session.date);
    if (!sessionDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Editable if today <= session date + 6 days
    const editDeadline = new Date(sessionDate);
    editDeadline.setHours(0, 0, 0, 0);
    editDeadline.setDate(editDeadline.getDate() + 6);
    editDeadline.setHours(23, 59, 59, 999);
    return today <= editDeadline;
  };

  // Detail view
  if (sessionId) {
    if (dataLoading) {
      return (
        <PageShell title="Training Session" backTo="/coach/training-history" maxWidth="3xl">
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-[#D4E4D4] border-t-[#00A651] rounded-full animate-spin" />
          </div>
        </PageShell>
      );
    }

    const selectedSession = (trainingRecords || []).find(r => r.id === sessionId) || null;

    if (!selectedSession) {
      return (
        <PageShell title="Session Not Found" backTo="/coach/training-history" maxWidth="3xl">
          <div className="text-center py-20">
            <AlertCircle className="w-12 h-12 text-[#6B7C6B] mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-800 mb-2">Session not found</h3>
            <p className="text-[#6B7C6B] text-sm mb-4">This training session may have been deleted.</p>
            <button
              onClick={() => navigate('/coach/training-history')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#005028] text-white rounded-lg font-medium hover:bg-[#00A651] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to History
            </button>
          </div>
        </PageShell>
      );
    }

    const att = getAttendanceSummary(selectedSession);
    const linkedPlan = selectedSession?.trainingPlanId
      ? (trainingPlans || []).find(p => p.id === selectedSession.trainingPlanId)
      : null;

    // Resolve drills from linked plan
    const allDrills = [];
    if (linkedPlan?.sessions) {
      linkedPlan.sessions.forEach((sess, sIdx) => {
        (sess.drills || []).forEach((drill, dIdx) => {
          allDrills.push({ ...drill, key: `${sIdx}-${dIdx}` });
        });
      });
    }
    const completedKeys = new Set(selectedSession.drillsCompleted || []);

    return (
      <PageShell
        title="Training Session"
        subtitle={formatDate(selectedSession.date)}
        backTo="/coach/training-history"
        breadcrumbs={[
          { label: 'Home', url: '/welcome' },
          { label: 'Record Training', url: '/coach/training-history' },
          { label: formatDate(selectedSession.date) }
        ]}
        maxWidth="3xl"
      >
        <div className="space-y-4">
          {/* Summary Card */}
          <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#F5F9F5] border-2 border-[#D4E4D4] rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-[#005028]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">{getTeamName(selectedSession.teamId)}</h2>
                <p className="text-sm text-[#6B7C6B]">
                  {formatDate(selectedSession.date)}
                  {selectedSession.coachName && ` · Coach: ${selectedSession.coachName}`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#F5F9F5] rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-[#00A651]">{att.present}</p>
                <p className="text-xs text-[#6B7C6B]">Present</p>
              </div>
              <div className="bg-[#F5F9F5] rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-yellow-500">{att.late}</p>
                <p className="text-xs text-[#6B7C6B]">Late</p>
              </div>
              <div className="bg-[#F5F9F5] rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-red-500">{att.absent}</p>
                <p className="text-xs text-[#6B7C6B]">Absent</p>
              </div>
            </div>

            {/* Edit / View-only button */}
            {selectedSession.gameId && (
              isSessionEditable(selectedSession) ? (
                <button
                  onClick={() => navigate(`/coach/training-session/${selectedSession.gameId}`)}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-[#00A651] text-white rounded-xl font-medium text-sm hover:bg-[#005028] transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  Edit Training Record
                </button>
              ) : (
                <div className="mt-4 flex items-center justify-center gap-2 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                  <Lock className="w-4 h-4" />
                  Edit window has closed
                </div>
              )
            )}
          </div>

          {/* Attendance List */}
          {selectedSession.attendance && Object.keys(selectedSession.attendance).length > 0 && (
            <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl p-5">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-[#005028]" /> Attendance ({att.total})
              </h3>
              <div className="space-y-2">
                {Object.entries(selectedSession.attendance).map(([playerId, status]) => {
                  const player = (players || []).find(p => p.id === playerId);
                  const isPresent = status === 'present' || status === true;
                  const isLate = status === 'late';
                  return (
                    <div key={playerId} className="flex items-center justify-between py-2 px-3 bg-[#F5F9F5] rounded-lg">
                      <span className="text-sm font-medium text-gray-800">
                        {player?.name || player?.displayName || playerId}
                      </span>
                      <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                        isPresent ? 'bg-[#00A651]/10 text-[#00A651]' :
                        isLate ? 'bg-yellow-500/10 text-yellow-600' :
                        'bg-red-500/10 text-red-500'
                      }`}>
                        {isPresent ? <CheckCircle2 className="w-3 h-3" /> :
                         isLate ? <Clock className="w-3 h-3" /> :
                         <XCircle className="w-3 h-3" />}
                        {isPresent ? 'Present' : isLate ? 'Late' : 'Absent'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Linked Plan */}
          {linkedPlan && (
            <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl p-5">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3">
                <Dumbbell className="w-5 h-5 text-[#00A651]" /> Linked Training Plan
              </h3>
              <button
                onClick={() => setPlanPreview(linkedPlan)}
                className="w-full text-left bg-[#F5F9F5] border border-[#D4E4D4] rounded-xl p-4 hover:border-[#00A651] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{linkedPlan.name}</p>
                    <p className="text-xs text-[#6B7C6B] mt-1">
                      {linkedPlan.sessions?.length || 0} session{(linkedPlan.sessions?.length || 0) !== 1 ? 's' : ''}
                      {linkedPlan.focusAreas?.length > 0 && ` · ${linkedPlan.focusAreas.join(', ')}`}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#00A651]" />
                </div>
              </button>
            </div>
          )}

          {/* Drills Completed */}
          {allDrills.length > 0 && (
            <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl p-5">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3">
                <Dumbbell className="w-5 h-5 text-[#00A651]" /> Drills ({completedKeys.size}/{allDrills.length} completed)
              </h3>
              <div className="space-y-2">
                {allDrills.map((drill, i) => {
                  const isCompleted = completedKeys.has(drill.key);
                  const drillNote = selectedSession.drillNotes?.[drill.key];
                  return (
                    <div key={drill.key} className="py-2 px-3 bg-[#F5F9F5] rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          isCompleted ? 'bg-[#00A651] text-white' : 'bg-[#D4E4D4] text-[#6B7C6B]'
                        }`}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isCompleted ? 'text-gray-800' : 'text-[#6B7C6B]'}`}>
                            {drill.name || 'Unnamed Drill'}
                          </p>
                          {drill.description && (
                            <p className="text-xs text-[#6B7C6B] truncate">{drill.description}</p>
                          )}
                        </div>
                        {isCompleted && (
                          <CheckCircle2 className="w-5 h-5 text-[#00A651] flex-shrink-0" />
                        )}
                      </div>
                      {drillNote && (
                        <div className="mt-1.5 ml-10 flex items-start gap-1.5 text-xs text-[#6B7C6B]">
                          <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>{drillNote}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Session Notes */}
          {selectedSession.sessionNotes && (
            <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl p-5">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-[#005028]" /> Session Notes
              </h3>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{selectedSession.sessionNotes}</p>
            </div>
          )}

          {/* Player Notes */}
          {selectedSession.playerNotes && Object.keys(selectedSession.playerNotes).length > 0 && (
            <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl p-5">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3">
                <MessageSquare className="w-5 h-5 text-[#005028]" /> Player Notes
              </h3>
              <div className="space-y-2">
                {Object.entries(selectedSession.playerNotes).map(([playerId, note]) => {
                  const player = (players || []).find(p => p.id === playerId);
                  return (
                    <div key={playerId} className="py-2 px-3 bg-[#F5F9F5] rounded-lg">
                      <p className="text-sm font-medium text-gray-800">{player?.name || player?.displayName || playerId}</p>
                      <p className="text-xs text-[#6B7C6B] mt-0.5">{note}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Full Plan Preview Modal */}
        <TrainingPlanPreviewModal plan={planPreview} onClose={() => setPlanPreview(null)} />
      </PageShell>
    );
  }

  // List view
  return (
    <PageShell
      title="Training History"
      subtitle={`${filteredSessions.length} session${filteredSessions.length !== 1 ? 's' : ''} recorded`}
      backTo="/dashboard"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'Dashboard', url: '/dashboard' },
        { label: 'Training History' }
      ]}
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* Search and Filter */}
        <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl p-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#6B7C6B]" />
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#F5F9F5] border border-[#D4E4D4] rounded-xl text-gray-800 placeholder-gray-400 focus:border-[#00A651] focus:outline-none"
            />
          </div>
          {coachTeams.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTeamFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  teamFilter === 'all'
                    ? 'bg-[#005028] text-white'
                    : 'bg-[#F5F9F5] border border-[#D4E4D4] text-gray-800 hover:border-[#00A651]'
                }`}
              >
                All Teams
              </button>
              {coachTeams.map(team => (
                <button
                  key={team.id}
                  onClick={() => setTeamFilter(team.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    teamFilter === team.id
                      ? 'bg-[#005028] text-white'
                      : 'bg-[#F5F9F5] border border-[#D4E4D4] text-gray-800 hover:border-[#00A651]'
                  }`}
                >
                  {team.name || team.teamName}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading */}
        {dataLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-[#D4E4D4] border-t-[#00A651] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-800 font-medium">Loading training history...</p>
            </div>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl p-8 text-center">
            <Calendar className="w-12 h-12 text-[#6B7C6B] mx-auto mb-3" />
            <h3 className="text-gray-800 font-semibold mb-2">No Training Sessions</h3>
            <p className="text-[#6B7C6B] text-sm">
              {searchQuery || teamFilter !== 'all'
                ? 'No sessions match your filters. Try adjusting them.'
                : 'No training sessions recorded yet. Record a session from your schedule.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSessions.map(session => {
              const att = getAttendanceSummary(session);
              const planName = getPlanName(session.trainingPlanId);
              const editable = isSessionEditable(session);
              return (
                <button
                  key={session.id}
                  onClick={() => navigate(`/coach/training-history/${session.id}`)}
                  className="w-full text-left bg-white border-2 border-[#D4E4D4] rounded-2xl p-4 hover:border-[#00A651] transition-colors group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#F5F9F5] border-2 border-[#D4E4D4] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:border-[#00A651] transition-colors">
                      <Calendar className="w-6 h-6 text-[#005028]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-gray-800 font-semibold">{getTeamName(session.teamId)}</h3>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-[#6B7C6B] flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(session.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {att.present}/{att.total} present
                        </span>
                        {planName && (
                          <span className="flex items-center gap-1">
                            <Dumbbell className="w-3 h-3" />
                            {planName}
                          </span>
                        )}
                      </div>
                      {session.sessionNotes && (
                        <p className="text-xs text-[#6B7C6B] mt-1 truncate">{session.sessionNotes.slice(0, 80)}{session.sessionNotes.length > 80 ? '...' : ''}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 mt-2">
                      {editable ? (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/coach/training-session/${session.gameId}`);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-[#00A651]/10 text-[#00A651] rounded-lg text-xs font-medium hover:bg-[#00A651]/20 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2.5 py-1.5 bg-[#F5F9F5] text-[#6B7C6B] rounded-lg text-xs font-medium">
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </span>
                      )}
                      <ChevronRight className="w-5 h-5 text-[#D4E4D4] group-hover:text-[#00A651] transition-colors" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default TrainingHistoryPage;
