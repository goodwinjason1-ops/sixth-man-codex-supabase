import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import {
  saveScoutEvaluation, subscribeScoutEvaluations,
  SCOUT_METRICS, TRYOUT_LEVEL_LABELS, TRYOUT_LEVEL_COLORS, TRYOUT_SCORING_CRITERIA,
  SCOUT_TO_TRYOUT_METRIC_MAP
} from '../services/scoutService';
import {
  ArrowLeft, Check, Star, Save, Users, Clock, MapPin,
  ChevronLeft, ChevronRight, MessageSquare, CheckCircle, Loader2,
  AlertCircle, Wifi, WifiOff, ChevronDown, ChevronUp, Send, Info, X
} from 'lucide-react';

const ScoutAssessmentPage = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();

  // Game & player data
  const [game, setGame] = useState(null);
  const [players, setPlayers] = useState([]);
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
  // Scoring criteria tooltip state
  const [showCriteriaTooltip, setShowCriteriaTooltip] = useState(null);
  // Submit All Drafts state
  const [showSubmitAllConfirm, setShowSubmitAllConfirm] = useState(false);
  const [submitAllProgress, setSubmitAllProgress] = useState(null);

  // Debounce timer refs
  const autoSaveTimerRef = useRef(null);
  const metricNoteSaveTimerRef = useRef(null);
  const notesSaveTimerRef = useRef(null);

  // Ref to always have latest currentEval (avoids stale closures)
  const currentEvalRef = useRef(null);

  // localStorage backup helpers
  const getLocalStorageKey = (playerId) =>
    `scout_eval_${gameId}_${playerId}_${currentUser?.uid}`;

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

  // Default evaluation shape
  const defaultEval = {
    ratings: {
      skillsTechnique: 0,
      gameAwareness: 0,
      athleticism: 0,
      attitudeCoachability: 0,
      teamworkCommunication: 0
    },
    metricNotes: {
      skillsTechnique: '',
      gameAwareness: '',
      athleticism: '',
      attitudeCoachability: '',
      teamworkCommunication: ''
    },
    notes: '',
    evalStatus: 'draft'
  };

  // Current player's evaluation (local state)
  const [currentEval, setCurrentEval] = useState(defaultEval);

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

  // Load game data and players
  useEffect(() => {
    const loadGameAndPlayers = async () => {
      setLoading(true);
      try {
        // Load game document
        const gameDoc = await getDoc(doc(db, 'games', gameId));
        if (!gameDoc.exists()) {
          setError('Game not found');
          setLoading(false);
          return;
        }
        const gameData = { id: gameDoc.id, ...gameDoc.data() };
        setGame(gameData);

        // Load players for this game's team
        if (gameData.teamId) {
          const playersQuery = query(
            collection(db, 'players'),
            where('teamId', '==', gameData.teamId)
          );
          const playersSnap = await getDocs(playersQuery);
          const playersList = playersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          // Sort by number then name
          playersList.sort((a, b) => {
            const numA = parseInt(a.number) || 999;
            const numB = parseInt(b.number) || 999;
            if (numA !== numB) return numA - numB;
            return (a.name || '').localeCompare(b.name || '');
          });
          setPlayers(playersList);
        }
      } catch (err) {
        console.error('Error loading game:', err);
        setError(err.message || 'Failed to load game');
      }
      setLoading(false);
    };
    loadGameAndPlayers();
  }, [gameId]);

  // Subscribe to existing evaluations
  useEffect(() => {
    if (!game || !currentUser) return;

    const scoutId = currentUser.uid;
    const unsubscribe = subscribeScoutEvaluations(gameId, scoutId, (evals) => {
      const evalsMap = {};
      evals.forEach(e => {
        evalsMap[e.playerId] = e;
      });
      setEvaluations(evalsMap);
    });

    return () => unsubscribe();
  }, [game, gameId, currentUser]);

  // Current player
  const currentPlayer = players[currentPlayerIndex];

  // Load current player's evaluation when player changes
  useEffect(() => {
    if (!currentPlayer) return;

    // Sanitize ratings to ensure all values are 0-5
    const sanitizeRatings = (ratings) => {
      const safe = { ...defaultEval.ratings };
      if (ratings && typeof ratings === 'object') {
        Object.keys(safe).forEach(key => {
          const v = typeof ratings[key] === 'number' ? ratings[key] : 0;
          safe[key] = Math.max(0, Math.min(5, v));
        });
      }
      return safe;
    };

    const existingEval = evaluations[currentPlayer.id];
    if (existingEval) {
      // Firestore data exists — use it and clear any localStorage backup
      const loaded = {
        ratings: sanitizeRatings(existingEval.ratings),
        metricNotes: existingEval.metricNotes || { ...defaultEval.metricNotes },
        notes: existingEval.notes || '',
        evalStatus: existingEval.evalStatus || existingEval.status || 'draft'
      };
      setCurrentEval(loaded);
      currentEvalRef.current = loaded;
      clearLocalStorage(currentPlayer.id);
    } else {
      // No Firestore data — try localStorage fallback
      const cached = loadFromLocalStorage(currentPlayer.id);
      const loaded = cached
        ? { ...cached, ratings: sanitizeRatings(cached.ratings) }
        : { ...defaultEval };
      setCurrentEval(loaded);
      currentEvalRef.current = loaded;
    }
    // Collapse all metric notes when switching players
    setExpandedNotes({});
  }, [currentPlayer, evaluations]);

  // Save evaluation with status
  const handleSave = useCallback(async (evalData = currentEval, status = null, playerId = null) => {
    const targetPlayer = playerId
      ? players.find(p => p.id === playerId)
      : currentPlayer;
    if (!targetPlayer || !currentUser) return;

    setSaving(true);
    const dataToSave = {
      gameId,
      teamId: game?.teamId || '',
      playerId: targetPlayer.id,
      playerName: targetPlayer.name || targetPlayer.displayName || '',
      playerNumber: targetPlayer.number || '',
      scoutId: currentUser.uid,
      scoutName: userProfile?.displayName || 'Unknown',
      ratings: evalData.ratings,
      metricNotes: evalData.metricNotes,
      notes: evalData.notes,
      status: status || evalData.evalStatus || 'draft',
      evalStatus: status || evalData.evalStatus || 'draft'
    };

    const result = await saveScoutEvaluation(dataToSave);

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
  }, [gameId, game, players, currentPlayer, currentUser, userProfile, currentEval]);

  // Handle rating change with auto-save as draft
  const handleRatingChange = (metricId, value) => {
    if (currentEval.evalStatus === 'finalized') return;

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
    if (currentEval.evalStatus === 'finalized') return;

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

  // Handle notes change (debounced) — uses ref to avoid stale closure
  const handleNotesChange = (value) => {
    if (currentEval.evalStatus === 'finalized') return;
    setCurrentEval(prev => {
      const updated = { ...prev, notes: value };
      currentEvalRef.current = updated;
      if (currentPlayer) saveToLocalStorage(currentPlayer.id, updated);
      return updated;
    });
    clearTimeout(notesSaveTimerRef.current);
    notesSaveTimerRef.current = setTimeout(() => {
      handleSave({ ...currentEvalRef.current, notes: value });
    }, 1000);
  };

  // Submit evaluation (mark as submitted)
  const handleSubmit = () => {
    if (currentEval.evalStatus === 'finalized') return;
    handleSave(currentEval, 'submitted');
  };

  // Save as draft explicitly
  const handleSaveDraft = () => {
    if (currentEval.evalStatus === 'finalized') return;
    handleSave(currentEval, 'draft');
  };

  // Submit all draft evaluations at once
  const handleSubmitAllDrafts = async () => {
    setShowSubmitAllConfirm(false);

    const draftPlayers = players.filter(p => {
      const ev = evaluations[p.id];
      return ev && (ev.evalStatus === 'draft' || ev.status === 'draft' || (!ev.evalStatus && !ev.status));
    });

    if (draftPlayers.length === 0) return;
    setSubmitAllProgress({ done: 0, total: draftPlayers.length });

    for (let i = 0; i < draftPlayers.length; i++) {
      const player = draftPlayers[i];
      const ev = evaluations[player.id];
      const dataToSave = {
        gameId,
        teamId: game?.teamId || '',
        playerId: player.id,
        playerName: player.name || player.displayName || '',
        playerNumber: player.number || '',
        scoutId: currentUser.uid,
        scoutName: userProfile?.displayName || 'Unknown',
        ratings: ev.ratings || {},
        metricNotes: ev.metricNotes || {},
        notes: ev.notes || '',
        status: 'submitted',
        evalStatus: 'submitted'
      };
      await saveScoutEvaluation(dataToSave);
      setSubmitAllProgress({ done: i + 1, total: draftPlayers.length });
    }

    // Update current player's local state if it was a draft
    const currentPlayerEv = evaluations[currentPlayer?.id];
    if (currentPlayerEv && (currentPlayerEv.evalStatus === 'draft' || currentPlayerEv.status === 'draft' || (!currentPlayerEv.evalStatus && !currentPlayerEv.status))) {
      setCurrentEval(prev => ({ ...prev, evalStatus: 'submitted' }));
    }

    // Show completion briefly, then clear
    setTimeout(() => setSubmitAllProgress(null), 2000);
  };

  // Navigate to next/previous player — flush pending saves first
  const goToPlayer = (index) => {
    if (index < 0 || index >= players.length) return;

    // Cancel all pending debounce timers
    clearTimeout(autoSaveTimerRef.current);
    clearTimeout(metricNoteSaveTimerRef.current);
    clearTimeout(notesSaveTimerRef.current);

    // Immediately save current player's latest eval (from ref, not stale state)
    const latestEval = currentEvalRef.current;
    if (latestEval && currentPlayer) {
      handleSave(latestEval, null, currentPlayer.id);
    }

    setCurrentPlayerIndex(index);
  };

  // Calculate progress with status breakdown
  const totalPlayers = players.length;
  const submittedCount = Object.values(evaluations).filter(e => e.evalStatus === 'submitted' || e.status === 'submitted' || e.evalStatus === 'finalized').length;
  const draftCount = Object.values(evaluations).filter(e => {
    const s = e.evalStatus || e.status;
    return s === 'draft' || !s;
  }).length;
  const notStartedCount = Math.max(0, totalPlayers - submittedCount - draftCount);
  const progress = totalPlayers > 0 ? ((submittedCount + draftCount) / totalPlayers) * 100 : 0;

  // Get evaluation status for a player
  const getPlayerEvalStatus = (playerId) => {
    const ev = evaluations[playerId];
    if (!ev) return 'not-started';
    return ev.evalStatus || ev.status || 'draft';
  };

  // Format game date for header
  const formatGameDate = (dateVal) => {
    if (!dateVal) return '';
    try {
      const d = dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
      return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
    } catch (e) { return String(dateVal); }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F9F5] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D4E4D4] border-t-[#00A651] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-800 font-medium">Loading Game...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !game) {
    return (
      <div className="min-h-screen bg-[#F5F9F5] flex items-center justify-center p-4">
        <div className="bg-white border border-red-500 rounded-xl p-6 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-gray-800 font-bold text-lg mb-2">Game Not Found</h2>
          <p className="text-red-300 mb-4">{error || 'Unable to load game data'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-[#005028] hover:bg-[#00A651] text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // No players
  if (players.length === 0) {
    return (
      <div className="min-h-screen bg-[#F5F9F5] flex items-center justify-center p-4">
        <div className="bg-white border border-[#D4E4D4] rounded-xl p-6 text-center max-w-md">
          <Users className="w-12 h-12 text-[#00A651] mx-auto mb-4" />
          <h2 className="text-gray-800 font-bold text-lg mb-2">No Players</h2>
          <p className="text-[#6B7C6B] mb-4">No players found for this team roster.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-[#005028] hover:bg-[#00A651] text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F9F5] pb-44">
      {/* Header */}
      <div className="border-b border-emerald-900 sticky top-0 z-20 bg-gradient-to-r from-[#005028] to-emerald-800">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg transition-colors hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>

            <div className="text-center flex-1">
              <h1 className="font-bold text-sm text-white">
                {game.teamName || 'Team'} vs {game.opponent || 'Opponent'}
              </h1>
              <div className="flex items-center justify-center gap-3 mt-1">
                {game.date && (
                  <p className="text-white/80 text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatGameDate(game.date)}
                  </p>
                )}
                {game.venue && (
                  <p className="text-white/80 text-xs flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {game.venue}
                  </p>
                )}
              </div>
            </div>

            {/* Online/Offline indicator */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium ${
              isOnline
                ? 'bg-green-500/30 text-green-300'
                : 'bg-yellow-500/30 text-yellow-300'
            }`}>
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full overflow-hidden bg-white/20">
              <div
                className="h-full transition-all duration-300 bg-[#00A651]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-medium whitespace-nowrap">
              <span className="text-blue-300">{submittedCount}</span>
              {draftCount > 0 && <span className="text-amber-300"> / {draftCount}d</span>}
              <span className="text-white/50"> / {totalPlayers}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Player Card */}
      <div className="px-4 py-4">
        <div className="bg-gradient-to-br from-[#00A651] to-[#008c44] border-2 border-[#D4E4D4] rounded-2xl p-4 mb-4 transition-all duration-300">
          <div className="flex items-center justify-between">
            {/* Previous Button */}
            <button
              onClick={() => goToPlayer(currentPlayerIndex - 1)}
              disabled={currentPlayerIndex === 0}
              className="p-3 bg-white/90 border border-white/50 rounded-xl disabled:opacity-30 hover:bg-white transition-colors active:scale-95"
            >
              <ChevronLeft className="w-6 h-6 text-[#005028]" />
            </button>

            {/* Player Info */}
            <div className="text-center flex-1 px-4">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg bg-[#005028] shadow-[#005028]/30">
                <span className="text-white text-3xl font-bold">
                  {currentPlayer?.number || '?'}
                </span>
              </div>
              <h2 className="text-white font-bold text-xl">{currentPlayer?.name || currentPlayer?.displayName || 'Unknown'}</h2>
              {currentPlayer?.age && (
                <p className="text-white/80 text-sm">Age {currentPlayer.age}</p>
              )}
              <p className="text-white/60 text-xs mt-1">
                Player {currentPlayerIndex + 1} of {totalPlayers}
              </p>
              {/* Evaluation Status Badge */}
              {currentEval.evalStatus === 'finalized' ? (
                <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/50">
                  <CheckCircle className="w-3 h-3" />
                  Finalized
                </span>
              ) : currentEval.evalStatus === 'submitted' ? (
                <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/50">
                  <CheckCircle className="w-3 h-3" />
                  Submitted
                </span>
              ) : evaluations[currentPlayer?.id] ? (
                <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full border border-amber-500/50">
                  <Save className="w-3 h-3" />
                  Draft
                </span>
              ) : null}
            </div>

            {/* Next Button */}
            <button
              onClick={() => goToPlayer(currentPlayerIndex + 1)}
              disabled={currentPlayerIndex === totalPlayers - 1}
              className="p-3 bg-white/90 border border-white/50 rounded-xl disabled:opacity-30 hover:bg-white transition-colors active:scale-95"
            >
              <ChevronRight className="w-6 h-6 text-[#005028]" />
            </button>
          </div>
        </div>

        {/* Rating Guide Bar */}
        <div className="bg-white border border-[#D4E4D4] rounded-xl p-3 mb-3">
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
            {[1, 2, 3, 4, 5].map((level) => (
              <div key={level} className="flex items-center gap-1">
                <span
                  className="w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center text-white"
                  style={{ backgroundColor: TRYOUT_LEVEL_COLORS[level] }}
                >
                  {level}
                </span>
                <span className="text-[10px] text-[#6B7C6B]">{TRYOUT_LEVEL_LABELS[level]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rating Metrics with Collapsible Notes */}
        <div className="space-y-3 mb-4">
          {SCOUT_METRICS.map((metric) => {
            // Map scout metric ID to tryout metric ID for criteria lookup
            const tryoutMetricId = SCOUT_TO_TRYOUT_METRIC_MAP[metric.id];
            return (
              <div
                key={metric.id}
                className="bg-white border border-[#D4E4D4] rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-gray-800 font-medium text-sm">{metric.name}</h3>
                      <button
                        onClick={() => setShowCriteriaTooltip(showCriteriaTooltip === metric.id ? null : metric.id)}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <Info className="w-4 h-4 text-[#00A651]" />
                      </button>
                    </div>
                    <p className="text-[#6B7C6B] text-xs">{metric.description}</p>
                  </div>
                  <span className="text-2xl font-bold w-8 text-right" style={{ color: currentEval.ratings[metric.id] ? TRYOUT_LEVEL_COLORS[currentEval.ratings[metric.id]] : '#00A651' }}>
                    {currentEval.ratings[metric.id] || '-'}
                  </span>
                </div>

                {/* Scoring Criteria Tooltip */}
                {showCriteriaTooltip === metric.id && tryoutMetricId && TRYOUT_SCORING_CRITERIA[tryoutMetricId] && (
                  <div className="mb-3 bg-gray-900 rounded-lg p-3 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-[#00A651] text-xs font-medium">
                        {metric.name} — Scoring Guide
                      </h5>
                      <button
                        onClick={() => setShowCriteriaTooltip(null)}
                        className="text-gray-400 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div key={level} className="flex gap-2">
                          <span
                            className="w-5 h-5 flex-shrink-0 rounded text-[10px] font-bold flex items-center justify-center text-white"
                            style={{ backgroundColor: TRYOUT_LEVEL_COLORS[level] }}
                          >
                            {level}
                          </span>
                          <div className="flex-1">
                            <span className="text-[10px] font-medium" style={{ color: TRYOUT_LEVEL_COLORS[level] }}>{TRYOUT_LEVEL_LABELS[level]}: </span>
                            <span className="text-gray-300 text-[10px]">{TRYOUT_SCORING_CRITERIA[tryoutMetricId][level]}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rating Buttons */}
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={() => handleRatingChange(metric.id, level)}
                      disabled={currentEval.evalStatus === 'finalized'}
                      className={`w-12 h-12 rounded-lg font-bold text-base transition-all ${
                        currentEval.ratings[metric.id] === level
                          ? 'text-white scale-110 ring-2 ring-white/30'
                          : currentEval.ratings[metric.id] > level && currentEval.ratings[metric.id] > 0
                            ? 'text-white/80'
                            : 'bg-[#F5F9F5] border border-[#D4E4D4] text-[#6B7C6B]'
                      } ${currentEval.evalStatus === 'finalized' ? 'opacity-60' : ''}`}
                      style={
                        currentEval.ratings[metric.id] >= level && currentEval.ratings[metric.id] > 0
                          ? { backgroundColor: TRYOUT_LEVEL_COLORS[level] }
                          : undefined
                      }
                    >
                      {level}
                    </button>
                  ))}
                </div>

                {/* Level Label */}
                {currentEval.ratings[metric.id] > 0 && (
                  <p className="text-center text-xs mt-2 font-medium" style={{ color: TRYOUT_LEVEL_COLORS[currentEval.ratings[metric.id]] }}>
                    {TRYOUT_LEVEL_LABELS[currentEval.ratings[metric.id]]}
                  </p>
                )}

                {/* Collapsible Metric Note */}
                <div className="mt-2">
                  <button
                    onClick={() => toggleMetricNote(metric.id)}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#00A651] transition-colors w-full"
                  >
                    {expandedNotes[metric.id] ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                    <MessageSquare className="w-3 h-3" />
                    {currentEval.metricNotes[metric.id]
                      ? <span className="text-[#00A651]">Note added</span>
                      : 'Add note'
                    }
                  </button>
                  {expandedNotes[metric.id] && (
                    <textarea
                      value={currentEval.metricNotes[metric.id] || ''}
                      onChange={(e) => handleMetricNoteChange(metric.id, e.target.value)}
                      placeholder={`Notes on ${metric.name.toLowerCase()}...`}
                      rows={2}
                      disabled={currentEval.evalStatus === 'finalized'}
                      className="w-full mt-2 px-3 py-2 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 placeholder-gray-400 focus:border-[#00A651] focus:outline-none resize-none text-sm disabled:opacity-50"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* General Notes */}
        <div className="bg-white border border-[#D4E4D4] rounded-xl p-4 mb-4">
          <h3 className="text-gray-800 font-medium mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#00A651]" />
            General Notes
          </h3>
          <textarea
            value={currentEval.notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Any overall observations or comments..."
            rows={3}
            disabled={currentEval.evalStatus === 'finalized'}
            className="w-full px-4 py-3 bg-[#F5F9F5] border border-[#D4E4D4] rounded-xl text-gray-800 placeholder-gray-400 focus:border-[#00A651] focus:outline-none resize-none disabled:opacity-50"
          />
        </div>
      </div>

      {/* Player Quick Jump */}
      <div className="fixed left-0 right-0 z-49 bg-white border-t border-gray-200" style={{bottom: '90px'}}>
        <div className="flex gap-1 justify-center overflow-x-auto py-1 px-4 hide-scrollbar">
          {players.map((player, index) => {
            const status = getPlayerEvalStatus(player.id);
            return (
              <button
                key={player.id}
                onClick={() => goToPlayer(index)}
                className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold transition-all ${
                  index === currentPlayerIndex
                    ? 'bg-[#005028] text-white scale-110'
                    : status === 'submitted' || status === 'finalized'
                      ? 'bg-blue-500/30 text-blue-400 border border-blue-500'
                      : status === 'draft'
                        ? 'bg-amber-500/30 text-amber-400 border border-amber-500'
                        : 'bg-[#F5F9F5] border border-[#D4E4D4] text-[#6B7C6B]'
                }`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit All Drafts Confirmation */}
      {showSubmitAllConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-gray-800 font-bold text-lg mb-2">Submit All Drafts?</h3>
            <p className="text-gray-600 text-sm mb-4">
              This will submit <span className="font-bold text-amber-600">{draftCount}</span> draft evaluation{draftCount !== 1 ? 's' : ''}. Submitted evaluations cannot be edited.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitAllConfirm(false)}
                className="flex-1 px-4 py-2 bg-[#F5F9F5] border border-[#D4E4D4] text-gray-800 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitAllDrafts}
                className="flex-1 px-4 py-2 bg-[#005028] hover:bg-[#00A651] text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1"
              >
                <Send className="w-4 h-4" />
                Submit All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#D4E4D4] px-4 py-2 z-50">
        {/* Row 1: Save status + Submit All */}
        <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
          <div className="flex items-center gap-2 text-xs">
            {submitAllProgress ? (
              <span className="flex items-center gap-1 text-[#005028] font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {submitAllProgress.done === submitAllProgress.total
                  ? `All ${submitAllProgress.total} submitted!`
                  : `Submitting ${submitAllProgress.done}/${submitAllProgress.total}...`}
              </span>
            ) : saving ? (
              <span className="flex items-center gap-1 text-[#00A651]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving...
              </span>
            ) : lastSaved ? (
              <span className="flex items-center gap-1 text-green-500">
                <CheckCircle className="w-3.5 h-3.5" />
                Saved
              </span>
            ) : null}
          </div>
          {/* Submit All Drafts — visible when any drafts exist */}
          {draftCount >= 1 && !submitAllProgress && (
            <button
              onClick={() => setShowSubmitAllConfirm(true)}
              className="px-3 py-1 bg-[#005028] hover:bg-[#00A651] text-white rounded-md text-xs font-medium flex items-center gap-1"
            >
              <Send className="w-3 h-3" />
              Submit All Drafts ({draftCount})
            </button>
          )}
        </div>

        {/* Row 2: Action buttons — full width */}
        <div className="flex items-center gap-2">
          {/* Prev */}
          <button
            onClick={() => goToPlayer(currentPlayerIndex - 1)}
            disabled={currentPlayerIndex === 0}
            className="px-3 py-2.5 bg-[#F5F9F5] border border-[#D4E4D4] text-gray-800 rounded-lg disabled:opacity-30 flex items-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {currentEval.evalStatus === 'finalized' ? (
            // Locked — just show Next/Done
            currentPlayerIndex < totalPlayers - 1 ? (
              <button
                onClick={() => goToPlayer(currentPlayerIndex + 1)}
                className="flex-1 py-2.5 bg-[#D4E4D4] text-gray-800 font-medium rounded-lg flex items-center justify-center gap-1 text-sm"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => navigate(-1)}
                className="flex-1 py-2.5 bg-[#D4E4D4] text-gray-800 font-medium rounded-lg flex items-center justify-center gap-1 text-sm"
              >
                <Check className="w-4 h-4" /> Done
              </button>
            )
          ) : (
            <>
              {/* Draft */}
              {currentEval.evalStatus !== 'submitted' && (
                <button
                  onClick={handleSaveDraft}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-white rounded-lg flex items-center justify-center gap-1.5 text-sm font-medium"
                >
                  <Save className="w-4 h-4" />
                  Save Draft
                </button>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-sm font-medium ${
                  currentEval.evalStatus === 'submitted'
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#005028] hover:bg-[#00A651] text-white'
                }`}
              >
                <Send className="w-4 h-4" />
                {currentEval.evalStatus === 'submitted' ? 'Submitted' : 'Submit'}
              </button>

              {/* Next / Done */}
              {currentPlayerIndex < totalPlayers - 1 ? (
                <button
                  onClick={() => goToPlayer(currentPlayerIndex + 1)}
                  className="px-3 py-2.5 bg-[#F5F9F5] border border-[#D4E4D4] text-gray-800 rounded-lg flex items-center"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => navigate(-1)}
                  className="px-3 py-2.5 bg-[#F5F9F5] border border-[#D4E4D4] text-gray-800 rounded-lg flex items-center gap-1 text-sm"
                >
                  <Check className="w-4 h-4" /> Done
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScoutAssessmentPage;
