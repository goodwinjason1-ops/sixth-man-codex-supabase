import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFilteredData } from '../../hooks/useFilteredData';
import PageShell from '../../components/PageShell';
import { toJsDate } from '../../utils/dateUtils';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  FileText,
  Dumbbell,
  Save,
  X,
  MessageSquare,
  ClipboardList,
} from 'lucide-react';

const RecordTrainingPage = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const {
    games, trainingPlans, players, teams, trainingRecords,
    currentUser, userProfile, addDocument, updateDocument, loading: dataLoading
  } = useFilteredData();

  // State
  const [attendance, setAttendance] = useState({});
  const [drillsCompleted, setDrillsCompleted] = useState(new Set());
  const [drillNotes, setDrillNotes] = useState({});
  const [sessionNotes, setSessionNotes] = useState('');
  const [playerNotes, setPlayerNotes] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [showPlayerNotes, setShowPlayerNotes] = useState(false);
  const [expandedDrill, setExpandedDrill] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // Find the game/training session
  const game = useMemo(() => {
    return (games || []).find(g => g.id === gameId) || null;
  }, [games, gameId]);

  // Find the linked training plan
  const linkedPlan = useMemo(() => {
    if (!game?.trainingPlanId) return null;
    return (trainingPlans || []).find(p => p.id === game.trainingPlanId) || null;
  }, [game, trainingPlans]);

  // Get all drills from the linked plan
  const planDrills = useMemo(() => {
    if (!linkedPlan?.sessions) return [];
    const drills = [];
    linkedPlan.sessions.forEach((session, sIdx) => {
      (session.drills || []).forEach((drill, dIdx) => {
        drills.push({
          ...drill,
          key: `${sIdx}-${dIdx}`,
          sessionNumber: session.sessionNumber || sIdx + 1,
        });
      });
    });
    return drills;
  }, [linkedPlan]);

  // Find team and players for this session
  const teamDoc = useMemo(() => {
    if (!game?.teamId) return null;
    return (teams || []).find(t => t.id === game.teamId) || null;
  }, [game, teams]);

  const teamPlayers = useMemo(() => {
    if (!game?.teamId) return [];
    return (players || []).filter(p => {
      const pTeams = p.teamIds || (p.teamId ? [p.teamId] : []);
      return pTeams.includes(game.teamId);
    }).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [game, players]);

  // Find existing record for this session
  const existingRecord = useMemo(() => {
    return (trainingRecords || []).find(r => r.gameId === gameId) || null;
  }, [trainingRecords, gameId]);

  // Load existing record or initialize defaults
  useEffect(() => {
    if (dataLoading || loaded) return;
    if (!game) return;

    if (existingRecord) {
      // Load saved data
      setAttendance(existingRecord.attendance || {});
      setDrillsCompleted(new Set(existingRecord.drillsCompleted || []));
      setDrillNotes(existingRecord.drillNotes || {});
      setSessionNotes(existingRecord.sessionNotes || '');
      setPlayerNotes(existingRecord.playerNotes || {});
    } else {
      // Default all players to present
      const defaultAttendance = {};
      teamPlayers.forEach(p => {
        defaultAttendance[p.id] = 'present';
      });
      setAttendance(defaultAttendance);
    }
    setLoaded(true);
  }, [dataLoading, game, existingRecord, teamPlayers, loaded]);

  // Attendance counts
  const attendanceCounts = useMemo(() => {
    const values = Object.values(attendance);
    return {
      present: values.filter(v => v === 'present').length,
      late: values.filter(v => v === 'late').length,
      absent: values.filter(v => v === 'absent').length,
      total: values.length,
    };
  }, [attendance]);

  // Format the session date
  const sessionDate = useMemo(() => {
    if (!game?.date) return '';
    const d = toJsDate(game.date);
    if (!d) return '';
    return d.toLocaleDateString('en-AU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, [game]);

  const teamName = teamDoc?.name || game?.teamName || 'Unknown Team';

  // Toast helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Save handler
  const handleSave = async () => {
    if (saving) return;
    setSaving(true);

    try {
      // Build player notes — only non-empty
      const cleanPlayerNotes = {};
      Object.entries(playerNotes).forEach(([pid, note]) => {
        if (note && note.trim()) cleanPlayerNotes[pid] = note.trim();
      });

      // Build drill notes — only non-empty
      const cleanDrillNotes = {};
      Object.entries(drillNotes).forEach(([key, note]) => {
        if (note && note.trim()) cleanDrillNotes[key] = note.trim();
      });

      const recordData = {
        gameId,
        teamId: game.teamId,
        coachId: currentUser.uid,
        coachName: userProfile?.displayName || userProfile?.name || 'Coach',
        date: game.date,
        trainingPlanId: game.trainingPlanId || null,
        attendance,
        drillsCompleted: [...drillsCompleted],
        drillNotes: cleanDrillNotes,
        sessionNotes: sessionNotes.trim(),
        playerNotes: cleanPlayerNotes,
      };

      if (existingRecord) {
        await updateDocument('training_records', existingRecord.id, recordData);
      } else {
        recordData.createdAt = new Date().toISOString();
        await addDocument('training_records', recordData);
      }

      showToast('Training record saved');
      setTimeout(() => navigate(-1), 1500);
    } catch (err) {
      console.error('Error saving training record:', err);
      showToast('Failed to save. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Toggle attendance for a player
  const toggleAttendance = (playerId, status) => {
    setAttendance(prev => ({ ...prev, [playerId]: status }));
  };

  // Toggle drill completion
  const toggleDrill = (drillKey) => {
    setDrillsCompleted(prev => {
      const next = new Set(prev);
      if (next.has(drillKey)) {
        next.delete(drillKey);
      } else {
        next.add(drillKey);
      }
      return next;
    });
  };

  // Loading state
  if (dataLoading) {
    return (
      <PageShell title="Training Session" backTo="/coach/schedule">
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-[#00A651] animate-spin mb-4" />
          <p className="text-[#6B7C6B]">Loading session...</p>
        </div>
      </PageShell>
    );
  }

  // Game not found
  if (!game) {
    return (
      <PageShell title="Training Session" backTo="/coach/schedule">
        <div className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="w-12 h-12 text-[#6B7C6B] mb-3" />
          <h3 className="text-gray-800 font-semibold mb-1">Session Not Found</h3>
          <p className="text-[#6B7C6B] text-sm">This training session could not be found.</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Training Session"
      subtitle={`${teamName} — ${sessionDate}`}
      backTo="/coach/schedule"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'Dashboard', url: '/coach' },
        { label: 'Schedule', url: '/coach/schedule' },
        { label: 'Training Session' }
      ]}
      headerActions={
        linkedPlan ? (
          <button
            onClick={() => navigate(`/coach/training-plans/${linkedPlan.id}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 text-white rounded-lg text-xs hover:bg-white/30 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            {linkedPlan.name}
          </button>
        ) : null
      }
    >
      <div className="space-y-4 pb-40">
        {/* Existing record indicator */}
        {existingRecord && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <p className="text-blue-700 text-sm">Editing previously saved record</p>
          </div>
        )}

        {/* SECTION 1: Attendance */}
        <div className="bg-white border border-[#D4E4D4] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#D4E4D4] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#00A651]" />
              <h2 className="font-semibold text-gray-800">Attendance</h2>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[#00A651] font-medium">{attendanceCounts.present} present</span>
              {attendanceCounts.late > 0 && (
                <span className="text-amber-500 font-medium">{attendanceCounts.late} late</span>
              )}
              {attendanceCounts.absent > 0 && (
                <span className="text-red-500 font-medium">{attendanceCounts.absent} absent</span>
              )}
              <span className="text-[#6B7C6B]">/ {attendanceCounts.total}</span>
            </div>
          </div>

          {teamPlayers.length === 0 ? (
            <div className="p-6 text-center">
              <AlertCircle className="w-8 h-8 text-[#6B7C6B] mx-auto mb-2" />
              <p className="text-[#6B7C6B] text-sm">No players assigned to this team</p>
            </div>
          ) : (
            <div className="divide-y divide-[#D4E4D4]/50">
              {teamPlayers.map(player => {
                const status = attendance[player.id] || 'present';
                return (
                  <div key={player.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-800 font-medium text-sm truncate">{player.name}</p>
                      {player.position && (
                        <span className="text-[10px] text-[#6B7C6B] bg-[#F5F9F5] px-2 py-0.5 rounded-full">
                          {player.position}
                        </span>
                      )}
                    </div>
                    <div className="flex rounded-lg overflow-hidden border border-[#D4E4D4]">
                      <button
                        onClick={() => toggleAttendance(player.id, 'present')}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                          status === 'present'
                            ? 'bg-[#00A651] text-white'
                            : 'bg-white text-[#6B7C6B] hover:bg-[#F5F9F5]'
                        }`}
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => toggleAttendance(player.id, 'late')}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors border-x border-[#D4E4D4] ${
                          status === 'late'
                            ? 'bg-amber-500 text-white'
                            : 'bg-white text-[#6B7C6B] hover:bg-[#F5F9F5]'
                        }`}
                      >
                        ⏰
                      </button>
                      <button
                        onClick={() => toggleAttendance(player.id, 'absent')}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                          status === 'absent'
                            ? 'bg-red-500 text-white'
                            : 'bg-white text-[#6B7C6B] hover:bg-[#F5F9F5]'
                        }`}
                      >
                        ✗
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 2: Drill Completion */}
        <div className="bg-white border border-[#D4E4D4] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#D4E4D4] flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-[#00A651]" />
            <h2 className="font-semibold text-gray-800">
              {linkedPlan ? `Drills from ${linkedPlan.name}` : 'Drills'}
            </h2>
            {planDrills.length > 0 && (
              <span className="text-xs text-[#6B7C6B] bg-[#F5F9F5] px-2 py-0.5 rounded-full">
                {drillsCompleted.size}/{planDrills.length} done
              </span>
            )}
          </div>

          {!linkedPlan ? (
            <div className="p-6 text-center">
              <Dumbbell className="w-8 h-8 text-[#6B7C6B] mx-auto mb-2" />
              <p className="text-[#6B7C6B] text-sm">No training plan linked to this session</p>
            </div>
          ) : planDrills.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-[#6B7C6B] text-sm">No drills defined in this training plan</p>
            </div>
          ) : (
            <div className="divide-y divide-[#D4E4D4]/50">
              {planDrills.map(drill => {
                const isCompleted = drillsCompleted.has(drill.key);
                const isExpanded = expandedDrill === drill.key;
                return (
                  <div key={drill.key} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <button
                        onClick={() => toggleDrill(drill.key)}
                        className="flex items-center gap-3 flex-1 min-w-0 text-left"
                      >
                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          isCompleted
                            ? 'bg-[#00A651] border-[#00A651]'
                            : 'border-[#D4E4D4] bg-white'
                        }`}>
                          {isCompleted && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isCompleted ? 'text-[#00A651] line-through' : 'text-gray-800'}`}>
                            {drill.name}
                          </p>
                          {drill.description && (
                            <p className="text-[10px] text-[#6B7C6B] truncate">{drill.description}</p>
                          )}
                        </div>
                      </button>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {drill.duration && (
                          <span className="text-[10px] text-[#6B7C6B] bg-[#F5F9F5] px-2 py-0.5 rounded-full">
                            {drill.duration}min
                          </span>
                        )}
                        <button
                          onClick={() => setExpandedDrill(isExpanded ? null : drill.key)}
                          className="p-1 text-[#6B7C6B] hover:text-[#00A651] transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="mt-2 ml-9">
                        <textarea
                          value={drillNotes[drill.key] || ''}
                          onChange={e => setDrillNotes(prev => ({ ...prev, [drill.key]: e.target.value }))}
                          placeholder="Notes for this drill..."
                          className="w-full px-3 py-2 text-sm bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg focus:border-[#00A651] focus:outline-none resize-none"
                          rows={2}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 3: Session Notes */}
        <div className="bg-white border border-[#D4E4D4] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#D4E4D4] flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#00A651]" />
            <h2 className="font-semibold text-gray-800">Session Notes</h2>
          </div>
          <div className="p-4">
            <textarea
              value={sessionNotes}
              onChange={e => setSessionNotes(e.target.value)}
              placeholder="How did the session go? Any general observations..."
              className="w-full px-3 py-3 text-sm bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg focus:border-[#00A651] focus:outline-none resize-none"
              rows={4}
            />
          </div>
        </div>

        {/* SECTION 4: Player Notes (collapsible) */}
        <div className="bg-white border border-[#D4E4D4] rounded-xl overflow-hidden">
          <button
            onClick={() => setShowPlayerNotes(!showPlayerNotes)}
            className="w-full p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#00A651]" />
              <h2 className="font-semibold text-gray-800">Individual Player Notes</h2>
            </div>
            <div className="flex items-center gap-2">
              {Object.values(playerNotes).filter(n => n && n.trim()).length > 0 && (
                <span className="text-xs text-[#00A651] bg-[#00A651]/10 px-2 py-0.5 rounded-full">
                  {Object.values(playerNotes).filter(n => n && n.trim()).length} notes
                </span>
              )}
              {showPlayerNotes ? (
                <ChevronUp className="w-5 h-5 text-[#6B7C6B]" />
              ) : (
                <ChevronDown className="w-5 h-5 text-[#6B7C6B]" />
              )}
            </div>
          </button>

          {showPlayerNotes && (
            <div className="border-t border-[#D4E4D4] divide-y divide-[#D4E4D4]/50">
              {teamPlayers.filter(p => attendance[p.id] !== 'absent').length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-[#6B7C6B] text-sm">No present players to add notes for</p>
                </div>
              ) : (
                teamPlayers
                  .filter(p => attendance[p.id] !== 'absent')
                  .map(player => (
                    <div key={player.id} className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-800 mb-1.5">{player.name}</p>
                      <input
                        type="text"
                        value={playerNotes[player.id] || ''}
                        onChange={e => setPlayerNotes(prev => ({ ...prev, [player.id]: e.target.value }))}
                        placeholder="Notes for this player..."
                        className="w-full px-3 py-2 text-sm bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg focus:border-[#00A651] focus:outline-none"
                      />
                    </div>
                  ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sticky Save Button */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-white border-t border-[#D4E4D4] z-20 lg:bottom-0">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3.5 bg-[#005028] text-white rounded-xl font-semibold text-base hover:bg-[#00A651] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              {existingRecord ? 'Update Training Record' : 'Save Training Record'}
            </>
          )}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in ${
          toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-[#00A651] text-white'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </PageShell>
  );
};

export default RecordTrainingPage;
