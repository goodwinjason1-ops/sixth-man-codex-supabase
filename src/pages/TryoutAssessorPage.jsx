import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Star,
  Minus,
  Plus,
  Save,
  Users,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  CheckCircle,
  Loader2,
  AlertCircle,
  Wifi,
  WifiOff,
  ChevronDown,
  ChevronUp,
  Lock,
  Send,
  FileText
} from 'lucide-react';
import {
  getTryoutSession,
  saveEvaluation,
  subscribeAssessorEvaluations,
  calculateDuration,
  formatTime24to12,
  durationBetween,
  EVAL_METRICS,
  TEAM_OPTIONS,
  EVAL_STATUSES
} from '../services/tryoutService';
import HelpTooltip from '../components/tutorial/HelpTooltip';

const TryoutAssessorPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();

  // Session data
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Evaluation state
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [evaluations, setEvaluations] = useState({}); // playerId -> evaluation
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Metric notes expanded state
  const [expandedNotes, setExpandedNotes] = useState({});

  // Debounce timer refs (replaces window globals)
  const autoSaveTimerRef = useRef(null);
  const metricNoteSaveTimerRef = useRef(null);
  const notesSaveTimerRef = useRef(null);

  // Ref to always have latest currentEval (avoids stale closures)
  const currentEvalRef = useRef(null);

  // localStorage backup helpers
  const getLocalStorageKey = (playerId) =>
    `tryout_eval_${sessionId}_${playerId}_${currentUser?.uid}`;

  const saveToLocalStorage = (playerId, evalData) => {
    try {
      localStorage.setItem(getLocalStorageKey(playerId), JSON.stringify(evalData));
    } catch (e) { /* quota exceeded — non-critical */ }
  };

  const loadFromLocalStorage = (playerId) => {
    try {
      const data = localStorage.getItem(getLocalStorageKey(playerId));
      return data ? JSON.parse(data) : null;
    } catch (e) { return null; }
  };

  const clearLocalStorage = (playerId) => {
    try { localStorage.removeItem(getLocalStorageKey(playerId)); } catch (e) { /* ignore */ }
  };

  // Current player's evaluation (local state)
  const [currentEval, setCurrentEval] = useState({
    ratings: {
      athleticism: 0,
      ballSkills: 0,
      gameUnderstanding: 0,
      coachability: 0,
      effort: 0
    },
    metricNotes: {
      athleticism: '',
      ballSkills: '',
      gameUnderstanding: '',
      coachability: '',
      effort: ''
    },
    overallImpression: 0,
    notes: '',
    teamRecommendation: null,
    evalStatus: 'draft'
  });

  const isSessionClosed = session?.status === 'closed';

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      clearTimeout(autoSaveTimerRef.current);
      clearTimeout(metricNoteSaveTimerRef.current);
      clearTimeout(notesSaveTimerRef.current);
    };
  }, []);

  // Load session data
  useEffect(() => {
    const loadSession = async () => {
      setLoading(true);
      const result = await getTryoutSession(sessionId);
      if (result.success) {
        setSession(result.data);
      } else {
        setError(result.error || 'Failed to load session');
      }
      setLoading(false);
    };
    loadSession();
  }, [sessionId]);

  // Subscribe to existing evaluations
  useEffect(() => {
    if (!session || !currentUser) return;

    const assessorId = currentUser.uid;
    const unsubscribe = subscribeAssessorEvaluations(sessionId, assessorId, (evals) => {
      const evalsMap = {};
      evals.forEach(e => {
        evalsMap[e.playerId] = e;
      });
      setEvaluations(evalsMap);
    });

    return () => unsubscribe();
  }, [session, sessionId, currentUser]);

  // Current player
  const currentPlayer = session?.players?.[currentPlayerIndex];

  // Load current player's evaluation when player changes
  useEffect(() => {
    if (!currentPlayer) return;

    const defaultEval = {
      ratings: { athleticism: 0, ballSkills: 0, gameUnderstanding: 0, coachability: 0, effort: 0 },
      metricNotes: { athleticism: '', ballSkills: '', gameUnderstanding: '', coachability: '', effort: '' },
      overallImpression: 0,
      notes: '',
      teamRecommendation: null,
      evalStatus: 'draft'
    };

    const existingEval = evaluations[currentPlayer.id];
    if (existingEval) {
      // Firestore data exists — use it and clear any localStorage backup
      const loaded = {
        ratings: existingEval.ratings || defaultEval.ratings,
        metricNotes: existingEval.metricNotes || defaultEval.metricNotes,
        overallImpression: existingEval.overallImpression || 0,
        notes: existingEval.notes || '',
        teamRecommendation: existingEval.teamRecommendation || null,
        evalStatus: existingEval.evalStatus || 'draft'
      };
      setCurrentEval(loaded);
      currentEvalRef.current = loaded;
      clearLocalStorage(currentPlayer.id);
    } else {
      // No Firestore data — try localStorage fallback
      const cached = loadFromLocalStorage(currentPlayer.id);
      const loaded = cached || defaultEval;
      setCurrentEval(loaded);
      currentEvalRef.current = loaded;
    }
    // Collapse all metric notes when switching players
    setExpandedNotes({});
  }, [currentPlayer, evaluations]);

  // Save evaluation with status
  const handleSave = useCallback(async (evalData = currentEval, status = null, playerId = null) => {
    const targetPlayer = playerId
      ? session?.players?.find(p => p.id === playerId)
      : currentPlayer;
    if (!targetPlayer || !currentUser || isSessionClosed) return;

    setSaving(true);
    const dataToSave = {
      sessionId,
      playerId: targetPlayer.id,
      playerName: targetPlayer.name,
      playerNumber: targetPlayer.number,
      assessorId: currentUser.uid,
      assessorName: userProfile?.displayName || 'Unknown',
      ...evalData,
      evalStatus: status || evalData.evalStatus || 'draft'
    };

    const result = await saveEvaluation(dataToSave);

    if (result.success) {
      setLastSaved(new Date());
      clearLocalStorage(targetPlayer.id);
      if (status && targetPlayer.id === currentPlayer?.id) {
        setCurrentEval(prev => {
          const updated = { ...prev, evalStatus: status };
          currentEvalRef.current = updated;
          return updated;
        });
      }
    }
    setSaving(false);
  }, [sessionId, session, currentPlayer, currentUser, userProfile, currentEval, isSessionClosed]);

  // Handle rating change with auto-save as draft
  const handleRatingChange = (metricId, value) => {
    if (isSessionClosed || currentEval.evalStatus === 'finalized') return;

    const newEval = {
      ...currentEval,
      ratings: {
        ...currentEval.ratings,
        [metricId]: Math.max(0, Math.min(5, value))
      },
      evalStatus: currentEval.evalStatus === 'submitted' ? 'submitted' : 'draft'
    };
    setCurrentEval(newEval);
    currentEvalRef.current = newEval;
    if (currentPlayer) saveToLocalStorage(currentPlayer.id, newEval);

    // Debounced auto-save
    clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => handleSave(newEval), 500);
  };

  // Handle metric note change
  const handleMetricNoteChange = (metricId, value) => {
    if (isSessionClosed || currentEval.evalStatus === 'finalized') return;

    const newEval = {
      ...currentEval,
      metricNotes: {
        ...currentEval.metricNotes,
        [metricId]: value
      }
    };
    setCurrentEval(newEval);
    currentEvalRef.current = newEval;
    if (currentPlayer) saveToLocalStorage(currentPlayer.id, newEval);

    // Debounced auto-save
    clearTimeout(metricNoteSaveTimerRef.current);
    metricNoteSaveTimerRef.current = setTimeout(() => handleSave(newEval), 1000);
  };

  // Toggle metric note expansion
  const toggleMetricNote = (metricId) => {
    setExpandedNotes(prev => ({ ...prev, [metricId]: !prev[metricId] }));
  };

  // Handle overall impression change
  const handleOverallChange = (value) => {
    if (isSessionClosed || currentEval.evalStatus === 'finalized') return;
    const newEval = { ...currentEval, overallImpression: value };
    setCurrentEval(newEval);
    currentEvalRef.current = newEval;
    if (currentPlayer) saveToLocalStorage(currentPlayer.id, newEval);
    handleSave(newEval);
  };

  // Handle team recommendation change
  const handleTeamChange = (teamId) => {
    if (isSessionClosed || currentEval.evalStatus === 'finalized') return;
    const newEval = { ...currentEval, teamRecommendation: teamId };
    setCurrentEval(newEval);
    currentEvalRef.current = newEval;
    if (currentPlayer) saveToLocalStorage(currentPlayer.id, newEval);
    handleSave(newEval);
  };

  // Handle notes change (debounced) — uses ref to avoid stale closure
  const handleNotesChange = (value) => {
    if (isSessionClosed || currentEval.evalStatus === 'finalized') return;
    setCurrentEval(prev => {
      const updated = { ...prev, notes: value };
      currentEvalRef.current = updated;
      if (currentPlayer) saveToLocalStorage(currentPlayer.id, updated);
      return updated;
    });
    clearTimeout(notesSaveTimerRef.current);
    notesSaveTimerRef.current = setTimeout(() => {
      // Read from ref to get the latest eval (avoids stale closure)
      handleSave({ ...currentEvalRef.current, notes: value });
    }, 1000);
  };

  // Submit evaluation (mark as submitted)
  const handleSubmit = () => {
    if (isSessionClosed || currentEval.evalStatus === 'finalized') return;
    handleSave(currentEval, 'submitted');
  };

  // Save as draft explicitly
  const handleSaveDraft = () => {
    if (isSessionClosed || currentEval.evalStatus === 'finalized') return;
    handleSave(currentEval, 'draft');
  };

  // Navigate to next/previous player — flush pending saves first
  const goToPlayer = (index) => {
    if (index < 0 || index >= session.players.length) return;

    // Cancel all pending debounce timers
    clearTimeout(autoSaveTimerRef.current);
    clearTimeout(metricNoteSaveTimerRef.current);
    clearTimeout(notesSaveTimerRef.current);

    // Immediately save current player's latest eval (from ref, not stale state)
    const latestEval = currentEvalRef.current;
    if (latestEval && currentPlayer && !isSessionClosed) {
      handleSave(latestEval, null, currentPlayer.id);
    }

    setCurrentPlayerIndex(index);
  };

  // Calculate progress with status breakdown
  const totalPlayers = session?.players?.length || 0;
  const submittedCount = Object.values(evaluations).filter(e => e.evalStatus === 'submitted' || e.evalStatus === 'finalized').length;
  const draftCount = Object.values(evaluations).filter(e => e.evalStatus === 'draft' || !e.evalStatus).length;
  const notStartedCount = Math.max(0, totalPlayers - submittedCount - draftCount);
  const progress = totalPlayers > 0 ? ((submittedCount + draftCount) / totalPlayers) * 100 : 0;

  // Get evaluation status for a player
  const getPlayerEvalStatus = (playerId) => {
    const ev = evaluations[playerId];
    if (!ev) return 'not-started';
    return ev.evalStatus || 'draft';
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a3d2e] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#1a8a68] border-t-[#22c55e] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white font-medium">Loading Tryout Session...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !session) {
    return (
      <div className="min-h-screen bg-[#0a3d2e] flex items-center justify-center p-4">
        <div className="bg-[#0d5943] border border-red-500 rounded-xl p-6 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-white font-bold text-lg mb-2">Session Not Found</h2>
          <p className="text-red-300 mb-4">{error || 'Unable to load tryout session'}</p>
          <button
            onClick={() => navigate(userProfile?.role === 'tryout_assessor' ? '/assessor' : '/admin/tryouts')}
            className="px-4 py-2 bg-[#1a8a68] hover:bg-[#22c55e] text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // No players
  if (!session.players || session.players.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a3d2e] flex items-center justify-center p-4">
        <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-6 text-center max-w-md">
          <Users className="w-12 h-12 text-[#4ade80] mx-auto mb-4" />
          <h2 className="text-white font-bold text-lg mb-2">No Players</h2>
          <p className="text-[#4ade80] mb-4">No players have been added to this session yet.</p>
          <button
            onClick={() => navigate(userProfile?.role === 'tryout_assessor' ? '/assessor' : '/admin/tryouts')}
            className="px-4 py-2 bg-[#1a8a68] hover:bg-[#22c55e] text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a3d2e] pb-32">
      {/* Session Closed Banner */}
      {isSessionClosed && (
        <div className="bg-red-500/20 border-b border-red-500/50 px-4 py-2 text-center">
          <p className="text-red-300 text-sm flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" />
            This session is closed. Evaluations are locked.
          </p>
        </div>
      )}

      {/* Header */}
      <div className={`border-b sticky top-0 z-20 ${
        session.sessionType === 'hour-1' ? 'bg-gradient-to-r from-[#0d5943] to-violet-900/30 border-violet-500/30' :
        session.sessionType === 'hour-2' ? 'bg-gradient-to-r from-[#0d5943] to-orange-900/30 border-orange-500/30' :
        'bg-[#0d5943] border-[#1a8a68]'
      }`}>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => navigate(userProfile?.role === 'tryout_assessor' ? '/assessor' : '/admin/tryouts')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>

            <div className="text-center flex-1">
              <div className="flex items-center justify-center gap-2 mb-1">
                {session.sessionType === 'hour-1' && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-500/30 text-violet-300 border border-violet-500/50">
                    Hour 1
                  </span>
                )}
                {session.sessionType === 'hour-2' && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-500/30 text-orange-300 border border-orange-500/50">
                    Hour 2
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#1a8a68]/50 text-white">
                  {session.ageGroup}
                </span>
              </div>
              <h1 className="text-white font-bold text-sm">{session.name}</h1>
              {(session.startTime || session.endTime) && (
                <p className="text-[#4ade80] text-xs flex items-center justify-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  {formatTime24to12(session.startTime)}{session.endTime && ` - ${formatTime24to12(session.endTime)}`}
                  {durationBetween(session.startTime, session.endTime) && (
                    <span className="text-white/40">
                      ({durationBetween(session.startTime, session.endTime)} min)
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Online/Offline indicator */}
            <HelpTooltip text={isOnline ? 'Connected — scores sync in real time.' : 'Offline — scores save locally and sync when you reconnect.'}>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                isOnline ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              </div>
            </HelpTooltip>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-[#0a3d2e] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  session.sessionType === 'hour-1' ? 'bg-violet-500' :
                  session.sessionType === 'hour-2' ? 'bg-orange-500' :
                  'bg-[#22c55e]'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-medium whitespace-nowrap">
              <span className="text-blue-400">{submittedCount}</span>
              {draftCount > 0 && <span className="text-amber-400"> / {draftCount}d</span>}
              <span className="text-white/40"> / {totalPlayers}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Player Card */}
      <div className="px-4 py-4">
        <div className="bg-gradient-to-br from-[#0d5943] to-[#0a4a38] border-2 border-[#1a8a68] rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between">
            {/* Previous Button */}
            <button
              onClick={() => goToPlayer(currentPlayerIndex - 1)}
              disabled={currentPlayerIndex === 0}
              className="p-3 bg-[#0a3d2e] border border-[#1a8a68] rounded-xl disabled:opacity-30 hover:border-[#22c55e] transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>

            {/* Player Info */}
            <div className="text-center flex-1 px-4">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg ${
                currentPlayer?.promotedFromHour1
                  ? 'bg-orange-500 shadow-orange-500/30'
                  : 'bg-[#22c55e] shadow-[#22c55e]/30'
              }`}>
                <span className="text-[#0a3d2e] text-3xl font-bold">
                  {currentPlayer?.number || '?'}
                </span>
              </div>
              <h2 className="text-white font-bold text-xl">{currentPlayer?.name}</h2>
              {currentPlayer?.promotedFromHour1 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-500/20 text-orange-300 text-xs rounded-full mt-1">
                  Promoted from Hour 1
                </span>
              )}
              {currentPlayer?.age && (
                <p className="text-[#4ade80] text-sm">Age {currentPlayer.age}</p>
              )}
              <p className="text-[#1a8a68] text-xs mt-1">
                Player {currentPlayerIndex + 1} of {totalPlayers}
              </p>
              {/* Evaluation Status Badge */}
              {currentEval.evalStatus === 'finalized' ? (
                <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/50">
                  <Lock className="w-3 h-3" />
                  Finalized
                </span>
              ) : currentEval.evalStatus === 'submitted' ? (
                <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/50">
                  <CheckCircle className="w-3 h-3" />
                  Submitted
                </span>
              ) : evaluations[currentPlayer?.id] ? (
                <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full border border-amber-500/50">
                  <FileText className="w-3 h-3" />
                  Draft
                </span>
              ) : null}
            </div>

            {/* Next Button */}
            <button
              onClick={() => goToPlayer(currentPlayerIndex + 1)}
              disabled={currentPlayerIndex === totalPlayers - 1}
              className="p-3 bg-[#0a3d2e] border border-[#1a8a68] rounded-xl disabled:opacity-30 hover:border-[#22c55e] transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Rating Metrics with Collapsible Notes */}
        <div className="space-y-3 mb-4">
          {EVAL_METRICS.map((metric, metricIdx) => (
            <div
              key={metric.id}
              className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  {metricIdx === 0 ? (
                    <HelpTooltip text="Rate each metric from 1 (lowest) to 5 (highest). Use the full range for best results.">
                      <h3 className="text-white font-medium text-sm">{metric.name}</h3>
                    </HelpTooltip>
                  ) : (
                    <h3 className="text-white font-medium text-sm">{metric.name}</h3>
                  )}
                  <p className="text-[#1a8a68] text-xs">{metric.description}</p>
                </div>
                <span className="text-2xl font-bold text-[#4ade80] w-8 text-right">
                  {currentEval.ratings[metric.id] || '-'}
                </span>
              </div>

              {/* Rating Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRatingChange(metric.id, currentEval.ratings[metric.id] - 1)}
                  disabled={currentEval.ratings[metric.id] <= 0 || isSessionClosed || currentEval.evalStatus === 'finalized'}
                  className="w-12 h-12 bg-[#0a3d2e] border border-[#1a8a68] rounded-xl flex items-center justify-center disabled:opacity-30 hover:border-red-500 hover:text-red-400 transition-colors"
                >
                  <Minus className="w-6 h-6 text-white" />
                </button>

                <div className="flex-1 flex justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={() => handleRatingChange(metric.id, level)}
                      disabled={isSessionClosed || currentEval.evalStatus === 'finalized'}
                      className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${
                        currentEval.ratings[metric.id] === level
                          ? 'bg-[#22c55e] text-[#0a3d2e] scale-110'
                          : currentEval.ratings[metric.id] >= level
                            ? 'bg-[#22c55e]/50 text-white'
                            : 'bg-[#0a3d2e] border border-[#1a8a68] text-[#1a8a68]'
                      } ${(isSessionClosed || currentEval.evalStatus === 'finalized') ? 'opacity-60' : ''}`}
                    >
                      {level}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handleRatingChange(metric.id, currentEval.ratings[metric.id] + 1)}
                  disabled={currentEval.ratings[metric.id] >= 5 || isSessionClosed || currentEval.evalStatus === 'finalized'}
                  className="w-12 h-12 bg-[#0a3d2e] border border-[#1a8a68] rounded-xl flex items-center justify-center disabled:opacity-30 hover:border-green-500 hover:text-green-400 transition-colors"
                >
                  <Plus className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Collapsible Metric Note */}
              <div className="mt-2">
                <button
                  onClick={() => toggleMetricNote(metric.id)}
                  className="flex items-center gap-1 text-xs text-white/40 hover:text-[#4ade80] transition-colors w-full"
                >
                  {expandedNotes[metric.id] ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                  <MessageSquare className="w-3 h-3" />
                  {currentEval.metricNotes[metric.id]
                    ? <span className="text-[#4ade80]">Note added</span>
                    : 'Add note'
                  }
                </button>
                {expandedNotes[metric.id] && (
                  <textarea
                    value={currentEval.metricNotes[metric.id] || ''}
                    onChange={(e) => handleMetricNoteChange(metric.id, e.target.value)}
                    placeholder={`Notes on ${metric.name.toLowerCase()}...`}
                    rows={2}
                    disabled={isSessionClosed || currentEval.evalStatus === 'finalized'}
                    className="w-full mt-2 px-3 py-2 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg text-white placeholder-[#1a8a68] focus:border-[#22c55e] focus:outline-none resize-none text-sm disabled:opacity-50"
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Overall Impression */}
        <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4 mb-4">
          <h3 className="text-white font-medium mb-3">Overall Impression</h3>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleOverallChange(star)}
                disabled={isSessionClosed || currentEval.evalStatus === 'finalized'}
                className="p-2"
              >
                <Star
                  className={`w-10 h-10 transition-all ${
                    currentEval.overallImpression >= star
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-[#1a8a68]'
                  } ${(isSessionClosed || currentEval.evalStatus === 'finalized') ? 'opacity-60' : ''}`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Team Recommendation */}
        <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4 mb-4">
          <HelpTooltip text="Suggest which team level this player belongs in. Coaches use these as one input for team placement.">
            <h3 className="text-white font-medium mb-3">Team Recommendation</h3>
          </HelpTooltip>
          <div className="grid grid-cols-3 gap-2">
            {TEAM_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => handleTeamChange(option.id)}
                disabled={isSessionClosed || currentEval.evalStatus === 'finalized'}
                className={`py-3 rounded-xl font-medium text-sm transition-all ${
                  currentEval.teamRecommendation === option.id
                    ? `${option.color} text-white`
                    : 'bg-[#0a3d2e] border border-[#1a8a68] text-white hover:border-[#22c55e]'
                } ${(isSessionClosed || currentEval.evalStatus === 'finalized') ? 'opacity-60' : ''}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4 mb-4">
          <h3 className="text-white font-medium mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#4ade80]" />
            General Notes
          </h3>
          <textarea
            value={currentEval.notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Any overall observations or comments..."
            rows={3}
            disabled={isSessionClosed || currentEval.evalStatus === 'finalized'}
            className="w-full px-4 py-3 bg-[#0a3d2e] border border-[#1a8a68] rounded-xl text-white placeholder-[#1a8a68] focus:border-[#22c55e] focus:outline-none resize-none disabled:opacity-50"
          />
        </div>
      </div>

      {/* Player Quick Jump */}
      <div className="fixed bottom-24 left-0 right-0 px-4 z-10">
        <div className="flex gap-1 justify-center overflow-x-auto py-2 hide-scrollbar">
          {session.players.map((player, index) => {
            const status = getPlayerEvalStatus(player.id);
            return (
              <button
                key={player.id}
                onClick={() => goToPlayer(index)}
                className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold transition-all ${
                  index === currentPlayerIndex
                    ? 'bg-[#22c55e] text-[#0a3d2e] scale-110'
                    : status === 'submitted' || status === 'finalized'
                      ? 'bg-blue-500/30 text-blue-400 border border-blue-500'
                      : status === 'draft'
                        ? 'bg-amber-500/30 text-amber-400 border border-amber-500'
                        : 'bg-[#0a3d2e] border border-[#1a8a68] text-[#1a8a68]'
                }`}
              >
                {player.number || index + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0d5943] border-t border-[#1a8a68] px-4 py-3 z-20">
        <div className="flex items-center justify-between gap-3">
          {/* Save Status */}
          <div className="flex items-center gap-2 text-xs min-w-0">
            {saving ? (
              <span className="flex items-center gap-1 text-[#4ade80]">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </span>
            ) : lastSaved ? (
              <span className="flex items-center gap-1 text-green-400">
                <CheckCircle className="w-4 h-4" />
                Saved
              </span>
            ) : null}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {/* Prev */}
            <button
              onClick={() => goToPlayer(currentPlayerIndex - 1)}
              disabled={currentPlayerIndex === 0}
              className="px-3 py-2 bg-[#0a3d2e] border border-[#1a8a68] text-white rounded-lg disabled:opacity-30 flex items-center gap-1 text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Save Draft / Submit / Next / Done */}
            {isSessionClosed || currentEval.evalStatus === 'finalized' ? (
              // Locked - just show Next/Done
              currentPlayerIndex < totalPlayers - 1 ? (
                <button
                  onClick={() => goToPlayer(currentPlayerIndex + 1)}
                  className="px-5 py-2 bg-[#1a8a68] text-white font-medium rounded-lg flex items-center gap-1 text-sm"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => navigate(userProfile?.role === 'tryout_assessor' ? '/assessor' : '/admin/tryouts')}
                  className="px-5 py-2 bg-[#1a8a68] text-white font-medium rounded-lg flex items-center gap-1 text-sm"
                >
                  <Check className="w-4 h-4" /> Done
                </button>
              )
            ) : (
              <>
                {/* Save Draft */}
                {currentEval.evalStatus !== 'submitted' && (
                  <button
                    onClick={handleSaveDraft}
                    className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg flex items-center gap-1 text-sm"
                  >
                    <Save className="w-4 h-4" />
                    Draft
                  </button>
                )}

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  className={`px-3 py-2 rounded-lg flex items-center gap-1 text-sm font-medium ${
                    currentEval.evalStatus === 'submitted'
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#22c55e] hover:bg-[#4ade80] text-[#0a3d2e]'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  {currentEval.evalStatus === 'submitted' ? 'Submitted' : 'Submit'}
                </button>

                {/* Next / Done */}
                {currentPlayerIndex < totalPlayers - 1 ? (
                  <button
                    onClick={() => goToPlayer(currentPlayerIndex + 1)}
                    className="px-3 py-2 bg-[#0a3d2e] border border-[#1a8a68] text-white rounded-lg flex items-center gap-1 text-sm"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => navigate(userProfile?.role === 'tryout_assessor' ? '/assessor' : '/admin/tryouts')}
                    className="px-3 py-2 bg-[#0a3d2e] border border-[#1a8a68] text-white rounded-lg flex items-center gap-1 text-sm"
                  >
                    <Check className="w-4 h-4" /> Done
                  </button>
                )}
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default TryoutAssessorPage;
